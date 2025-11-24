/**
 * PrecedenceTable encapsulates operator precedence logic.
 * Converts precedence levels into a lookup table for O(1) precedence queries.
 */
export class PrecedenceTable {
    private precedenceMap: Record<string, number> = {}
    private operatorsByLevel: Map<number, string[]> = new Map()

    /**
     * Initialize from precedence levels array.
     * Lower indices = lower precedence.
     *
     * @param precedenceLevels Array of operator groups ordered by precedence
     * Example: [["="], ["||"], ["&&"], ["+", "-"], ["*", "/"]]
     */
    constructor(precedenceLevels: string[][]) {
        this.build(precedenceLevels)
    }

    private build(precedenceLevels: string[][]): void {
        precedenceLevels.forEach((operators, index) => {
            const precedenceValue = (index + 1) * 10
            const operatorsList: string[] = []

            operators.forEach(op => {
                this.precedenceMap[op] = precedenceValue
                operatorsList.push(op)
            })

            this.operatorsByLevel.set(precedenceValue, operatorsList)
        })
    }

    /**
     * Get precedence value for an operator.
     * Returns 0 for unknown operators (lowest precedence).
     */
    getPrecedence(operator: string): number {
        return this.precedenceMap[operator] ?? 0
    }

    /**
     * Check if an operator is defined in the table.
     */
    hasOperator(operator: string): boolean {
        return operator in this.precedenceMap
    }

    /**
     * Get all operators at a specific precedence level.
     */
    getOperatorsAt(precedence: number): string[] {
        return this.operatorsByLevel.get(precedence) ?? []
    }

    /**
     * Get all defined operators.
     */
    getAllOperators(): string[] {
        return Object.keys(this.precedenceMap)
    }

    /**
     * Get the highest precedence value in the table.
     */
    getMaxPrecedence(): number {
        const precedences = Object.values(this.precedenceMap)
        return precedences.length > 0 ? Math.max(...precedences) : 0
    }

    /**
     * Get all precedence levels (sorted).
     */
    getPrecedenceLevels(): number[] {
        return Array.from(this.operatorsByLevel.keys()).sort((a, b) => a - b)
    }
}
