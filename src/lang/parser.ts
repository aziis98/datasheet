import { Lexer } from "./lexer"
import type {
    ADTVariant,
    ASTNode,
    FunctionParameter,
    Literal,
    PatternArm,
    Token,
    TokenType,
    TypeInstance,
} from "./types"

// Operator precedence levels (lower index = lower precedence)
const PRECEDENCE_LEVELS = [
    [":="],
    ["=>"],
    ["||"],
    ["&&"],
    ["==", "!="],
    ["<", ">", "<=", ">="],
    ["+", "-"],
    ["*", "/", "%"],
    ["^"],
    [".", "["],
    ["("], // Call precedence
]

// Build precedence table from levels
const PRECEDENCE: Record<string, number> = {}
PRECEDENCE_LEVELS.forEach((operators, index) => {
    const precedenceValue = (index + 1) * 10
    operators.forEach(op => {
        PRECEDENCE[op] = precedenceValue
    })
})

// export interface Token {
//     type: TokenType
//     value: string
//     line: number
//     column: number
// }

// export type TokenType = "number" | "string" | "identifier" | "keyword" | "operator" | "punctuation" | "eof"

export class Parser {
    private tokens: Token[]
    private pos = 0
    private prefixParsers: Record<string, () => ASTNode> = {}
    private infixParsers: Record<string, (left: ASTNode) => ASTNode> = {}

    constructor(input: string) {
        this.tokens = new Lexer(input).tokenize()
        this.registerRules()
    }

    public parse(): ASTNode[] {
        const statements: ASTNode[] = []
        while (!this.isAtEnd()) {
            statements.push(this.parseStatement())
        }
        return statements
    }

    // =========================
    // Core Engine
    // =========================

    private registerRules() {
        // Literals & Atoms
        ;["number", "string", "true", "false"].forEach(t => this.prefix(t, () => this.parseLiteral()))
        this.prefix("identifier", () => this.parseIdentifierOrCall())

        // Groups & Structures
        this.prefix("(", () => this.parseGroup())
        this.prefix("[", () => this.parseArray())
        this.prefix("{", () => this.parseBlock())

        // Keywords
        this.prefix("fn", () => this.parseFn())
        this.prefix("type", () => this.parseTypeDecl(false))
        this.prefix("abstract", () => this.parseTypeDecl(true))
        this.prefix("match", () => this.parseMatch())
        this.prefix("#", () => ({ type: "quotedForm", expression: (this.advance(), this.parseExpr(100)) }))

        // Prefix Ops
        ;["-", "!"].forEach(op =>
            this.prefix(op, () => ({ type: "unaryOp", operator: op, operand: (this.advance(), this.parseExpr(50)) }))
        )

        // Infix Ops
        ;["+", "-", "*", "/", "%", "^", "==", "!=", "<", ">", "<=", ">=", "&&", "||"].forEach(op =>
            this.infix(op, left => ({
                type: "binaryOp",
                operator: op,
                left,
                right: this.parseExpr(PRECEDENCE[op] + 1),
            }))
        )

        // Special Infix
        this.infix(":=", left => this.parseAssignment(left))
        this.infix(":", left => this.parseKeyValue(left))
        this.infix(".", left => this.parseDotAccess(left))
        this.infix("[", left => this.parseTypeInstance(left))
    }

    private prefix(key: string, fn: () => ASTNode) {
        this.prefixParsers[key] = fn
    }
    private infix(key: string, fn: (left: ASTNode) => ASTNode) {
        this.infixParsers[key] = fn
    }

    private parseStatement(): ASTNode {
        const stmt = this.parseExpr(0)
        if (this.check(";")) this.advance()
        return stmt
    }

    private parseExpr(precedence: number): ASTNode {
        const token = this.current()
        const parser = this.prefixParsers[token.type] || this.prefixParsers[token.value]

        if (!parser) throw this.error(`Unexpected token: ${token.value}`)

        let left = parser()

        while (!this.isAtEnd() && !this.isStatementEnd() && this.getPrecedence() > precedence) {
            const op = this.current().value
            const infix = this.infixParsers[op]
            if (!infix) break
            this.advance()
            left = infix(left)
        }
        return left
    }

    // =========================
    // Parsers
    // =========================

    private parseLiteral(): Literal {
        const { type, value } = this.advance()
        if (type === "number") return { type: "literal", valueType: "number", value: parseFloat(value) }
        if (type === "string") return { type: "literal", valueType: "string", value }
        return { type: "literal", valueType: "boolean", value: value === "true" }
    }

    private parseIdentifierOrCall(): ASTNode {
        const name = this.advance().value
        if (this.check("(")) {
            const args = this.parseList("(", ")", ",", () => this.parseExpr(0))
            return { type: "methodCall", object: { type: "identifier", name: "global" }, method: name, arguments: args }
        }
        return { type: "identifier", name }
    }

    private parseGroup(): ASTNode {
        this.consume("(")
        const expr = this.parseExpr(0)
        this.consume(")")
        return expr
    }

