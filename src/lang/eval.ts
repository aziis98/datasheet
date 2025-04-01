import { type Node } from './parser'

export type Context = {
    parent: Context | null
    bindings: Record<string, any>
}

const BASE_CONTEXT: Context = {
    parent: null,
    bindings: {},
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
            const arrayResults = node.elements.map(element => evaluateNode(element, context))

            return arrayResults

        case 'Object':
            const objectResults = Object.fromEntries(
                node.members.map(member => [member.key, evaluateNode(member.value, context)])
            )

            return objectResults

        case 'Identifier':
            const value = context.bindings[node.name]
            if (value === undefined) {
                throw new Error(`Undefined identifier: ${node.name}`)
            }

            return value
    }

    throw new Error(`Unknown node type: ${node.type}`)
}

export function evaluateNodeSafe(node: Node, context: Context = BASE_CONTEXT): { result: any } | { error: string } {
    try {
        const result = evaluateNode(node, context)
        return { result }
    } catch (error) {
        return { error: error!.toString() }
    }
}
