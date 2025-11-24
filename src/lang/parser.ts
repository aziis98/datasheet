/**
 * Recursive Descent Parser with Pratt Parsing for Datasheet DSL
 * Handles precedence, operator overloading, and complex expressions
 */

// ============================================================================
// AST Node Types
// ============================================================================

export type ASTNode =
    | Literal
    | Identifier
    | BinaryOp
    | UnaryOp
    | Assignment
    | CapturePattern
    | TypeDeclaration
    | FunctionDeclaration
    | TypeInstance
    | FieldAccess
    | MethodCall
    | Block
    | MatchExpression
    | MatchPattern
    | PatternArm
    | QuotedForm
    | TypeAnnotation
    | FunctionParameter

export interface Literal {
    type: "literal"
    valueType: "number" | "string" | "boolean"
    value: number | string | boolean
}

export interface Identifier {
    type: "identifier"
    name: string
}

export interface BinaryOp {
    type: "binaryOp"
    operator: string
    left: ASTNode
    right: ASTNode
}

export interface UnaryOp {
    type: "unaryOp"
    operator: string
    operand: ASTNode
}

export interface Assignment {
    type: "assignment"
    variable: string
    value: ASTNode
    pattern?: ASTNode
}

export interface CapturePattern {
    type: "capturePattern"
    name: string
    pattern?: ASTNode
}

export interface TypeAnnotation {
    type: "typeAnnotation"
    typeExpr: ASTNode
}

export interface FunctionParameter {
    type: "parameter"
    name: string
    typeAnnotation?: ASTNode
}

export interface ADTVariant {
    name: string
    fields: Array<{ name: string; fieldType: ASTNode }>
}

export interface TypeDeclaration {
    type: "typeDeclaration"
    name: string
    isAbstract: boolean
    parent?: string
    fields: Array<{ name: string; fieldType: ASTNode }>
    variants?: ADTVariant[]
}

export interface FunctionDeclaration {
    type: "functionDeclaration"
    name: string
    parameters: FunctionParameter[]
    returnType?: ASTNode
    body: ASTNode
}

export interface TypeInstance {
    type: "typeInstance"
    typeName: string
    fields: Array<{ key: string; value: ASTNode }>
}

export interface FieldAccess {
    type: "fieldAccess"
    object: ASTNode
    field: string
}

export interface MethodCall {
    type: "methodCall"
    object: ASTNode
    method: string
    arguments: ASTNode[]
}

export interface Block {
    type: "block"
    parameters?: string[]
    body: ASTNode[]
}

export interface MatchPattern {
    type: "pattern"
    pattern: ASTNode
}

export interface PatternArm {
    type: "patternArm"
    pattern: ASTNode
    body: ASTNode
}

export interface MatchExpression {
    type: "matchExpression"
    value: ASTNode
    arms: PatternArm[]
}

export interface QuotedForm {
    type: "quotedForm"
    expression: ASTNode
}

// ============================================================================
// Token Types
// ============================================================================

export interface Token {
    type: TokenType
    value: string
    line: number
    column: number
}

export type TokenType = "number" | "string" | "identifier" | "keyword" | "operator" | "punctuation" | "eof"

// ============================================================================
// Lexer (Regex-based)
// ============================================================================

export class Lexer {
    private input: string
    private tokens: Token[] = []

    private keywords = new Set(["fn", "type", "abstract", "match", "trait", "impl", "true", "false", "for"])

