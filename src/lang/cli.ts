#!/usr/bin/env bun

import { readFile } from "fs/promises"
import { resolve } from "path"
import { Interpreter } from "./interpreter"
import { InterpreterV2 } from "./interpreter-v2"
import { Lexer } from "./lexer"
import { parse } from "./parser"
import { TypeChecker, createDefaultTypeEnvironment } from "./type-checker"

// Parse command line arguments
const args = Bun.argv.slice(2)

let mode: "lexer" | "ast" | "eval" | "eval-v2" | "typecheck" | null = null
let expression: string | null = null
let filePath: string | null = null
let printSource = false
let prettyPrint = false

for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === "--lexer") {
        mode = "lexer"
    } else if (arg === "--ast") {
        mode = "ast"
    } else if (arg === "--eval") {
        mode = "eval"
    } else if (arg === "--eval-v2") {
        mode = "eval-v2"
    } else if (arg === "--typecheck") {
        mode = "typecheck"
    } else if (arg === "--print") {
        printSource = true
    } else if (arg === "--pretty") {
        prettyPrint = true
    } else if (arg === "-c") {
        i++
        const nextArg = args[i]
        if (nextArg === "-") {
            // Read from stdin
            expression = await Bun.stdin.text()
            expression = expression.trim()
        } else {
            expression = nextArg
        }
    } else if (!arg.startsWith("-")) {
        // Treat as file path
        filePath = arg
    }
}

// If no mode specified but a file is provided, default to eval mode
if (filePath && !mode) {
    mode = "eval"
}

if (!mode) {
    console.error(
        "Usage: cli.ts [--lexer|--ast|--eval|--eval-v2|--typecheck] [-c <expression>|<file.lang>] [--print] [--pretty]"
    )
    console.error("  --lexer              Output tokens from lexer")
    console.error("  --ast                Output AST")
    console.error("  --eval               Evaluate expression (default for files)")
    console.error("  --eval-v2            Evaluate with v2 interpreter (multi-dispatch)")
    console.error("  --typecheck          Type check code without executing")
    console.error("  --print              Print source code before processing")
    console.error("  --pretty             Pretty print typed AST as tree (with --typecheck)")
    console.error("  -c <expression>      Evaluate inline expression")
    console.error("  -c -                 Read expression from stdin")
    console.error("  <file.lang>          Run a .lang file")
    process.exit(1)
}

// Load expression from file if provided
if (filePath) {
    try {
        expression = await readFile(resolve(filePath), "utf-8")
        expression = expression.trim()
    } catch (error) {
        console.error(`Error: Failed to read file '${filePath}'`)
        if (error instanceof Error) {
            console.error(`  ${error.message}`)
        }
        process.exit(1)
    }
} else if (!expression) {
    console.error("Error: Please provide an expression with -c or specify a file")
    process.exit(1)
}

/**
 * Reconstruct source code from AST node
 */
function nodeToSource(node: any): string {
    switch (node.type) {
        case "literal":
            return typeof node.value === "string" ? `"${node.value}"` : String(node.value)
        case "identifier":
            return node.name
        case "binaryOp":
            return `${nodeToSource(node.left)} ${node.operator} ${nodeToSource(node.right)}`
        case "unaryOp":
            return `${node.operator}${nodeToSource(node.operand)}`
        case "assignment":
            return `${node.variable} := ${nodeToSource(node.value)}`
        case "functionDeclaration":
            const params = node.parameters.map((p: any) => p.name).join(" ")
            return `fn ${node.name} ${params} := ${nodeToSource(node.body)}`
        case "methodCall":
            if (node.arguments.length === 0) {
                return `${nodeToSource(node.object)}.${node.method}()`
            }
            const args = node.arguments.map(nodeToSource).join(", ")
            return `${nodeToSource(node.object)}.${node.method} ${args}`
        case "fieldAccess":
            return `${nodeToSource(node.object)}.${node.field}`
        case "block":
            if (node.parameters && node.parameters.length > 0) {
                const body = node.body.map(nodeToSource).join("; ")
                return `{ ${node.parameters.join(" ")} | ${body} }`
            }
            return `{ ${node.body.map(nodeToSource).join("; ")} }`
        case "typeInstance":
            const fields = node.fields.map((f: any) => `${f.key}: ${nodeToSource(f.value)}`).join(", ")
            return `${node.typeName} [ ${fields} ]`
        default:
            return `<${node.type}>`
    }
}

/**
 * Collect type annotations for a node and its children
 */
interface TypeAnnotation {
    startCol: number
    endCol: number
    type: string
    depth: number
}