    private parseArray(): ASTNode {
        const elements = this.parseList("[", "]", ",", () => {
            if (this.checkType("identifier") && this.peek()?.value === ":") {
                const key = this.advance().value
                this.consume(":")
                return {
                    type: "typeInstance",
                    typeName: "KeyValue",
                    fields: [
                        { key: "key", value: this.lit(key) },
                        { key: "value", value: this.parseExpr(0) },
                    ],
                } as ASTNode
            }
            return this.parseExpr(0)
        })

        const isObj = elements.some(e => (e as any).typeName === "KeyValue")
        if (isObj) {
            const fields = elements
                .filter(e => (e as any).typeName === "KeyValue")
                .map(e => {
                    const k = ((e as any).fields[0].value as Literal).value as string
                    const v = (e as any).fields[1].value
                    return { key: k, value: v }
                })
            return { type: "typeInstance", typeName: "Object", fields }
        }

        return {
            type: "typeInstance",
            typeName: "Array",
            fields: elements.map((v, i) => ({ key: i.toString(), value: v })),
        }
    }

    private parseBlock(): ASTNode {
        this.consume("{")
        let parameters: string[] | undefined

        const start = this.pos
        if (this.checkType("identifier")) {
            const potentialParams = []
            while (this.checkType("identifier") || this.check(",")) {
                if (this.checkType("identifier")) {
                    potentialParams.push(this.advance().value)
                    if (this.check(":")) {
                        this.advance()
                        this.advance()
                    }
                } else {
                    this.advance()
                }
            }
            if (this.check("|")) {
                this.advance()
                parameters = potentialParams
            } else {
                this.pos = start
            }
        }

        const body: ASTNode[] = []
        while (!this.check("}") && !this.isAtEnd()) {
            body.push(this.parseStatement())
        }
        this.consume("}")
        return { type: "block", parameters, body }
    }

    private parseFn(): ASTNode {
        this.advance() // fn
        const name = this.consumeType("identifier").value
        const parameters: FunctionParameter[] = []

        const hasParens = this.match("(")
        while (!this.check(hasParens ? ")" : ":=") && !this.isAtEnd()) {
            const pName = this.consumeType("identifier").value
            const typeAnnotation = this.match(":") ? this.parseType() : undefined
            parameters.push({ type: "parameter", name: pName, typeAnnotation })
            this.match(",")
        }
        if (hasParens) this.consume(")")
        this.consume(":=")
        return { type: "functionDeclaration", name, parameters, body: this.parseExpr(0) }
    }

    private parseTypeDecl(isAbstract: boolean): ASTNode {
        if (isAbstract) this.advance() // abstract
        this.consume("type")
        const name = this.consumeType("identifier").value
        const parent = this.match("<:") ? this.consumeType("identifier").value : undefined

        if (this.match(":=")) {
            // ADT Variants
            const variants: ADTVariant[] = []
            while (!this.isAtEnd()) {
                if (!this.check("|")) break
                this.advance() // consume |

                const vName = this.consumeType("identifier").value
                let vFields: { name: string; fieldType: ASTNode }[] = []
                if (this.check("[")) {
                    vFields = this.parseList("[", "]", ",", () => {
                        const fName = this.consumeType("identifier").value
                        this.consume(":")
                        return { name: fName, fieldType: this.parseType() }
                    })
                }
                variants.push({ type: "adtVariant", name: vName, fields: vFields })
            }
            return { type: "typeDeclaration", name, isAbstract, parent, fields: [], variants }
        }

        // Record Type
        const fields: any[] = []
        if (this.match(":")) {
            while (this.checkType("identifier")) {
                const fName = this.advance().value
                this.consume(":")
                fields.push({ name: fName, fieldType: this.parseType() })
                if (!this.match(",")) break
            }
        }
        return { type: "typeDeclaration", name, isAbstract, parent, fields }
    }

    private parseMatch(): ASTNode {
        this.advance() // match
        const value = this.parseExpr(0)
        this.consume("{")
        const arms: PatternArm[] = []

        while (!this.check("}") && !this.isAtEnd()) {
            const pattern = this.parseMatchPattern()
            this.consume("=>")
            arms.push({ type: "patternArm", pattern, body: this.parseExpr(0) })
            if (!this.check("}")) this.match(",") || this.match(";")
        }
        this.consume("}")
        return { type: "matchExpression", value, arms }
    }

    private parseMatchPattern(): ASTNode {
        // Capture pattern
        if (this.check("?")) {
            return this.parseCapture()
        }

        // Check if it's an identifier (could be a type constructor or simple identifier)
        if (this.checkType("identifier")) {
            const name = this.advance().value

            // Type instance pattern: Name[field: pattern, ...]
            if (this.check("[")) {
                const fields = this.parseList("[", "]", ",", () => {
                    let key: string
                    if (this.checkType("string")) key = this.advance().value
                    else key = this.consumeType("identifier").value

                    let value: ASTNode
                    if (!this.check(":")) {
                        value = { type: "capturePattern", name: key }
                    } else {
                        this.consume(":")
                        if (this.check("?")) value = this.parseCapture()
                        else value = this.parseMatchPattern()
                    }
                    return { key, value }
                })
                return { type: "typeInstance", typeName: name, fields }
            }

            // Simple identifier pattern
            return { type: "identifier", name }
        }

        // Literal pattern (number, string, boolean, etc.)
        return this.parseLiteral()
    }

