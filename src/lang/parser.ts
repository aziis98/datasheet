// Token types and interface
type TokenType = 'Boolean' | 'Number' | 'String' | 'Identifier' | 'Operator' | 'Punctuation' | 'Spread'

type Token = {
    type: TokenType
    value: string
    offset: number
    length: number
}

// Updated regex based lexer with operator tokens (1-3 characters from set)
const tokenSpecs: [TokenType, RegExp][] = [
    ['Boolean', /^(true|false)\b/],
    ['Number', /^(\d+(\.\d+)?)/],
    ['String', /^"([^"]*)"/],

    ['Spread', /^(\.\.)/],

    ['Operator', /^([+\-*\/&\?<>=%\^]{1,3})/],
    ['Identifier', /^(\$?[A-Za-z_][A-Za-z0-9_]*)/],
    // Punctuation: include [ ] { } : ( ) | .
    ['Punctuation', /^([\[\]\{\}:()|.;])/],
]

function lex(input: string): Token[] {
    const tokens: Token[] = []
    let pos = 0
    while (pos < input.length) {
        const ws = /^[\s]+/.exec(input.slice(pos))
        if (ws) {
            pos += ws[0].length
            continue
        }
        let matchFound = false
        for (const [type, regex] of tokenSpecs) {
            const slice = input.slice(pos)
            const match = regex.exec(slice)
            if (match) {
                const value = match[1] || match[0]
                tokens.push({ type, value, offset: pos, length: match[0].length })
                pos += match[0].length
                matchFound = true
                break
            }
        }
        if (!matchFound) {
            throw new Error(`Unexpected token at position ${pos}: "${input.slice(pos, pos + 10)}"`)
        }
    }
    return tokens
}

// AST node types
export type Node =
    | BooleanLiteralNode
    | NumberLiteralNode
    | StringLiteralNode
    | IdentifierNode
    | GroupingExpressionNode
    | ArrayNode
    | ObjectNode
    | CallExpressionNode
    | PipeExpressionNode
    | MemberExpressionNode
    | BinaryExpressionNode
    | SpreadExpressionNode

type BooleanLiteralNode = {
    type: 'BooleanLiteral'
    value: boolean
    token?: Token
}

type NumberLiteralNode = {
    type: 'NumberLiteral'
    value: number
    token?: Token
}

type StringLiteralNode = {
    type: 'StringLiteral'
    value: string
    token?: Token
}

type IdentifierNode = {
    type: 'Identifier'
    name: string
    token?: Token
}

type GroupingExpressionNode = {
    type: 'GroupingExpression'
    expression: Node
    startToken?: Token
    endToken?: Token
}

type ArrayNode = {
    type: 'Array'
    elements: Node[]
    startToken?: Token
    endToken?: Token
}

type SpreadExpressionNode = {
    type: 'SpreadExpression'
    expression: Node
    startToken?: Token
    endToken?: Token
}

type ObjectNode = {
    type: 'Object'
    members: { key: string; value: Node }[]
    startToken?: Token
    endToken?: Token
}

type CallExpressionNode = {
    type: 'CallExpression'
    callee: Node
    arguments: Node[]
    startToken?: Token
    endToken?: Token
}

type PipeExpressionNode = {
    type: 'PipeExpression'
    left: Node
    right: Node
    startToken?: Token
    endToken?: Token
}

type MemberExpressionNode = {
    type: 'MemberExpression'
    object: Node
    property: Node
    startToken?: Token
    endToken?: Token
}

type BinaryExpressionNode = {
    type: 'BinaryExpression'
    operator: string
    left: Node
    right: Node
    startToken?: Token
    endToken?: Token
}

// Helper functions to extract start/end token from an AST node
function getStartToken(node: Node): Token {
    return 'startToken' in node ? (node as any).startToken : (node as any).token
}

function getEndToken(node: Node): Token {
    return 'endToken' in node ? (node as any).endToken : (node as any).token
}

// Utility functions for token management
function peek(tokens: Token[], pos: number): Token | null {
    return tokens[pos] || null
}

function pop(tokens: Token[], posRef: { pos: number }): Token {
    const token = tokens[posRef.pos]
    if (!token) throw new Error('Unexpected end of input')
    posRef.pos++
    return token
}