function collectTypeAnnotations(node: any, baseOffset: number, depth = 0): TypeAnnotation[] {
    const annotations: TypeAnnotation[] = []
    const source = nodeToSource(node)

    if (node._inferredType) {
        annotations.push({
            startCol: baseOffset,
            endCol: baseOffset + source.length,
            type: node._inferredType.name,
            depth,
        })
    }

    // Recursively collect annotations from children
    let currentOffset = baseOffset

    switch (node.type) {
        case "binaryOp": {
            const leftSource = nodeToSource(node.left)
            annotations.push(...collectTypeAnnotations(node.left, currentOffset, depth + 1))
            currentOffset += leftSource.length + 1 + node.operator.length + 1
            annotations.push(...collectTypeAnnotations(node.right, currentOffset, depth + 1))
            break
        }
        case "unaryOp": {
            currentOffset += node.operator.length
            annotations.push(...collectTypeAnnotations(node.operand, currentOffset, depth + 1))
            break
        }
        case "assignment": {
            currentOffset += node.variable.length + 4 // " := "
            annotations.push(...collectTypeAnnotations(node.value, currentOffset, depth + 1))
            break
        }
        case "functionDeclaration": {
            const fnPart = `fn ${node.name} ${node.parameters.map((p: any) => p.name).join(" ")} := `
            currentOffset += fnPart.length
            annotations.push(...collectTypeAnnotations(node.body, currentOffset, depth + 1))
            break
        }
        case "methodCall": {
            const objSource = nodeToSource(node.object)
            annotations.push(...collectTypeAnnotations(node.object, currentOffset, depth + 1))
            currentOffset += objSource.length + 1 + node.method.length + 1 // ".method "
            for (const arg of node.arguments) {
                annotations.push(...collectTypeAnnotations(arg, currentOffset, depth + 1))
                currentOffset += nodeToSource(arg).length
                if (node.arguments.indexOf(arg) < node.arguments.length - 1) {
                    currentOffset += 2 // ", "
                }
            }
            break
        }
        case "block": {
            if (node.parameters && node.parameters.length > 0) {
                currentOffset += 2 + node.parameters.join(" ").length + 3 // "{ params | "
                for (const stmt of node.body) {
                    annotations.push(...collectTypeAnnotations(stmt, currentOffset, depth + 1))
                    currentOffset += nodeToSource(stmt).length
                    if (node.body.indexOf(stmt) < node.body.length - 1) {
                        currentOffset += 2 // "; "
                    }
                }
            }
            break
        }
        case "identifier":
        case "literal":
            // Leaf nodes - already added above
            break
    }

    return annotations
}

/**
 * Print a resolution diagram for typed AST nodes
 */
function printTypedTree(node: any): void {
    const source = nodeToSource(node)
    console.log(`> ${source}`)

    // Collect all type annotations
    const annotations = collectTypeAnnotations(node, 2) // offset by 2 for "> "

    // Sort by depth (deepest first) then by position
    annotations.sort((a, b) => {
        if (b.depth !== a.depth) return b.depth - a.depth
        return a.startCol - b.startCol
    })

    // First pass: determine the maximum width needed for underlines
    let maxUnderlineEnd = 0
    for (const ann of annotations) {
        if (ann.endCol > maxUnderlineEnd) {
            maxUnderlineEnd = ann.endCol
        }
    }

    // Calculate right margin position for type labels
    const typeMargin = maxUnderlineEnd + 1

    // Print annotation lines
    const maxCol = typeMargin + 50 // Extra space for type names
    const lines: string[] = []

    for (const ann of annotations) {
        // Find a line where we can place this annotation without overlap
        let lineIndex = 0
        while (lineIndex < lines.length) {
            const line = lines[lineIndex]
            let canPlace = true

            // Check if the underline area is free
            for (let i = ann.startCol; i < ann.endCol; i++) {
                if (line[i] && line[i] !== " ") {
                    canPlace = false
                    break
                }
            }

            // Also check if the type label area is free
            if (canPlace) {
                for (let i = typeMargin; i < typeMargin + ann.type.length; i++) {
                    if (line[i] && line[i] !== " ") {
                        canPlace = false
                        break
                    }
                }
            }

            if (canPlace) break
            lineIndex++
        }

        // Create line if needed
        while (lineIndex >= lines.length) {
            lines.push(" ".repeat(maxCol))
        }

        // Place the annotation
        const line = lines[lineIndex].split("")

        // Draw underline with ^
        const span = ann.endCol - ann.startCol
        if (span === 1) {
            line[ann.startCol] = "^"
        } else {
            for (let i = ann.startCol; i < ann.endCol; i++) {
                line[i] = "^"
            }
        }

        // Place type text at the right margin
        const typeText = ann.type
        for (let i = 0; i < typeText.length && typeMargin + i < maxCol; i++) {
            line[typeMargin + i] = typeText[i]
        }

        lines[lineIndex] = line.join("")
    }

    // Print all annotation lines, trimming trailing spaces
    for (const line of lines) {
        console.log(line.trimEnd())
    }
}
try {
    if (printSource) {
        console.log("========= Source =========")
        console.log(expression)
        console.log("========= Output =========")
    }

    if (mode === "lexer") {
        const lexer = new Lexer(expression)
        const tokens = lexer.tokenize()
        console.log(JSON.stringify(tokens, null, 2))
    } else if (mode === "ast") {
        const ast = parse(expression)
        console.log(JSON.stringify(ast, null, 2))
    } else if (mode === "typecheck") {
        const ast = parse(expression)
        const typeEnv = createDefaultTypeEnvironment()
        const typeChecker = new TypeChecker(typeEnv)
        const { errors, typedNodes } = typeChecker.check(ast)

        if (errors.length > 0) {
            console.error("Type errors found:")
            for (const error of errors) {
                console.error(`  - ${error.message}`)
                if (error.expected && error.actual) {
                    console.error(`    Expected: ${error.expected.toString()}`)
                    console.error(`    Actual: ${error.actual.toString()}`)
                }
            }
            process.exit(1)
        } else {
            console.log("✓ Type checking passed")
            if (prettyPrint) {
                console.log("\nTyped AST:")
                for (const node of typedNodes) {
                    printTypedTree(node)
                }
            } else {
                console.log(JSON.stringify(typedNodes, null, 2))
            }
        }
    } else if (mode === "eval") {
        const ast = parse(expression)
        const interpreter = new Interpreter()
        const result = interpreter.interpret(ast)
        console.log(result)
    } else if (mode === "eval-v2") {
        const ast = parse(expression)
        const interpreter = new InterpreterV2()
        const result = interpreter.interpret(ast)
        console.log(result)
    }

    if (printSource) {
        console.log("==========================")
    }
} catch (error) {
    if (error instanceof Error) {
        console.error("Error:", error.message)
    } else {
        console.error("Error:", error)
    }
    process.exit(1)
}
