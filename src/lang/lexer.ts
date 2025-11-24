import type { Token, TokenType } from "./types"

type TokenTransform = (t: Token) => Token

const KEYWORDS = new Set(["fn", "type", "abstract", "match", "trait", "impl", "true", "false", "for"])

const unescape: TokenTransform = t => {
    const str = t.value
    const content = str.startsWith('"""') ? str.slice(3, -3) : str.slice(1, -1)
    return {
        ...t,
        value: content
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "\r")
            .replace(/\\\\/g, "\\")
            .replace(/\\"/g, '"'),
    }
}

const checkKeyword: TokenTransform = t => (KEYWORDS.has(t.value) ? { ...t, type: "keyword" } : t)

const PATTERNS: { regex: RegExp; type: TokenType; transform?: TokenTransform }[] = [
    { regex: /^"""[\s\S]*?"""/, type: "string", transform: unescape },
    { regex: /^"(?:\\.|[^"\\])*"/, type: "string", transform: unescape },
    { regex: /^`[^`]+`/, type: "identifier" }, // Backtick-quoted operators
    { regex: /^(?::=|=>|<:|==|!=|<=|>=|&&|\|\||[+\-*/%^:=<>!&|#])/, type: "operator" },
    { regex: /^\d+(\.\d+)?/, type: "number" },
    { regex: /^[a-zA-Z_][a-zA-Z0-9_]*/, type: "identifier", transform: checkKeyword },
    { regex: /^[(){}\[\],;.@|?]/, type: "punctuation" },
]

const SKIP_PATTERN = /^(\/\/.*|[\s]+|#[ \t].*)/

export class Lexer {
    private input: string

    constructor(input: string) {
        this.input = input
    }

    tokenize(): Token[] {
        const tokens: Token[] = []
        let [pos, line, col] = [0, 1, 1]

        const advance = (text: string) => {
            const lines = (text.match(/\n/g) || []).length
            line += lines
            col = lines ? text.length - text.lastIndexOf("\n") : col + text.length
            pos += text.length
        }

        while (pos < this.input.length) {
            const currentInput = this.input.substring(pos)

            // 1. Skip Whitespace/Comments
            const skipMatch = currentInput.match(SKIP_PATTERN)
            if (skipMatch) {
                advance(skipMatch[0])
                continue
            }

            // 2. Match Token
            let matched = false
            for (const { regex, type, transform } of PATTERNS) {
                const match = currentInput.match(regex)
                if (match) {
                    const value = match[0]
                    let token: Token = { type, value, line, column: col }

                    if (transform) {
                        token = transform(token)
                    }

                    tokens.push(token)
                    advance(value)
                    matched = true
                    break
                }
            }

            if (!matched) {
                // Skip unknown char
                pos++
                col++
            }
        }

        tokens.push({ type: "eof", value: "", line, column: col })
        return tokens
    }
}
