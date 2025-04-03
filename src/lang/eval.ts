import { type Node } from './parser'

export type Context = {
    parent: Context | null

    bindings: Record<string, any>
}

export class Table {
    constructor(public headers: string[], public rows: any[][]) {
        if (!rows.every(row => row.length === headers.length)) {
            const errorRow = rows.find(row => row.length !== headers.length)

            throw new Error(
                'All rows must have the same number of columns as headers, but found:\n' +
                    `\nHeaders: ${headers.length} columns\nRow: ${errorRow?.length} columns\n` +
                    `\nHeaders: ${JSON.stringify(headers)}\nRow: ${JSON.stringify(errorRow)}`
            )
        }

        this.headers = headers
        this.rows = rows
    }

    toCode(): string {
        const headersCode = this.headers.map(header => `"${header}"`).join(' ')
        const rowsCode = this.rows
            .map(row => `    ${row.map(item => (typeof item === 'string' ? `"${item}"` : item)).join(' ')};`)
            .join('\n')

        return `table(\n  [${headersCode}]\n  [\n${rowsCode}\n  ]\n)`
    }
}

const BASE_CONTEXT: Context = {
    parent: null,
    bindings: {
        // Arrays
        length: (array: any[]) => array.length,
        map: (array: any[], fn: (item: any) => any) => array.map(fn),
        filter: (array: any[], fn: (item: any) => boolean) => array.filter(fn),
        each: (array: any[], fn: (item: any) => void) => array.forEach(fn),
        find: (array: any[], fn: (item: any) => boolean) => array.find(fn),
        any: (array: any[], fn: (item: any) => boolean) => array.some(fn),
        all: (array: any[], fn: (item: any) => boolean) => array.every(fn),

        // Strings
        split: (str: string, delimiter: string) => str.split(delimiter),
        words: (str: string) => str.split(/\s+/),

        // Tables
        table: (headers: string[], rows: any[][]) => new Table(headers, rows),
    },
}

export function evaluateNode(node: Node, context: Context = BASE_CONTEXT): any {
    switch (node.type) {
        case 'NumberLiteral':
            return node.value
        case 'StringLiteral':
            return node.value
        case 'BooleanLiteral':
            return node.value

        case 'Array':
            return node.elements.flatMap(element => {
                if (element.type === 'SpreadExpression') {
                    const spreadValue = evaluateNode(element.expression, context)
                    if (!Array.isArray(spreadValue)) {
                        throw new Error(`Spread expression must be an array, got: ${element.expression.type}`)
                    }

                    return spreadValue
                } else {
                    return [evaluateNode(element, context)]
                }
            })

        case 'Object':
            const objectResults = Object.fromEntries(
                node.members.map(member => [member.key, evaluateNode(member.value, context)])
            )

            return objectResults

        case 'Identifier':
            const value = getFromContext(context, node.name)
            if (value === undefined) {
                throw new Error(`Undefined identifier: ${node.name}`)
            }

            return value

        case 'CallExpression':
            const callee = evaluateNode(node.callee, context)
            const args = node.arguments.map(arg => evaluateNode(arg, context))
            if (typeof callee !== 'function') {
                throw new Error(`Callee is not a function: ${node.callee.type}`)
            }

            return callee(...args)

        // case 'PipeExpression':
        //     const leftValue = evaluateNode(node.left, context)
        //     const rightValue = evaluateNode(node.right, context)

        //     if (typeof rightValue !== 'function') {
        //         throw new Error(`Right side of pipe is not a function: ${node.right.type}`)
        //     }

        //     return rightValue(leftValue)
    }

    throw new Error(`Unknown node type: ${node.type}`)
}

export function getFromContext(context: Context, name: string): any {
    let currentContext: Context | null = context

    while (currentContext) {
        if (name in currentContext.bindings) {
            return currentContext.bindings[name]
        }
        currentContext = currentContext.parent
    }

    throw new Error(`Identifier not found in context: ${name}`)
}

export function extendContext(bindings: Record<string, any>, parent: Context = BASE_CONTEXT): Context {
    return { parent, bindings }
}

export function evaluateNodeSafe(node: Node, context: Context = BASE_CONTEXT): { result: any } | { error: string } {
    try {
        const result = evaluateNode(node, context)
        return { result }
    } catch (error) {
        return { error: error!.toString() }
    }
}