    // Token regex patterns (ordered by priority)
    private tokenPatterns: Array<{ pattern: RegExp; type: TokenType }> = [
        { pattern: /^"""[\s\S]*?"""/, type: "string" }, // Triple-quoted multiline string
        { pattern: /^"(?:\\.|[^"\\])*"/, type: "string" }, // Double-quoted string
        { pattern: /^:=|^=>|^<:|^==|^!=|^<=|^>=|^&&|^\|\|/, type: "operator" }, // Multi-char operators
        { pattern: /^[+\-*/%^:=<>!&|#]/, type: "operator" }, // Single-char operators
        { pattern: /^\d+\.\d+/, type: "number" }, // Float
        { pattern: /^\d+/, type: "number" }, // Integer
        { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*/, type: "identifier" }, // Identifier (checked for keywords)
        { pattern: /^[(){}\[\],;.@|?]/, type: "punctuation" }, // Punctuation
    ]

    constructor(input: string) {
        this.input = input
    }

    tokenize(): Token[] {
        let position = 0
        let line = 1
        let column = 1

        while (position < this.input.length) {
            // Skip whitespace and comments
            // Inline comments: //
            // Line comments: # followed by space or text
            const commentOrWhitespaceMatch = this.input.substring(position).match(/^(\/\/.*|[\s]+|#[ \t].*)/)
            if (commentOrWhitespaceMatch) {
                const matched = commentOrWhitespaceMatch[0]
                const newlines = matched.match(/\n/g)?.length || 0
                if (newlines > 0) {
                    line += newlines
                    column = matched.length - matched.lastIndexOf("\n")
                } else {
                    column += matched.length
                }
                position += matched.length
                continue
            }

            // Try to match token patterns
            let matched = false
            for (const { pattern, type } of this.tokenPatterns) {
                const match = this.input.substring(position).match(pattern)
                if (match) {
                    const value = match[0]
                    let tokenType: TokenType = type

                    // Check if identifier is a keyword
                    if (type === "identifier" && this.keywords.has(value)) {
                        tokenType = "keyword"
                    }

                    // Handle string unescaping
                    let tokenValue = value
                    if (type === "string") {
                        tokenValue = this.unescapeString(value)
                    }

                    this.tokens.push({
                        type: tokenType,
                        value: tokenValue,
                        line,
                        column,
                    })

                    position += value.length
                    column += value.length
                    matched = true
                    break
                }
            }

            if (!matched) {
                // Skip unknown character
                position++
                column++
            }
        }

        this.tokens.push({
            type: "eof",
            value: "",
            line,
            column,
        })

        return this.tokens
    }

    private unescapeString(str: string): string {
        // Remove quotes
        const isTripleQuoted = str.startsWith('"""')
        let content = isTripleQuoted ? str.slice(3, -3) : str.slice(1, -1)

        // Unescape escape sequences
        content = content
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "\r")
            .replace(/\\\\/g, "\\")
            .replace(/\\"/g, '"')

        return content
    }
}

// ============================================================================
// Parser with Pratt Parsing
// ============================================================================

export class Parser {
    private tokens: Token[]
    private position: number = 0
    private lastTokenLine: number = 1

    // Pratt parsing precedence levels
    private precedences: Record<string, number> = {
        ":=": 1,
        "=>": 2,
        "||": 3,
        "&&": 4,
        "==": 5,
        "!=": 5,
        "<": 6,
        ">": 6,
        "<=": 6,
        ">=": 6,
        "+": 10,
        "-": 10,
        "*": 20,
        "/": 20,
        "%": 20,
        "^": 30,
        ".": 40,
        "[": 40,
    }

    // Infix operator handlers
    private infixParsers: Record<string, (left: ASTNode) => ASTNode> = {}

    // Prefix operator handlers
    private prefixParsers: Record<string, () => ASTNode> = {}

    constructor(input: string) {
        const lexer = new Lexer(input)
        this.tokens = lexer.tokenize()
        this.registerParsers()
    }

    private registerParsers(): void {
        // Prefix parsers
        this.prefixParsers["number"] = () => this.parseLiteral()
        this.prefixParsers["string"] = () => this.parseLiteral()
        this.prefixParsers["identifier"] = () => this.parseIdentifierOrCall()
        this.prefixParsers["true"] = () => this.parseBooleanLiteral()
        this.prefixParsers["false"] = () => this.parseBooleanLiteral()
        this.prefixParsers["("] = () => this.parseGroupedExpression()
        this.prefixParsers["["] = () => this.parseArray()
        this.prefixParsers["{"] = () => this.parseBlock()
        this.prefixParsers["fn"] = () => this.parseFunctionDeclaration()
        this.prefixParsers["type"] = () => this.parseTypeDeclaration()
        this.prefixParsers["abstract"] = () => this.parseTypeDeclaration()
        this.prefixParsers["match"] = () => this.parseMatchExpression()
        this.prefixParsers["#"] = () => this.parseQuotedForm()
        this.prefixParsers["-"] = () => this.parseUnaryOp("-")
        this.prefixParsers["!"] = () => this.parseUnaryOp("!")

        // Infix parsers
        this.infixParsers["+"] = left => this.parseBinaryOp(left, "+")
        this.infixParsers["-"] = left => this.parseBinaryOp(left, "-")
        this.infixParsers["*"] = left => this.parseBinaryOp(left, "*")
        this.infixParsers["/"] = left => this.parseBinaryOp(left, "/")
        this.infixParsers["%"] = left => this.parseBinaryOp(left, "%")
        this.infixParsers["^"] = left => this.parseBinaryOp(left, "^")
        this.infixParsers["=="] = left => this.parseBinaryOp(left, "==")
        this.infixParsers["!="] = left => this.parseBinaryOp(left, "!=")
        this.infixParsers["<"] = left => this.parseBinaryOp(left, "<")
        this.infixParsers[">"] = left => this.parseBinaryOp(left, ">")
        this.infixParsers["<="] = left => this.parseBinaryOp(left, "<=")
        this.infixParsers[">="] = left => this.parseBinaryOp(left, ">=")
        this.infixParsers["&&"] = left => this.parseBinaryOp(left, "&&")
        this.infixParsers["||"] = left => this.parseBinaryOp(left, "||")
        this.infixParsers[":="] = left => this.parseAssignment(left)
        this.infixParsers[":"] = left => this.parseKeyValue(left)
        this.infixParsers["."] = left => this.parseFieldAccessOrMethod(left)
        this.infixParsers["["] = left => this.parseTypeInstance(left)
    }

    parse(): ASTNode[] {
        const statements: ASTNode[] = []

        while (!this.isAtEnd()) {
            const stmt = this.parseStatement()
            if (stmt) {
                statements.push(stmt)
            }
        }

        return statements
    }

    private parseStatement(): ASTNode | null {
        if (this.isAtEnd()) return null

        const expr = this.parseExpression(0)
        this.consumeStatementEnd()
        return expr
    }

    private parseExpression(precedence: number): ASTNode {
        const token = this.current()

        // Try token type first (for literals, etc.) to avoid collisions
        // e.g., avoid confusing string "-" with unary operator "-"
        let prefixParser = this.prefixParsers[token.type]

        // If not found by type, try by value (for keywords, operators)
        if (!prefixParser) {
            prefixParser = this.prefixParsers[token.value]
        }

        if (!prefixParser) {
            throw this.error(`Unexpected token: ${token.value}`)
        }

        let left = prefixParser()

        while (!this.isAtEnd() && this.getCurrentPrecedence() > precedence && !this.isStatementEnd()) {
            const op = this.current().value
            const infixParser = this.infixParsers[op]

            if (!infixParser) break

            this.advance()
            left = infixParser(left)
        }

        return left
    }

    private parseLiteral(): Literal {
        const token = this.current()
        this.advance()

        if (token.type === "number") {
            const value = parseFloat(token.value)
            return {
                type: "literal",
                valueType: token.value.includes(".") ? "number" : "number",
                value,
            }
        }

        if (token.type === "string") {
            return {
                type: "literal",
                valueType: "string",
                value: token.value,
            }
        }

        throw this.error(`Invalid literal: ${token.value}`)
    }

    private parseBooleanLiteral(): Literal {
        const value = this.current().value === "true"
        this.advance()

        return {
            type: "literal",
            valueType: "boolean",
            value,
        }
    }

    private parseIdentifierOrCall(): ASTNode {
        const name = this.current().value
        this.advance()

        // Check if this is a function call
        if (this.check("(")) {
            this.advance()
            const args: ASTNode[] = []

            while (!this.check(")") && !this.isAtEnd()) {
                args.push(this.parseExpression(0))
                if (this.check(",")) {
                    this.advance()
                }
            }

            this.consume(")", "Expected closing parenthesis")

            return {
                type: "methodCall",
                object: { type: "identifier", name: "global" },
                method: name,
                arguments: args,
            }
        }

        return {
            type: "identifier",
            name,
        }
    }

    private parseGroupedExpression(): ASTNode {
        this.consume("(", "Expected opening parenthesis")
        const expr = this.parseExpression(0)
        this.consume(")", "Expected closing parenthesis")
        return expr
    }

    private parseArray(): ASTNode {
        this.advance() // consume [

        const elements: ASTNode[] = []
        let hasKeyValuePairs = false

        while (!this.check("]") && !this.isAtEnd()) {
            // Peek ahead to see if this might be a key-value pair
            const isKeyValuePair = this.checkType("identifier") && this.peekNext()?.value === ":"

            if (isKeyValuePair) {
                hasKeyValuePairs = true
                const key = this.current().value
                this.advance() // consume key
                this.consume(":", "Expected :")
                const value = this.parseExpression(0)

                elements.push({
                    type: "typeInstance",
                    typeName: "KeyValue",
                    fields: [
                        { key: "key", value: { type: "literal", valueType: "string", value: key } },
                        { key: "value", value },
                    ],
                } as any)
            } else {
                elements.push(this.parseExpression(0))
            }

            if (this.check(",")) {
                this.advance()
            }
        }

        this.consume("]", "Expected closing bracket")

        // If we have key-value pairs, return as an object (typeInstance with Array typeName indicates object)
        if (hasKeyValuePairs && elements.length > 0) {
            // Convert key-value pairs to a proper object
            const fields: Array<{ key: string; value: ASTNode }> = []
            for (const elem of elements) {
                if ((elem as any).typeName === "KeyValue") {
                    const keyField = (elem as any).fields.find((f: any) => f.key === "key")
                    const valueField = (elem as any).fields.find((f: any) => f.key === "value")
                    if (keyField && valueField && (keyField.value as Literal).type === "literal") {
                        fields.push({
                            key: String((keyField.value as Literal).value),
                            value: valueField.value,
                        })
                    }
                }
            }
            return {
                type: "typeInstance",
                typeName: "Object",
                fields,
            }
        }

        // Return as a regular array
        return {
            type: "typeInstance",
            typeName: "Array",
            fields: elements.map((el, i) => ({ key: i.toString(), value: el })),
        }
    }

    private parseBlock(): ASTNode {
        this.advance() // consume {

        let parameters: string[] = []

        // Check for block parameters: { x, y | body } or { x: Int, y: String | body }
        if (this.checkType("identifier")) {
            const paramStart = this.position
            parameters.push(this.current().value)
            this.advance()

            // Skip type annotation if present: x: Int
            if (this.check(":")) {
                this.advance()
                // Skip the type expression (just consume one identifier for now)
                if (this.checkType("identifier")) {
                    this.advance()
                }
            }

            while (this.check(",")) {
                this.advance()
                if (this.checkType("identifier")) {
                    parameters.push(this.current().value)
                    this.advance()

                    // Skip type annotation if present
                    if (this.check(":")) {
                        this.advance()
                        if (this.checkType("identifier")) {
                            this.advance()
                        }
                    }
                }
            }

            if (this.check("|")) {
                this.advance()
            } else {
                // Not a parameter list, reset
                this.position = paramStart
                parameters = []
            }
        }

        const body: ASTNode[] = []
        while (!this.check("}") && !this.isAtEnd()) {
            body.push(this.parseExpression(0))
            if (this.check(";") || this.check(",")) {
                this.advance()
            }
        }

        this.consume("}", "Expected closing brace")

        return {
            type: "block",
            parameters: parameters.length > 0 ? parameters : undefined,
            body,
        }
    }

    private parseBinaryOp(left: ASTNode, operator: string): ASTNode {
        const precedence = this.precedences[operator] || 0
        const right = this.parseExpression(precedence + 1)

        return {
            type: "binaryOp",
            operator,
            left,
            right,
        }
    }

    private parseUnaryOp(operator: string): ASTNode {
        this.advance()
        const operand = this.parseExpression(50) // High precedence for unary
        return {
            type: "unaryOp",
            operator,
            operand,
        }
    }

    private parseAssignment(left: ASTNode): ASTNode {
        // Support both simple variable assignment and pattern matching
        let variable: string
        let pattern: ASTNode | undefined

        if (left.type === "identifier") {
            variable = (left as Identifier).name
        } else if (left.type === "typeInstance") {
            // Pattern matching assignment: User [ repos: ?repos ] := obj
            // The left side has already been partially parsed as a typeInstance,
            // but if it contains patterns, we need to reparse it
            const fields = (left as any).fields

            // Check if any field looks like it might be a pattern (has ? in it)
            let isPattern = false
            for (const field of fields) {
                if ((field.value as any).type === "identifier" && (field.value as any).name === "?") {
                    isPattern = true
                    break
                }
                // Check if it looks like a capture pattern got parsed as something else
                if ((field.value as any).value === "?") {
                    isPattern = true
                    break
                }
            }

            if (isPattern || fields.length > 0) {
                // This is a pattern
                variable = "_match"
                pattern = left
            } else {
                throw this.error("Invalid assignment target")
            }
        } else {
            throw this.error("Invalid assignment target")
        }

        const value = this.parseExpression(1)

        return {
            type: "assignment",
            variable,
            value,
            pattern,
        }
    }

    private parseKeyValue(left: ASTNode): ASTNode {
        // Used for creating key-value pairs in type instances
        const value = this.parseExpression(this.precedences[":"] + 1)

        return {
            type: "typeInstance",
            typeName: "KeyValue",
            fields: [
                { key: "key", value: left },
                { key: "value", value: value },
            ],
        }
    }

    private parseFieldAccessOrMethod(left: ASTNode): ASTNode {
        const field = this.current().value
        this.advance()

        // Check if this is a method call with parentheses
        if (this.check("(")) {
            this.advance()
            const args: ASTNode[] = []

            while (!this.check(")") && !this.isAtEnd()) {
                args.push(this.parseExpression(0))
                if (this.check(",")) {
                    this.advance()
                }
            }

            this.consume(")", "Expected closing parenthesis")

            return {
                type: "methodCall",
                object: left,
                method: field,
                arguments: args,
            }
        }

        // Check if this is a method call with a block argument
        if (this.check("{")) {
            const block = this.parseExpression(0)
            return {
                type: "methodCall",
                object: left,
                method: field,
                arguments: [block],
            }
        }

        return {
            type: "fieldAccess",
            object: left,
            field,
        }
    }

    private parseTypeInstance(left: ASTNode): ASTNode {
        if (left.type !== "identifier") {
            throw this.error("Expected type name before [")
        }

        const typeName = (left as Identifier).name
        const fields: Array<{ key: string; value: ASTNode }> = []

        // Note: [ has already been consumed by the infix parser

        while (!this.check("]") && !this.isAtEnd()) {
            // Check for string key: "key": value or "key": ?capture
            if (this.checkType("string")) {
                const key = this.current().value
                this.advance()
                this.consume(":", "Expected : after key")

                if (this.check("?")) {
                    // Capture pattern
                    this.advance()
                    const captureName = this.current().value
                    this.advance()

                    // Check for nested pattern
                    let nestedPattern: ASTNode | undefined
                    if (this.check("[")) {
                        nestedPattern = this.parsePatternExpression()
                    }

                    fields.push({
                        key: key,
                        value: {
                            type: "capturePattern",
                            name: captureName,
                            pattern: nestedPattern,
                        } as CapturePattern,
                    })
                } else {
                    // Literal value
                    const value = this.parseExpression(this.precedences[","] || 0)
                    fields.push({ key, value })
                }
            } else if (this.checkType("identifier")) {
                const key = this.current().value
                this.advance()

                if (!this.check(":")) {
                    throw this.error("Expected : after field name")
                }
                this.advance()

                if (this.check("?")) {
                    // Capture pattern: fieldName: ?captureName
                    this.advance()
                    const captureName = this.current().value
                    this.advance()

                    let nestedPattern: ASTNode | undefined
                    if (this.check("[")) {
                        nestedPattern = this.parsePatternExpression()
                    }

                    fields.push({
                        key: key,
                        value: {
                            type: "capturePattern",
                            name: captureName,
                            pattern: nestedPattern,
                        } as CapturePattern,
                    })
                } else {
                    // Regular value - but stop at low precedence operators that might be patterns
                    const value = this.parsePatternValue()
                    fields.push({ key, value })
                }
            } else {
                throw this.error("Expected field name or key in type instance")
            }

            if (this.check(",")) {
                this.advance()
            }
        }

        this.consume("]", "Expected closing bracket")

        return {
            type: "typeInstance",
            typeName,
            fields,
        }
    }

    /**
     * Parse a value inside a type instance/pattern context.
     * Stops at ] and , to avoid mis-parsing.
     */
    private parsePatternValue(): ASTNode {
        const token = this.current()

        let prefixParser = this.prefixParsers[token.type]
        if (!prefixParser) {
            prefixParser = this.prefixParsers[token.value]
        }

        if (!prefixParser) {
            throw this.error(`Unexpected token: ${token.value}`)
        }

        let left = prefixParser()

        // In pattern context, stop at these low-precedence tokens
        while (!this.isAtEnd() && !this.check("]") && !this.check(",") && !this.check(";")) {
            const op = this.current().value

            // Don't parse : as infix in pattern context
            if (op === ":") break

            const infixParser = this.infixParsers[op]
            if (!infixParser) break

            const precedence = this.precedences[op] || 0
            if (precedence === 0) break

            this.advance()
            left = infixParser(left)
        }

        return left
    }

    private parseFunctionDeclaration(): ASTNode {
        this.advance() // consume 'fn'

        const name = this.current().value
        this.advance()

        const parameters: FunctionParameter[] = []

        // Parse parameters
        while (!this.check(":=") && !this.isAtEnd() && (this.checkType("identifier") || this.check("("))) {
            if (this.check("(")) {
                this.advance()
                while (!this.check(")") && !this.isAtEnd()) {
                    const paramName = this.current().value
                    this.advance()

                    let paramType: ASTNode | undefined
                    if (this.check(":")) {
                        this.advance()
                        paramType = this.parseType()
                    }

                    parameters.push({
                        type: "parameter",
                        name: paramName,
                        typeAnnotation: paramType,
                    })

                    if (this.check(",")) {
                        this.advance()
                    }
                }
                this.consume(")", "Expected closing parenthesis")
                break
            } else {
                const paramName = this.current().value
                this.advance()

                let paramType: ASTNode | undefined
                if (this.check(":")) {
                    this.advance()
                    paramType = this.parseType()
                }

                parameters.push({
                    type: "parameter",
                    name: paramName,
                    typeAnnotation: paramType,
                })
            }
        }

        this.consume(":=", "Expected := in function declaration")

        const body = this.parseExpression(0)

        return {
            type: "functionDeclaration",
            name,
            parameters,
            body,
        }
    }

    private parseTypeDeclaration(): ASTNode {
        const isAbstract = this.current().value === "abstract"
        if (isAbstract) {
            this.advance()
        }

        this.advance() // consume 'type'

        const name = this.current().value
        this.advance()

        let parent: string | undefined
        if (this.check("<:")) {
            this.advance()
            parent = this.current().value
            this.advance()
        }

        const fields: Array<{ name: string; fieldType: ASTNode }> = []
        let variants: ADTVariant[] | undefined

        // Check for ADT syntax: type Name := | Variant1 [...] | Variant2 [...]
        if (this.check(":=")) {
            this.advance() // consume :=
            variants = this.parseADTVariants()
        }
        // Check for product type syntax: type Name: field: Type
        else if (this.check(":")) {
            this.consume(":", "Expected : in type declaration")

            while (!this.isAtEnd() && !this.isStatementEnd()) {
                const fieldName = this.current().value
                this.advance()

                this.consume(":", "Expected : in field declaration")

                const fieldType = this.parseType()
                fields.push({ name: fieldName, fieldType })

                if (this.check(",")) {
                    this.advance()
                } else {
                    break
                }
            }
        }

        return {
            type: "typeDeclaration",
            name,
            isAbstract,
            parent,
            fields,
            variants,
        }
    }

    private parseADTVariants(): ADTVariant[] {
        const variants: ADTVariant[] = []

        // Keep parsing variants until we reach end or something that's not a variant
        while (!this.isAtEnd()) {
            // Check for pipe separator - variants must start with |
            if (!this.check("|")) {
                // If we're not at a newline or statement separator, this is an error
                // Otherwise, we've reached the end of the variants
                if (!this.isStatementEnd() && !this.isAtEnd()) {
                    // We have content that's not a variant, stop here
                    break
                }
                // Check if next token might be a variant (on next line)
                if (this.isStatementEnd()) {
                    // Skip to next meaningful token
                    this.consumeStatementEnd()
                    if (!this.check("|")) {
                        break
                    }
                } else {
                    break
                }
            }

            if (!this.check("|")) {
                break
            }

            this.advance() // consume |

            const variantName = this.current().value
            this.advance()

            let variantFields: Array<{ name: string; fieldType: ASTNode }> = []

            // Check if variant has fields: | Admin [ name: String ]
            if (this.check("[")) {
                this.advance() // consume [

                while (!this.check("]") && !this.isAtEnd()) {
                    const fieldName = this.current().value
                    this.advance()

                    if (this.check(":")) {
                        this.advance()
                        const fieldType = this.parseType()
                        variantFields.push({ name: fieldName, fieldType })

                        if (this.check(",")) {
                            this.advance()
                        }
                    }
                }

                this.consume("]", "Expected ] after variant fields")
            }

            variants.push({
                name: variantName,
                fields: variantFields,
            })
        }

        return variants
    }

    private parseType(): ASTNode {
        const name = this.current().value
        this.advance()

        // Handle generic types: Type<T, U>
        if (this.check("<")) {
            this.advance()
            const typeParams: ASTNode[] = []

            while (!this.check(">") && !this.isAtEnd()) {
                typeParams.push(this.parseType())
                if (this.check(",")) {
                    this.advance()
                }
            }

            this.consume(">", "Expected >")

            return {
                type: "typeInstance",
                typeName: name,
                fields: typeParams.map((tp, i) => ({ key: `param${i}`, value: tp })),
            }
        }

        return {
            type: "identifier",
            name,
        }
    }

    private parseMatchExpression(): ASTNode {
        this.advance() // consume 'match'

        const value = this.parseExpression(0)

        this.consume("{", "Expected { to start match block")

        const arms: PatternArm[] = []

        while (!this.check("}") && !this.isAtEnd()) {
            // Parse pattern - can be identifier, ?, or complex pattern with captures
            let pattern: ASTNode
            if (this.check("?")) {
                this.advance()
                // Check if ? is followed by a name (capture binding) or just standalone wildcard
                if (this.checkType("identifier")) {
                    const name = this.current().value
                    this.advance()
                    pattern = {
                        type: "capturePattern",
                        name,
                    }
                } else {
                    // Standalone ? wildcard
                    pattern = {
                        type: "identifier",
                        name: "?",
                    }
                }
            } else {
                pattern = this.parsePatternExpression()
            }

            this.consume("=>", "Expected => in match arm")

            // Parse body expression
            const body = this.parseExpression(0)

            arms.push({
                type: "patternArm",
                pattern,
                body,
            })

            // Optional separator
            if (this.check(";")) {
                this.advance()
            }
        }

        this.consume("}", "Expected } to end match block")

        return {
            type: "matchExpression",
            value,
            arms,
        }
    }

    private parsePatternExpression(): ASTNode {
        // Parse pattern: can be identifier, identifier with field captures like Admin [ ?name, ?repos ]
        if (!this.checkType("identifier")) {
            throw this.error("Expected identifier in pattern")
        }

        const variantName = this.current().value
        this.advance()

        // Check if this pattern has field captures
        if (this.check("[")) {
            return this.parsePatternWithCaptures(variantName)
        }

        return {
            type: "identifier",
            name: variantName,
        }
    }

    private parsePatternWithCaptures(variantName: string): ASTNode {
        this.advance() // consume [

        const fields: Array<{ key: string; value: ASTNode }> = []

        while (!this.check("]") && !this.isAtEnd()) {
            // Check for string key (for object patterns): "key": ?capture
            if (this.checkType("string")) {
                const keyLiteral = this.current().value
                this.advance()
                this.consume(":", "Expected : after key in pattern")

                // Now expect either ?capture or expression
                if (this.check("?")) {
                    this.advance()
                    const captureName = this.current().value
                    this.advance()

                    // Check for nested pattern: [ ... ]
                    let nestedPattern: ASTNode | undefined
                    if (this.check("[")) {
                        nestedPattern = this.parsePatternExpression()
                    }

                    fields.push({
                        key: keyLiteral,
                        value: {
                            type: "capturePattern",
                            name: captureName,
                            pattern: nestedPattern,
                        } as CapturePattern,
                    })
                } else {
                    // Literal pattern for object key
                    const expr = this.parseExpression(0)
                    fields.push({
                        key: keyLiteral,
                        value: expr,
                    })
                }
            } else if (this.checkType("identifier")) {
                // Check for fieldName: ?capture or just ?capture pattern
                if (this.check("?")) {
                    // Direct capture: ?captureName [ nested ]
                    this.advance()
                    const captureName = this.current().value
                    this.advance()

                    let nestedPattern: ASTNode | undefined
                    if (this.check("[")) {
                        nestedPattern = this.parsePatternExpression()
                    }

                    fields.push({
                        key: captureName,
                        value: {
                            type: "capturePattern",
                            name: captureName,
                            pattern: nestedPattern,
                        } as CapturePattern,
                    })
                } else {
                    // fieldName: ?capture or fieldName: literal
                    const fieldName = this.current().value
                    this.advance()

                    if (this.check(":")) {
                        this.advance()

                        if (this.check("?")) {
                            // fieldName: ?captureName [ nested ]
                            this.advance()
                            const captureName = this.current().value
                            this.advance()

                            let nestedPattern: ASTNode | undefined
                            if (this.check("[")) {
                                nestedPattern = this.parsePatternExpression()
                            }

                            fields.push({
                                key: fieldName,
                                value: {
                                    type: "capturePattern",
                                    name: captureName,
                                    pattern: nestedPattern,
                                } as CapturePattern,
                            })
                        } else {
                            // fieldName: literal pattern
                            const expr = this.parseExpression(0)
                            fields.push({
                                key: fieldName,
                                value: expr,
                            })
                        }
                    } else {
                        // Just a field name without colon - treat as capture with same name
                        fields.push({
                            key: fieldName,
                            value: {
                                type: "capturePattern",
                                name: fieldName,
                            } as CapturePattern,
                        })
                    }
                }
            } else {
                // Literal pattern value
                const expr = this.parseExpression(0)
                fields.push({
                    key: `field_${fields.length}`,
                    value: expr,
                })
            }

            if (this.check(",")) {
                this.advance()
            }
        }

        this.consume("]", "Expected ] after pattern fields")

        return {
            type: "typeInstance",
            typeName: variantName,
            fields,
        }
    }

    private parseQuotedForm(): ASTNode {
        this.advance() // consume #

        // Quoted form starts with [ or is a single expression
        const expression = this.parseExpression(100) // Very high precedence

        return {
            type: "quotedForm",
            expression,
        }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    private current(): Token {
        if (this.position < this.tokens.length) {
            return this.tokens[this.position]
        }
        return this.tokens[this.tokens.length - 1] // Return EOF
    }

    private peekNext(): Token | undefined {
        if (this.position + 1 < this.tokens.length) {
            return this.tokens[this.position + 1]
        }
        return undefined
    }

    private advance(): Token {
        const token = this.current()
        this.lastTokenLine = token.line
        if (!this.isAtEnd()) {
            this.position++
        }
        return token
    }

    private check(value: string): boolean {
        if (this.isAtEnd()) return false
        return this.current().value === value
    }

    private checkType(type: TokenType): boolean {
        if (this.isAtEnd()) return false
        return this.current().type === type
    }

    private consume(expected: string, message: string): Token {
        if (this.check(expected)) {
            return this.advance()
        }
        throw this.error(message)
    }

    private isAtEnd(): boolean {
        return this.current().type === "eof"
    }

    private isStatementEnd(): boolean {
        // Check for explicit statement terminators
        if (
            this.isAtEnd() ||
            this.check(";") ||
            this.check(",") ||
            this.check("}") ||
            this.check("]") ||
            this.check(")")
        ) {
            return true
        }

        // Treat newlines as statement end
        const currentToken = this.current()
        return currentToken.line > this.lastTokenLine
    }

    private consumeStatementEnd(): void {
        if (this.check(";")) {
            this.advance()
        }
    }

    private getCurrentPrecedence(): number {
        const token = this.current()
        return this.precedences[token.value] || 0
    }

    private error(message: string): Error {
        const token = this.current()
        return new Error(`Parse error at line ${token.line}, column ${token.column}: ${message}`)
    }
}

// ============================================================================
// Public API
// ============================================================================

export function parse(source: string): ASTNode[] {
    const parser = new Parser(source)
    return parser.parse()
}