function expect(tokens: Token[], posRef: { pos: number }, type: TokenType, value?: string): Token {
    const token = peek(tokens, posRef.pos)
    if (!token || token.type !== type || (value !== undefined && token.value !== value)) {
        throw new Error(
            `Expected token ${type}${value ? ' (' + value + ')' : ''} at offset ${token ? token.offset : 'EOF'}`
        )
    }
    posRef.pos++
    return token
}

// Parser entry point
function parse(tokens: Token[]): Node {
    const posRef = { pos: 0 }
    const expr = parseExpression(tokens, posRef)
    return expr
}

// Parse expression: handle binary and pipe operators (all left-associative)
function parseExpression(tokens: Token[], posRef: { pos: number }): Node {
    let left = parseBinary(tokens, posRef)
    while (peek(tokens, posRef.pos)?.type === 'Punctuation' && peek(tokens, posRef.pos)?.value === '|') {
        const pipeToken = pop(tokens, posRef)
        const right = parseBinary(tokens, posRef)
        left = {
            type: 'PipeExpression',
            left,
            right,
            startToken: getStartToken(left),
            endToken: getEndToken(right),
        }
    }
    return left
}

// Parse binary expressions (all operators same precedence, left-associative)
function parseBinary(tokens: Token[], posRef: { pos: number }): Node {
    let left = parseCallMember(tokens, posRef)
    while (peek(tokens, posRef.pos)?.type === 'Operator') {
        const opToken = pop(tokens, posRef)
        const right = parseCallMember(tokens, posRef)
        left = {
            type: 'BinaryExpression',
            operator: opToken.value,
            left,
            right,
            startToken: getStartToken(left),
            endToken: getEndToken(right),
        }
    }
    return left
}

// Parse function calls and property accesses
function parseCallMember(tokens: Token[], posRef: { pos: number }): Node {
    let expr = parsePrimary(tokens, posRef)
    while (true) {
        const next = peek(tokens, posRef.pos)
        if (!next) break
        // Function call: (...)
        if (next.type === 'Punctuation' && next.value === '(') {
            const openParen = pop(tokens, posRef)
            const args: Node[] = []
            while (
                peek(tokens, posRef.pos) &&
                !(peek(tokens, posRef.pos)?.type === 'Punctuation' && peek(tokens, posRef.pos)?.value === ')')
            ) {
                args.push(parseExpression(tokens, posRef))
            }
            const closeParen = expect(tokens, posRef, 'Punctuation', ')')
            expr = {
                type: 'CallExpression',
                callee: expr,
                arguments: args,
                startToken: getStartToken(expr),
                endToken: closeParen,
            }
            continue
        }
        // Property access: .Identifier
        if (next.type === 'Punctuation' && next.value === '.') {
            pop(tokens, posRef) // consume '.'
            const propertyToken = expect(tokens, posRef, 'Identifier')
            const property: IdentifierNode = {
                type: 'Identifier',
                name: propertyToken.value,
                token: propertyToken,
            }
            expr = {
                type: 'MemberExpression',
                object: expr,
                property,
                startToken: getStartToken(expr),
                endToken: propertyToken,
            }
            continue
        }
        break
    }
    return expr
}

// Parse primary expressions
function parsePrimary(tokens: Token[], posRef: { pos: number }): Node {
    const token = peek(tokens, posRef.pos)
    if (!token) throw new Error('Unexpected end of input in primary expression')

    if (token.type === 'Boolean') {
        const t = pop(tokens, posRef)
        return { type: 'BooleanLiteral', value: t.value === 'true', token: t }
    }
    if (token.type === 'Number') {
        const t = pop(tokens, posRef)
        return { type: 'NumberLiteral', value: parseFloat(t.value), token: t }
    }
    if (token.type === 'String') {
        const t = pop(tokens, posRef)
        return { type: 'StringLiteral', value: t.value, token: t }
    }
    if (token.type === 'Identifier') {
        const t = pop(tokens, posRef)
        return { type: 'Identifier', name: t.value, token: t }
    }
    if (token.type === 'Punctuation') {
        if (token.value === '[') return parseArray(tokens, posRef)
        if (token.value === '{') return parseObject(tokens, posRef)
        if (token.value === '(') {
            const openParen = pop(tokens, posRef)
            const expr = parseExpression(tokens, posRef)
            const closeParen = expect(tokens, posRef, 'Punctuation', ')')
            return {
                type: 'GroupingExpression',
                expression: expr,
                startToken: openParen,
                endToken: closeParen,
            }
        }
    }
    throw new Error(`Unexpected token ${token.type} (${token.value}) at offset ${token.offset}`)
}

