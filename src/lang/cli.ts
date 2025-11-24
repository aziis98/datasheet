#!/usr/bin/env bun

import { readFile } from "fs/promises"
import { resolve } from "path"
import { Interpreter } from "./interpreter"
import { Lexer, parse } from "./parser"

// Parse command line arguments
const args = Bun.argv.slice(2)

let mode: "lexer" | "ast" | "eval" | null = null
let expression: string | null = null
let filePath: string | null = null
let printSource = false

for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === "--lexer") {
        mode = "lexer"
    } else if (arg === "--ast") {
        mode = "ast"
    } else if (arg === "--eval") {
        mode = "eval"
    } else if (arg === "--print") {
        printSource = true
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
    console.error("Usage: cli.ts [--lexer|--ast|--eval] [-c <expression>|<file.lang>] [--print]")
    console.error("  --lexer              Output tokens from lexer")
    console.error("  --ast                Output AST")
    console.error("  --eval               Evaluate expression (default for files)")
    console.error("  --print              Print source code before processing")
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
    } else if (mode === "eval") {
        const ast = parse(expression)
        const interpreter = new Interpreter()
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
