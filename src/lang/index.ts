// Token types and interface
type TokenType = 'Boolean' | 'Number' | 'String' | 'Identifier' | 'Operator' | 'Punctuation'

interface Token {
    type: TokenType
    value: string
    offset: number
    length: number
}

// Updated regex based lexer with operator tokens matching 1-3 characters from the set
const tokenSpecs: [TokenType, RegExp][] = [
    ['Boolean', /^(true|false)\b/],
    ['Number', /^(\d+(\.\d+)?)/],
    ['String', /^"([^"]*)"/],
    ['Operator', /^([+\-*\/&\?<>=%\^]{1,3})/],
    ['Identifier', /^(\$?[A-Za-z_][A-Za-z0-9_]*)/],
    // Punctuation: include [ ] { } : ( ) | .
    ['Punctuation', /^([\[\]\{\}:()|.])/],
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

// AST node types with token metadata
type Node =
    | { type: 'BooleanLiteral'; value: boolean; token: Token }
    | { type: 'NumberLiteral'; value: number; token: Token }
    | { type: 'StringLiteral'; value: string; token: Token }
    | { type: 'Identifier'; name: string; token: Token }
    | { type: 'Array'; elements: Node[]; token: Token }
    | { type: 'Object'; members: { key: string; value: Node }[]; token: Token }
    | { type: 'CallExpression'; callee: Node; arguments: Node[]; token: Token }
    | { type: 'PipeExpression'; left: Node; right: Node; token: Token }
    | { type: 'MemberExpression'; object: Node; property: Node; token: Token }
    | { type: 'BinaryExpression'; left: Node; operator: string; right: Node; token: Token }

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

// Parse expression handling binary and pipe operators
function parseExpression(tokens: Token[], posRef: { pos: number }): Node {
    // First, parse a binary expression (all operators left-associative, no precedence)
    let left = parseBinary(tokens, posRef)
    // Then handle piping operator, which is left-associative too
    while (peek(tokens, posRef.pos)?.type === 'Punctuation' && peek(tokens, posRef.pos)?.value === '|') {
        const pipeToken = pop(tokens, posRef) // consume '|'
        const right = parseBinary(tokens, posRef)
        // Use the left token metadata for the pipe expression
        left = { type: 'PipeExpression', left, right, token: pipeToken }
    }
    return left
}

// Parse binary expressions with all operators of equal precedence
function parseBinary(tokens: Token[], posRef: { pos: number }): Node {
    let left = parseCallMember(tokens, posRef)
    while (peek(tokens, posRef.pos)?.type === 'Operator') {
        const opToken = pop(tokens, posRef)
        const right = parseCallMember(tokens, posRef)
        left = {
            type: 'BinaryExpression',
            left,
            operator: opToken.value,
            right,
            token: opToken,
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
            pop(tokens, posRef) // Consume '('
            const args: Node[] = []
            while (
                peek(tokens, posRef.pos) &&
                !(peek(tokens, posRef.pos)?.type === 'Punctuation' && peek(tokens, posRef.pos)?.value === ')')
            ) {
                args.push(parseExpression(tokens, posRef))
            }
            expect(tokens, posRef, 'Punctuation', ')')
            expr = { type: 'CallExpression', callee: expr, arguments: args, token: expr.token }
            continue
        }
        // Property access: .Identifier
        if (next.type === 'Punctuation' && next.value === '.') {
            pop(tokens, posRef) // Consume '.'
            const propertyToken = expect(tokens, posRef, 'Identifier')
            const property: Node = { type: 'Identifier', name: propertyToken.value, token: propertyToken }
            expr = { type: 'MemberExpression', object: expr, property, token: expr.token }
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
            pop(tokens, posRef) // consume '('
            const expr = parseExpression(tokens, posRef)
            expect(tokens, posRef, 'Punctuation', ')')
            return expr
        }
    }
    throw new Error(`Unexpected token ${token.type} (${token.value}) at offset ${token.offset}`)
}

// Parse arrays (elements are full expressions)
function parseArray(tokens: Token[], posRef: { pos: number }): Node {
    const openBracket = expect(tokens, posRef, 'Punctuation', '[')
    const elements: Node[] = []
    while (true) {
        const next = peek(tokens, posRef.pos)
        if (!next) throw new Error('Unexpected end of input in array')
        if (next.type === 'Punctuation' && next.value === ']') break
        elements.push(parseExpression(tokens, posRef))
    }
    expect(tokens, posRef, 'Punctuation', ']')
    return { type: 'Array', elements, token: openBracket }
}

// Parse objects (member values are full expressions)
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
    expect(tokens, posRef, 'Punctuation', '}')
    return { type: 'Object', members, token: openBrace }
}

// Example usage:
const codeSamples = [
    'true',
    'false',
    '[ 1 2 3 $var_1 ]',
    '{ foo: "A string" }',
    '(1)', // grouping
    'add(1 2)', // function call
    '1 | double', // piping operator
    'sum(1 2) | double(3)', // chaining pipe and function call
    'user.name', // property access
    'getUser().address.street', // chained member access
    '1 + 2 - 3', // binary operators left-associative
    'a * b / c', // binary operators
    'a + b * c', // no precedence: parsed left-to-right
    'a + (b * c)', // no precedence: parsed left-to-right
    'x ? y : z', // example operator chain (if these characters form an operator)
]

for (const code of codeSamples) {
    try {
        console.log(`\nParsing code: "${code}"`)
        const tokens = lex(code)
        console.log('Tokens:', tokens)
        const ast = parse(tokens)
        console.log('AST:', JSON.stringify(ast, null, 2))
    } catch (e) {
        console.error(e)
    }
}

export function parseSource(code: string): Node {
    const tokens = lex(code)
    return parse(tokens)
}
