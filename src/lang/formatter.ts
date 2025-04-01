import type { Node } from './parser'

function formatAST(node: Node, indent = '', inlineThreshold = 1): { result: string; depth: number } {
    const indentStep = '  '

    function isSimple(n: Node): boolean {
        // A node is simple if it is a literal or identifier.
        return (
            n.type === 'BooleanLiteral' ||
            n.type === 'NumberLiteral' ||
            n.type === 'StringLiteral' ||
            n.type === 'Identifier'
        )
    }

    switch (node.type) {
        case 'BooleanLiteral':
            return { result: node.value.toString(), depth: 0 }
        case 'NumberLiteral':
            return { result: node.value.toString(), depth: 0 }
        case 'StringLiteral':
            return { result: `"${node.value}"`, depth: 0 }
        case 'Identifier':
            return { result: node.name, depth: 0 }

        case 'GroupingExpression': {
            const inner = formatAST(node.expression, indent, inlineThreshold)
            return { result: `(${inner.result})`, depth: inner.depth + 1 }
        }

        case 'Array': {
            // Compute depths for each element.
            const elems = node.elements.map(e => formatAST(e, indent + indentStep, inlineThreshold))
            const maxDepth = elems.reduce((d, e) => Math.max(d, e.depth), 0)
            // If simple enough, inline.
            if (maxDepth < 1) {
                const joined = elems.map(e => e.result).join(' ')
                return { result: `[ ${joined} ]`, depth: maxDepth + 1 }
            } else {
                const joined = elems.map(e => indent + indentStep + e.result).join('\n')
                return {
                    result: `[\n${joined}\n${indent}]`,
                    depth: maxDepth + 1,
                }
            }
        }

        case 'Object': {
            // Format each member.
            const members = node.members.map(({ key, value }) => {
                const formatted = formatAST(value, indent + indentStep, inlineThreshold)
                return { str: `${key}: ${formatted.result}`, depth: formatted.depth }
            })
            const maxDepth = members.reduce((d, m) => Math.max(d, m.depth), 0)
            if (maxDepth <= inlineThreshold && members.length <= 1) {
                const joined = members.map(m => m.str).join(' ')
                return { result: `{ ${joined} }`, depth: maxDepth + 1 }
            } else {
                const joined = members.map(m => indent + indentStep + m.str).join('\n')
                return {
                    result: `{\n${joined}\n${indent}}`,
                    depth: maxDepth + 1,
                }
            }
        }

        case 'CallExpression': {
            const calleeFmt = formatAST(node.callee, indent, inlineThreshold)
            const args = node.arguments.map(arg => formatAST(arg, indent + indentStep, inlineThreshold))
            const argsJoined = args.map(a => a.result).join(' ')
            const maxArgDepth = args.reduce((d, a) => Math.max(d, a.depth), 0)
            return {
                result: `${calleeFmt.result}(${argsJoined})`,
                depth: Math.max(calleeFmt.depth, maxArgDepth) + 1,
            }
        }

        case 'PipeExpression': {
            const leftFmt = formatAST(node.left, indent, inlineThreshold)
            const rightFmt = formatAST(node.right, indent, inlineThreshold)
            return {
                result: `${leftFmt.result} | ${rightFmt.result}`,
                depth: Math.max(leftFmt.depth, rightFmt.depth) + 1,
            }
        }

        case 'MemberExpression': {
            const objectFmt = formatAST(node.object, indent, inlineThreshold)
            const propertyFmt = formatAST(node.property, indent, inlineThreshold)
            return {
                result: `${objectFmt.result}.${propertyFmt.result}`,
                depth: Math.max(objectFmt.depth, propertyFmt.depth) + 1,
            }
        }

        case 'BinaryExpression': {
            const leftFmt = formatAST(node.left, indent, inlineThreshold)
            const rightFmt = formatAST(node.right, indent, inlineThreshold)
            return {
                result: `${leftFmt.result} ${node.operator} ${rightFmt.result}`,
                depth: Math.max(leftFmt.depth, rightFmt.depth) + 1,
            }
        }

        default:
            throw new Error(`Unhandled node type: ${(node as any).type}`)
    }
}

// Example usage with a dummy AST node:
const exampleAST: Node = {
    type: 'Array',
    elements: [
        {
            type: 'Object',
            members: [
                { key: 'name', value: { type: 'StringLiteral', value: 'Alice' } },
                { key: 'age', value: { type: 'NumberLiteral', value: 30 } },
            ],
        },
        {
            type: 'Object',
            members: [
                { key: 'name', value: { type: 'StringLiteral', value: 'Bob' } },
                { key: 'age', value: { type: 'NumberLiteral', value: 25 } },
            ],
        },
        {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'getUser' },
            arguments: [{ type: 'StringLiteral', value: 'Alice' }],
        },
        {
            type: 'Array',
            elements: [
                { type: 'NumberLiteral', value: 1 },
                { type: 'NumberLiteral', value: 2 },
                { type: 'NumberLiteral', value: 3 },
            ],
        },
    ],
}

const formatted = formatAST(exampleAST)
console.log(formatted.result)
console.log('Depth:', formatted.depth)
