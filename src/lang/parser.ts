import { Lexer } from "./lexer"
import { PrecedenceTable } from "./precedence"
import { TokenScanner } from "./scanner"
import type { ADTVariant, ASTNode, FunctionParameter, Literal, PatternArm, TypeInstance } from "./types"

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

type PrefixParser = () => ASTNode
type InfixParser = (left: ASTNode) => ASTNode

export class Parser {
    private scanner: TokenScanner
    private precedence: PrecedenceTable
    private prefixParsers: Record<string, PrefixParser> = {}
    private infixParsers: Record<string, InfixParser> = {}

    constructor(input: string) {
        const tokens = new Lexer(input).tokenize()
        this.scanner = new TokenScanner(tokens)
        this.precedence = new PrecedenceTable(PRECEDENCE_LEVELS)
        this.registerRules()
    }

    public parse(): ASTNode[] {
        const statements: ASTNode[] = []
        while (!this.scanner.isAtEnd()) {
            statements.push(this.parseStatement())
        }
        return statements
    }

    // =========================
    // Core Engine
    // =========================

    private registerRules() {
        // Literals & Atoms
        ;["number", "string", "true", "false"].forEach(t => (this.prefixParsers[t] = () => this.parseLiteral()))
        this.prefixParsers["identifier"] = () => this.parseIdentifierOrCall()

        // Groups & Structures
        this.prefixParsers["("] = () => this.parseGroup()
        this.prefixParsers["["] = () => this.parseArray()
        this.prefixParsers["{"] = () => this.parseBlock()

        // Keywords
        this.prefixParsers["fn"] = () => this.parseFn()
        this.prefixParsers["type"] = () => this.parseTypeDecl(false)
        this.prefixParsers["abstract"] = () => this.parseTypeDecl(true)
        this.prefixParsers["match"] = () => this.parseMatch()
        this.prefixParsers["#"] = () => ({
            type: "quotedForm",
            expression: (this.scanner.advance(), this.parseExpr(100)),
        })

        // Prefix Ops
        ;["-", "!"].forEach(
            op =>
                (this.prefixParsers[op] = () => ({
                    type: "unaryOp",
                    operator: op,
                    operand: (this.scanner.advance(), this.parseExpr(50)),
                }))
        )

        // Infix Ops
        ;["+", "-", "*", "/", "%", "^", "==", "!=", "<", ">", "<=", ">=", "&&", "||"].forEach(
            op =>
                (this.infixParsers[op] = (left: ASTNode) => ({
                    type: "binaryOp",
                    operator: op,
                    left,
                    right: this.parseExpr(this.precedence.getPrecedence(op) + 1),
                }))
        )

        // Special Infix
        this.infixParsers[":="] = (left: ASTNode) => this.parseAssignment(left)
        this.infixParsers[":"] = (left: ASTNode) => this.parseKeyValue(left)
        this.infixParsers["."] = (left: ASTNode) => this.parseDotAccess(left)
        this.infixParsers["["] = (left: ASTNode) => this.parseTypeInstance(left)
    }

    private parseStatement(): ASTNode {
        const stmt = this.parseExpr(0)
        if (this.scanner.check(";")) this.scanner.advance()
        return stmt
    }

    private parseExpr(precedence: number): ASTNode {
        const token = this.scanner.current()
        const parser = this.prefixParsers[token.type] || this.prefixParsers[token.value]

        if (!parser) throw this.scanner.error(`Unexpected token: ${token.value}`)

        let left = parser()

        while (
            !this.scanner.isAtEnd() &&
            !this.scanner.isStatementEnd() &&
            this.precedence.getPrecedence(this.scanner.current().value) > precedence
        ) {
            const op = this.scanner.current().value
            const infix = this.infixParsers[op]
            if (!infix) break
            this.scanner.advance()
            left = infix(left)
        }
        return left
    }

    // =========================
    // Parsers
    // =========================

