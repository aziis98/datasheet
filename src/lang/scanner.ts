import type { Token, TokenType } from "./types"

/**
 * TokenScanner encapsulates all token stream management operations.
 * Provides a clean interface for token consumption, lookahead, and position management.
 */
export class TokenScanner {
    private pos = 0
    private tokens: Token[]

    constructor(tokens: Token[]) {
        this.tokens = tokens
    }

    /**
     * Get the current token without consuming it.
     */
    current(): Token {
        return this.tokens[this.pos] || { type: "eof", value: "", line: 0, column: 0 }
    }

    /**
     * Look ahead one token without consuming it.
     */
    peek(): Token | undefined {
        return this.tokens[this.pos + 1]
    }

    /**
     * Check if we're at the end of the token stream.
     */
    isAtEnd(): boolean {
        return this.current().type === "eof"
    }

    /**
     * Consume and return the current token, advancing position.
     */
    advance(): Token {
        return this.tokens[this.pos++] || this.current()
    }

    /**
     * Check if current token's value matches the given string.
     */
    check(val: string): boolean {
        return !this.isAtEnd() && this.current().value === val
    }

    /**
     * Check if current token's type matches the given type.
     */
    checkType(t: TokenType): boolean {
        return !this.isAtEnd() && this.current().type === t
    }

    /**
     * If current token matches, consume it and return true. Otherwise return false.
     */
    match(val: string): boolean {
        if (this.check(val)) {
            this.advance()
            return true
        }
        return false
    }

    /**
     * Assert current token matches value, consume it, and return it. Throw if mismatch.
     */
    consume(val: string): Token {
        if (!this.check(val)) throw this.error(`Expected '${val}'`)
        return this.advance()
    }

    /**
     * Assert current token type matches, consume it, and return it. Throw if mismatch.
     */
    consumeType(t: TokenType): Token {
        if (!this.checkType(t)) throw this.error(`Expected ${t}`)
        return this.advance()
    }

    /**
     * Get the current position in the token stream.
     */
    getPosition(): number {
        return this.pos
    }

    /**
     * Save current position for potential backtracking.
     */
    createCheckpoint(): number {
        return this.pos
    }

    /**
     * Restore scanner to a previously saved position.
     */
    restoreCheckpoint(pos: number): void {
        this.pos = pos
    }

    /**
     * Check if we're at a statement boundary (end of statement).
     * Accounts for automatic semicolon insertion based on line breaks.
     */
    isStatementEnd(): boolean {
        if (this.check(";") || this.check("}") || this.check("]")) return true
        if (this.pos > 0 && this.tokens[this.pos - 1].line < this.current().line) {
            return ![".", "[", "(", ",", "+", "-", "*", "/", "&&", "||", "=>", "|"].includes(this.current().value)
        }
        return false
    }

    /**
     * Create a detailed error message with line and column information.
     */
    error(msg: string): Error {
        const t = this.current()
        return new Error(`${msg} at ${t.line}:${t.column}`)
    }
}
