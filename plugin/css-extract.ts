import { glob, readFile } from "fs/promises"
import { type PluginOption } from "vite"

// const REGEX_JS_COMMENT = /\/\*[\s\S]*?\*\/|\/\/.*/g
const REGEX_CSS_TEMPLATE_LITERAL = /css\`([^\`]*)\`/gs

const CSS_COMPTIME = "preact-css-extract/comptime"
const CSS_COMPTIME_RESOLVED = "\0" + CSS_COMPTIME

const DEFAULT_GLOB_PATTERN = "src/**/*.{js,ts,jsx,tsx}"

function hashCSS(cssContent: string) {
    const hash = Array.from(cssContent.replace(/\s+/g, " ")).reduce(
        (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
        0
    )
    return Math.abs(hash).toString(36)
}

function generateCSS(cssContent: string) {
    const className = "css-" + hashCSS(cssContent)
    const wrappedCss = `.${className} {\n${cssContent}\n}`
    return { className, wrappedCss }
}

async function arrayFromAsync<T>(asyncIterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = []
    for await (const item of asyncIterable) {
        result.push(item)
    }
    return result
}

async function extractDriectives(pattern: string | string[]): Promise<{
    directives: Map<string, string>
    entries: string[]
}> {
    const directives = new Map<string, string>()

    console.time("[css-extract] Extraction completed in")

    const entries = await arrayFromAsync(glob(pattern))

    await Promise.all(
        entries.map(async entry => {
            console.log("[css-extract] Scanning", entry)

            const source = await readFile(entry, "utf-8")
            let match

            while ((match = REGEX_CSS_TEMPLATE_LITERAL.exec(source)) !== null) {
                const cssContent = match[1] || ""
                const { className, wrappedCss } = generateCSS(cssContent)
                directives.set(className, wrappedCss)
            }
        })
    )

    console.timeEnd("[css-extract] Extraction completed in")

    return {
        directives,
        entries,
    }
}

export const cssExtractPlugin = ({ pattern }: { pattern?: string | string[] } = {}): PluginOption => {
    let lastResult: {
        directives: Map<string, string>
        entries: string[]
    } | null = null

    const registeredCSSFiles = new Set<string>()

    return [
        {
            name: "vite-plugin-css-extract",
            enforce: "pre",

            // async buildStart() {
            //     lastResult = await extractDriectives(pattern ?? DEFAULT_GLOB_PATTERN)
            //     extractedCSS = Array.from(lastResult.directives.values()).join("\n\n")
            // },

            // async watchChange(id) {
            // Re-extract styles on file change
            // console.log("[css-extract] File changed, re-extracting styles:", id)
            // },

            resolveId(id) {
                // Resolve the "preact-css-extract/comptime" virtual module
                if (id === CSS_COMPTIME) {
                    return CSS_COMPTIME_RESOLVED
                }
                if (id === "extracted-css") {
                    return "\0extracted-css"
                }

                // if (id === "main.css") {
                //     return "\0main.css"
                // }
            },

            // hotUpdate({ file, server, timestamp }) {
            //     // Re-extract styles on HMR update
            //     console.log("[css-extract] HMR update detected, re-extracting styles:", file)

            //     const seen = new Set<ModuleNode>()

            //     for (const mod of registeredCSSFiles) {
            //         const module = server.moduleGraph.getModuleById(mod)
            //         if (module) {
            //             console.log("[css-extract] Invalidating module:", module.id)
            //             server.moduleGraph.invalidateModule(module, seen, timestamp, true, false)
            //         }
            //     }

            //     console.log("[css-extract] Re-extraction completed.", seen)
            // },

            async load(id) {
                if (id === CSS_COMPTIME_RESOLVED) {
                    return `export const css = () => "css-comptime-placeholder";`
                }

                if (id === "\0extracted-css") {
                    const { directives } = await extractDriectives(pattern ?? DEFAULT_GLOB_PATTERN)
                    const extractedCSS = Array.from(directives.values()).join("\n\n")
                    // return extractedCSS

                    const ref = this.emitFile({
                        type: "asset",
                        fileName: "extracted.css",
                        source: extractedCSS,
                    })

                    console.log("[css-extract] Emitted extracted.css with ref", ref)

                    return `export default import.meta.ROLLUP_FILE_URL_${ref};`
                }

                return null
            },

            async transform(code, id) {
                if (id.match(/\.(js|jsx|ts|tsx)$/) && !id.includes("node_modules")) {
                    let match
                    let transformedCode = code

                    while ((match = REGEX_CSS_TEMPLATE_LITERAL.exec(code)) !== null) {
                        const cssContent = match[1] ?? ""
                        const { className } = generateCSS(cssContent)

                        transformedCode = transformedCode.replace(match[0], `"${className}"`)
                    }

                    return transformedCode !== code
                        ? {
                              code: transformedCode,
                          }
                        : null
                }

                if (id.match(/\.css$/) && code.includes("@extracted-css")) {
                    console.log("[css-extract] Transforming", id)

                    registeredCSSFiles.add(id)

                    lastResult = await extractDriectives(pattern ?? DEFAULT_GLOB_PATTERN)
                    const extractedCSS = Array.from(lastResult.directives.values()).join("\n\n")

                    lastResult.entries.forEach(file => this.addWatchFile(file))
                    // return code.replace("@extracted-css", extractedCSS)

                    return {
                        code: extractedCSS,
                    }
                }

                return null
            },
        },
    ]
}