    private parseCapture(): ASTNode {
        this.consume("?")
        const name = this.checkType("identifier") ? this.advance().value : "?"
        const pattern = this.check("[") ? this.parseMatchPattern() : undefined
        return { type: "capturePattern", name, pattern }
    }

    // =========================
    // Operator Logic
    // =========================

    private parseAssignment(left: ASTNode): ASTNode {
        // Valid assignment targets: identifiers and type instances with captures
        const isPattern =
            left.type === "typeInstance" && (left as TypeInstance).fields.some(f => this.isCapture(f.value))
        const isValidTarget = left.type === "identifier" || isPattern

        if (!isValidTarget) {
            throw this.error(`Invalid assignment target: ${left.type}`)
        }

        const variable = left.type === "identifier" ? (left as any).name : "_match"
        const pattern = isPattern ? left : undefined

        return { type: "assignment", variable, value: this.parseExpr(1), pattern }
    }

    private parseKeyValue(left: ASTNode): ASTNode {
        return {
            type: "typeInstance",
            typeName: "KeyValue",
            fields: [
                { key: "key", value: left },
                { key: "value", value: this.parseExpr(PRECEDENCE[":"] + 1) },
            ],
        }
    }

    private parseDotAccess(left: ASTNode): ASTNode {
        const field = this.consumeType("identifier").value
        if (this.check("(")) {
            const args = this.parseList("(", ")", ",", () => this.parseExpr(0))
            return { type: "methodCall", object: left, method: field, arguments: args }
        }
        if (this.check("{")) {
            return { type: "methodCall", object: left, method: field, arguments: [this.parseBlock()] }
        }
        return { type: "fieldAccess", object: left, field }
    }

    private parseTypeInstance(left: ASTNode): ASTNode {
        const typeName = (left as any).name
        const fields = this.parseList(null, "]", ",", () => {
            let key = this.checkType("string") ? this.advance().value : this.consumeType("identifier").value
            this.consume(":")
            const val = this.check("?") ? this.parseCapture() : this.parseExpr(0)
            return { key, value: val }
        })
        return { type: "typeInstance", typeName, fields }
    }

    // =========================
    // Helpers
    // =========================

    private parseType(): ASTNode {
        const name = this.consumeType("identifier").value
        if (this.match("<")) {
            const params = this.parseList(null, ">", ",", () => this.parseType())
            return { type: "typeInstance", typeName: name, fields: params.map((p, i) => ({ key: `p${i}`, value: p })) }
        }
        return { type: "identifier", name }
    }

    private parseList<T>(start: string | null, end: string, sep: string, fn: () => T): T[] {
        if (start) this.consume(start)
        const items: T[] = []
        while (!this.check(end) && !this.isAtEnd()) {
            items.push(fn())
            if (this.check(sep)) this.advance()
        }
        this.consume(end)
        return items
    }

    private current(): Token {
        return this.tokens[this.pos] || { type: "eof", value: "", line: 0, column: 0 }
    }

    private peek() {
        return this.tokens[this.pos + 1]
    }

    private isAtEnd() {
        return this.current().type === "eof"
    }

    private advance() {
        return this.tokens[this.pos++] || this.current()
    }

    private check(val: string) {
        return !this.isAtEnd() && this.current().value === val
    }

    private checkType(t: TokenType) {
        return !this.isAtEnd() && this.current().type === t
    }

    private match(val: string) {
        if (this.check(val)) {
            this.advance()
            return true
        }
        return false
    }

    private consume(val: string) {
        if (!this.check(val)) throw this.error(`Expected '${val}'`)
        return this.advance()
    }

    private consumeType(t: TokenType) {
        if (!this.checkType(t)) throw this.error(`Expected ${t}`)
        return this.advance()
    }

    private lit(s: string): Literal {
        return { type: "literal", valueType: "string", value: s }
    }

    private isCapture(n: ASTNode): boolean {
        return (
            n.type === "capturePattern" ||
            (n.type === "typeInstance" && (n as TypeInstance).fields.some(f => this.isCapture(f.value)))
        )
    }

    private getPrecedence() {
        return PRECEDENCE[this.current().value] || 0
    }

    private isStatementEnd() {
        if (this.check(";") || this.check("}") || this.check("]")) return true
        if (this.pos > 0 && this.tokens[this.pos - 1].line < this.current().line) {
            return ![".", "[", "(", ",", "+", "-", "*", "/", "&&", "||", "=>", "|"].includes(this.current().value)
        }
        return false
    }

    private error(msg: string) {
        const t = this.current()
        return new Error(`${msg} at ${t.line}:${t.column}`)
    }
}

export function parse(input: string) {
    return new Parser(input).parse()
}
