import { glob, readFile } from "fs/promises"
import { type Plugin, type ViteDevServer } from "vite"

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

type GeneratedCSSResult = {
    files: string[]
    css: string
    transformedCode: Record<string, string>
}

async function extractDriectives(pattern: string | string[]): Promise<GeneratedCSSResult> {
    const directives = new Map<string, string>()

    console.time("[css-extract] Extraction completed in")

    const entries = await arrayFromAsync(glob(pattern))

    const transformedCode = Object.fromEntries(
        await Promise.all(
            entries.map(async entry => {
                console.log("[css-extract] Scanning", entry)

                const source = await readFile(entry, "utf-8")

                return [
                    entry,
                    source.replaceAll(REGEX_CSS_TEMPLATE_LITERAL, (_, cssContent: string) => {
                        const { className, wrappedCss } = generateCSS(cssContent)
                        directives.set(className, wrappedCss)
                        return `"` + className + `"`
                    }),
                ]
            })
        )
    )

    console.timeEnd("[css-extract] Extraction completed in")

    return {
        files: entries,
        css: [...directives.values()].join("\n\n"),
        transformedCode: transformedCode,
    }
}

export const cssExtractPlugin = ({ pattern }: { pattern?: string | string[] } = {}): Plugin[] => {
    pattern ??= DEFAULT_GLOB_PATTERN

    // Shared state across all plugins
    let server: ViteDevServer | null = null
    let generatedCss: GeneratedCSSResult | null = null

    return [
        {
            name: "css-extract:scan",
            enforce: "pre",

            async configResolved(_config) {
                console.log("[css-extract] Config resolved")
            },

            configureServer(_server) {
                server = _server
            },

            resolveId(id: string) {
                if (id === CSS_COMPTIME) {
                    return CSS_COMPTIME_RESOLVED
                }
                return null
            },

            load(id: string) {
                if (id === CSS_COMPTIME_RESOLVED) {
                    return `export const css = () => "css-comptime-placeholder";`
                }

                return null
            },

            async buildStart() {
                console.log("[css-extract] Build started")

                // Find all JS/TS files
                const files = await arrayFromAsync(glob(pattern))

                // Watch files in dev mode
                if (server) {
                    files.forEach(file => {
                        console.log("[css-extract] Matched file:", file)
                        this.addWatchFile(file)
                    })
                }
            },

            // configureServer(_server) {
            //     server = _server

            // Listen for file changes and regenerate CSS
            // server.watcher.on("change", async file => {
            //     if (!server) return

            //     if (watchedFiles.some(watched => file.includes(watched))) {
            //         console.log("[css-extract] File changed:", file)
            //         // Read all files again
            //         // const contents = await Promise.all(watchedFiles.map(f => readFile(f, "utf-8")))

            //         // Regenerate CSS
            //         generatedCss = await extractDriectives(pattern ?? DEFAULT_GLOB_PATTERN).then(
            //             r => r.generatedCSS
            //         )

            //         // Trigger HMR for CSS modules
            //         const cssModules = Array.from(server.moduleGraph.urlToModuleMap.keys()).filter(
            //             url => url.endsWith(".css") && !url.includes("node_modules")
            //         )

            //         console.log("[css-extract] Triggering HMR for CSS modules:", cssModules)

            //         for (const url of cssModules) {
            //             const mod = server.moduleGraph.urlToModuleMap.get(url)
            //             if (mod) {
            //                 server.moduleGraph.invalidateModule(mod, new Set(), Date.now())
            //                 server.ws.send({
            //                     type: "update",
            //                     updates: [
            //                         {
            //                             type: "css-update",
            //                             path: url,
            //                             acceptedPath: url,
            //                             timestamp: Date.now(),
            //                         },
            //                     ],
            //                 })
            //             }
            //         }
            //     }
            // })
            // },

            async handleHotUpdate({ file, server }) {
                if (!generatedCss || generatedCss.files.some(f => file.includes(f))) {
                    console.log("[css-extract] File changed:", file)

                    // Regenerate CSS
                    generatedCss = await extractDriectives(pattern ?? DEFAULT_GLOB_PATTERN)

                    // Trigger HMR for CSS modules
                    const cssModules = Array.from(server.moduleGraph.urlToModuleMap.keys()).filter(
                        url => url.endsWith(".css") && !url.includes("node_modules")
                    )

                    console.log("[css-extract] Triggering HMR for CSS modules:", cssModules)

                    for (const url of cssModules) {
                        const mod = server.moduleGraph.urlToModuleMap.get(url)
                        if (mod) {
                            // server.moduleGraph.invalidateModule(mod, new Set(), timestamp)
                            server.reloadModule(mod)
                        }
                    }
                }
            },
        },

        {
            name: "css-plugin:generate:serve",
            apply: "serve",
            enforce: "pre",

            async transform(code, id) {
                if (id.includes("/node_modules/")) return null
                if (id === CSS_COMPTIME_RESOLVED) return null

                if (id.match(/\.(js|ts|jsx|tsx)$/)) {
                    let match
                    let transformedCode = code

                    while ((match = REGEX_CSS_TEMPLATE_LITERAL.exec(code)) !== null) {
                        const cssContent = match[1] ?? ""
                        const { className } = generateCSS(cssContent)

                        transformedCode = transformedCode.replace(match[0], `"${className}"`)
                    }

                    console.log("[css-extract] Transformed code for", id)
                    return {
                        code: transformedCode,
                        map: null,
                    }
                }

                if (id.endsWith(".css")) {
                    if (!generatedCss) {
                        generatedCss = await extractDriectives(pattern ?? DEFAULT_GLOB_PATTERN)
                    }

                    console.log("[css-extract] Injecting extracted CSS into", id)
                    return {
                        code: code.replace("@extracted-css", generatedCss.css),
                        map: null,
                    }
                }
            },
        },
        {
            name: "css-plugin:generate:build",
            apply: "build",
            enforce: "pre",

            async buildStart() {
                console.log("[css-extract] Build started - generating CSS")
                generatedCss = await extractDriectives(pattern ?? DEFAULT_GLOB_PATTERN)
            },

            async transform(code, id) {
                if (id.includes("/node_modules/")) return null
                if (id === CSS_COMPTIME_RESOLVED) return null

                if (id.match(/\.(js|ts|jsx|tsx)$/)) {
                    let match
                    let transformedCode = code

                    while ((match = REGEX_CSS_TEMPLATE_LITERAL.exec(code)) !== null) {
                        const cssContent = match[1] ?? ""
                        const { className } = generateCSS(cssContent)

                        transformedCode = transformedCode.replace(match[0], `"${className}"`)
                    }

                    console.log("[css-extract] Transformed code for", id)
                    return {
                        code: transformedCode,
                        map: null,
                    }
                }

                if (id.endsWith(".css") && generatedCss) {
                    console.log("[css-extract] Injecting extracted CSS into", id)
                    return {
                        code: code.replace("@extracted-css", generatedCss.css),
                        map: null,
                    }
                }
            },
        },
    ]
}