    private parseLiteral(): Literal {
        const { type, value } = this.scanner.advance()
        if (type === "number") return { type: "literal", valueType: "number", value: parseFloat(value) }
        if (type === "string") return { type: "literal", valueType: "string", value }
        return { type: "literal", valueType: "boolean", value: value === "true" }
    }

    private parseIdentifierOrCall(): ASTNode {
        const name = this.scanner.advance().value
        if (this.scanner.check("(")) {
            const args = this.parseList("(", ")", ",", () => this.parseExpr(0))
            return { type: "methodCall", object: { type: "identifier", name: "global" }, method: name, arguments: args }
        }
        return { type: "identifier", name }
    }

    private parseGroup(): ASTNode {
        this.scanner.consume("(")
        const expr = this.parseExpr(0)
        this.scanner.consume(")")
        return expr
    }

    private parseArray(): ASTNode {
        const elements = this.parseList("[", "]", ",", () => {
            if (this.scanner.checkType("identifier") && this.scanner.peek()?.value === ":") {
                const key = this.scanner.advance().value
                this.scanner.consume(":")
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
        this.scanner.consume("{")
        let parameters: string[] | undefined

        const start = this.scanner.createCheckpoint()
        if (this.scanner.checkType("identifier")) {
            const potentialParams = []
            while (this.scanner.checkType("identifier") || this.scanner.check(",")) {
                if (this.scanner.checkType("identifier")) {
                    potentialParams.push(this.scanner.advance().value)
                    if (this.scanner.check(":")) {
                        this.scanner.advance()
                        this.scanner.advance()
                    }
                } else {
                    this.scanner.advance()
                }
            }
            if (this.scanner.check("|")) {
                this.scanner.advance()
                parameters = potentialParams
            } else {
                this.scanner.restoreCheckpoint(start)
            }
        }

        const body: ASTNode[] = []
        while (!this.scanner.check("}") && !this.scanner.isAtEnd()) {
            body.push(this.parseStatement())
        }
        this.scanner.consume("}")
        return { type: "block", parameters, body }
    }

    private parseFn(): ASTNode {
        this.scanner.advance() // fn
        const name = this.scanner.consumeType("identifier").value
        const parameters: FunctionParameter[] = []

        const hasParens = this.scanner.match("(")
        while (!this.scanner.check(hasParens ? ")" : ":=") && !this.scanner.isAtEnd()) {
            const pName = this.scanner.consumeType("identifier").value
            const typeAnnotation = this.scanner.match(":") ? this.parseType() : undefined
            parameters.push({ type: "parameter", name: pName, typeAnnotation })
            this.scanner.match(",")
        }
        if (hasParens) this.scanner.consume(")")
        this.scanner.consume(":=")
        return { type: "functionDeclaration", name, parameters, body: this.parseExpr(0) }
    }

    private parseTypeDecl(isAbstract: boolean): ASTNode {
        if (isAbstract) this.scanner.advance() // abstract
        this.scanner.consume("type")
        const name = this.scanner.consumeType("identifier").value
        const parent = this.scanner.match("<:") ? this.scanner.consumeType("identifier").value : undefined

        if (this.scanner.match(":=")) {
            // ADT Variants
            const variants: ADTVariant[] = []
            while (!this.scanner.isAtEnd()) {
                if (!this.scanner.check("|")) break
                this.scanner.advance() // consume |

                const vName = this.scanner.consumeType("identifier").value
                let vFields: { name: string; fieldType: ASTNode }[] = []
                if (this.scanner.check("[")) {
                    vFields = this.parseList("[", "]", ",", () => {
                        const fName = this.scanner.consumeType("identifier").value
                        this.scanner.consume(":")
                        return { name: fName, fieldType: this.parseType() }
                    })
                }
                variants.push({ type: "adtVariant", name: vName, fields: vFields })
            }
            return { type: "typeDeclaration", name, isAbstract, parent, fields: [], variants }
        }

        // Record Type
        const fields: any[] = []
        if (this.scanner.match(":")) {
            while (this.scanner.checkType("identifier")) {
                const fName = this.scanner.advance().value
                this.scanner.consume(":")
                fields.push({ name: fName, fieldType: this.parseType() })
                if (!this.scanner.match(",")) break
            }
        }
        return { type: "typeDeclaration", name, isAbstract, parent, fields }
    }

    private parseMatch(): ASTNode {
        this.scanner.advance() // match
        const value = this.parseExpr(0)
        this.scanner.consume("{")
        const arms: PatternArm[] = []

        while (!this.scanner.check("}") && !this.scanner.isAtEnd()) {
            const pattern = this.parseMatchPattern()
            this.scanner.consume("=>")
            arms.push({ type: "patternArm", pattern, body: this.parseExpr(0) })
            if (!this.scanner.check("}")) this.scanner.match(",") || this.scanner.match(";")
        }
        this.scanner.consume("}")
        return { type: "matchExpression", value, arms }
    }

    private parseMatchPattern(): ASTNode {
        // Capture pattern
        if (this.scanner.check("?")) {
            return this.parseCapture()
        }

        // Check if it's an identifier (could be a type constructor or simple identifier)
        if (this.scanner.checkType("identifier")) {
            const name = this.scanner.advance().value

            // Type instance pattern: Name[field: pattern, ...]
            if (this.scanner.check("[")) {
                const fields = this.parseList("[", "]", ",", () => {
                    let key: string
                    if (this.scanner.checkType("string")) key = this.scanner.advance().value
                    else key = this.scanner.consumeType("identifier").value

                    let value: ASTNode
                    if (!this.scanner.check(":")) {
                        value = { type: "capturePattern", name: key }
                    } else {
                        this.scanner.consume(":")
                        if (this.scanner.check("?")) value = this.parseCapture()
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
        this.scanner.consume("?")
        const name = this.scanner.checkType("identifier") ? this.scanner.advance().value : "?"
        const pattern = this.scanner.check("[") ? this.parseMatchPattern() : undefined
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
            throw this.scanner.error(`Invalid assignment target: ${left.type}`)
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
                { key: "value", value: this.parseExpr(this.precedence.getPrecedence(":") + 1) },
            ],
        }
    }

    private parseDotAccess(left: ASTNode): ASTNode {
        const field = this.scanner.consumeType("identifier").value
        if (this.scanner.check("(")) {
            const args = this.parseList("(", ")", ",", () => this.parseExpr(0))
            return { type: "methodCall", object: left, method: field, arguments: args }
        }
        if (this.scanner.check("{")) {
            return { type: "methodCall", object: left, method: field, arguments: [this.parseBlock()] }
        }
        return { type: "fieldAccess", object: left, field }
    }

    private parseTypeInstance(left: ASTNode): ASTNode {
        const typeName = (left as any).name
        const fields = this.parseList(null, "]", ",", () => {
            let key = this.scanner.checkType("string")
                ? this.scanner.advance().value
                : this.scanner.consumeType("identifier").value
            this.scanner.consume(":")
            const val = this.scanner.check("?") ? this.parseCapture() : this.parseExpr(0)
            return { key, value: val }
        })
        return { type: "typeInstance", typeName, fields }
    }

    // =========================
    // Helpers
    // =========================

    private parseType(): ASTNode {
        const name = this.scanner.consumeType("identifier").value
        if (this.scanner.match("<")) {
            const params = this.parseList(null, ">", ",", () => this.parseType())
            return { type: "typeInstance", typeName: name, fields: params.map((p, i) => ({ key: `p${i}`, value: p })) }
        }
        return { type: "identifier", name }
    }

    private parseList<T>(start: string | null, end: string, sep: string, fn: () => T): T[] {
        if (start) this.scanner.consume(start)
        const items: T[] = []
        while (!this.scanner.check(end) && !this.scanner.isAtEnd()) {
            items.push(fn())
            if (this.scanner.check(sep)) this.scanner.advance()
        }
        this.scanner.consume(end)
        return items
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
}

export function parse(input: string) {
    return new Parser(input).parse()
}