// Parse arrays: [ elements ]
function parseArray(tokens: Token[], posRef: { pos: number }): Node {
    const openBracket = expect(tokens, posRef, 'Punctuation', '[')

    let lastRowEnding: number | null = null
    const elements: Node[] = []
    while (true) {
        let next

        next = peek(tokens, posRef.pos)
        if (!next) throw new Error('Unexpected end of input in array')

        if (next.type === 'Punctuation' && next.value === ';') {
            pop(tokens, posRef)

            const lastRow = elements.slice(lastRowEnding ?? 0)
            elements.splice(lastRowEnding ?? 0, lastRow.length, {
                type: 'Array',
                elements: lastRow,
                startToken: openBracket,
                endToken: next,
            })

            lastRowEnding = elements.length
        }

        next = peek(tokens, posRef.pos)
        if (!next) throw new Error('Unexpected end of input in array')

        if (next.type === 'Punctuation' && next.value === ']') {
            if (lastRowEnding !== null && lastRowEnding < elements.length) {
                // If we have a last row ending, we need to wrap all previous elements in a single array
                const lastRow = elements.slice(lastRowEnding)
                elements.splice(lastRowEnding, elements.length - lastRowEnding, {
                    type: 'Array',
                    elements: lastRow,
                    startToken: openBracket,
                    endToken: next,
                })
            }

            break
        }

        const newItem = parseExpression(tokens, posRef)
        const nextToken = peek(tokens, posRef.pos)
        if (nextToken && nextToken.type === 'Spread') {
            const spreadToken = pop(tokens, posRef)
            elements.push({
                type: 'SpreadExpression',
                expression: newItem,
                startToken: getStartToken(newItem),
                endToken: spreadToken,
            })
        } else {
            elements.push(newItem)
        }
    }

    const closeBracket = expect(tokens, posRef, 'Punctuation', ']')
    return {
        type: 'Array',
        elements,
        startToken: openBracket,
        endToken: closeBracket,
    }
}

// Parse objects: { key: value, ... }
function parseObject(tokens: Token[], posRef: { pos: number }): Node {
    const openBrace = expect(tokens, posRef, 'Punctuation', '{')
    const members: { key: string; value: Node }[] = []
    while (true) {
        const next = peek(tokens, posRef.pos)
        if (!next) throw new Error('Unexpected end of input in object')
        if (next.type === 'Punctuation' && next.value === '}') break
        const keyToken = expect(tokens, posRef, 'Identifier')
        expect(tokens, posRef, 'Punctuation', ':')
        const valueNode = parseExpression(tokens, posRef)
        members.push({ key: keyToken.value, value: valueNode })
    }
    const closeBrace = expect(tokens, posRef, 'Punctuation', '}')
    return {
        type: 'Object',
        members,
        startToken: openBrace,
        endToken: closeBrace,
    }
}

// Example usage:
// const codeSamples = [
//     'true',
//     'false',
//     '[ 1 2 3 $var_1 ]',
//     '{ foo: "A string" }',
//     '(1)', // grouping
//     'add(1 2)', // function call
//     '1 | double', // piping operator
//     'sum(1 2) | double(3)', // chaining pipe and function call
//     'user.name', // property access
//     'getUser().address.street', // chained member access
//     '1 + 2 - 3', // binary operators left-associative
//     'a * b / c', // binary operators
//     'a + b * c', // no precedence: parsed left-to-right
//     'a + (b * c)', // no precedence: parsed left-to-right
//     'x ? y : z', // example operator chain (if these characters form an operator)
// ]

// for (const code of codeSamples) {
//     try {
//         console.log(`\nParsing code: "${code}"`)
//         const tokens = lex(code)
//         console.log('Tokens:', tokens)
//         const ast = parse(tokens)
//         console.log('AST:', JSON.stringify(ast, null, 2))
//     } catch (e) {
//         console.error(e)
//     }
// }

export function parseSource(code: string): Node | { error: string } {
    try {
        const tokens = lex(code)
        return parse(tokens)
    } catch (err) {
        return { error: err!.toString() }
    }
}
