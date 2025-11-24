/**
 * Immutable Multiple Dispatch Registry
 *
 * Provides a data structure for registering and dispatching methods based on argument signatures.
 * Uses naive sequential checking to find the best matching method for given arguments.
 * All operations return new copies to maintain immutability.
 */

export type Signature = string | number | symbol

export type Method = (...args: any[]) => any

/**
 * Represents a dispatched method with its signature
 */
export interface MethodEntry {
    signature: Signature[]
    method: Method
    priority: number // Lower values = higher priority
}

/**
 * Immutable multiple dispatch registry
 */
export class MultiDispatch {
    private readonly entries: readonly MethodEntry[]

    constructor(entries: MethodEntry[] = []) {
        this.entries = Object.freeze([...entries])
    }

    /**
     * Register a new method with a signature
     * Returns a new MultiDispatch instance with the method added
     */
    register(...args: [...Signature[], Method]): MultiDispatch {
        if (args.length < 2) {
            throw new Error("register requires at least a signature and method")
        }

        const method = args[args.length - 1] as Method
        const signature = args.slice(0, -1) as Signature[]

        const newEntry: MethodEntry = {
            signature,
            method,
            priority: this.entries.length, // Append has lower priority
        }

        return new MultiDispatch([...this.entries, newEntry])
    }

    /**
     * Get a method matching the given signature
     * Uses naive sequential check: iterates through entries to find best match
     * Returns the first method with matching signature length and type pattern
     */
    get(...signature: any[]): Method | undefined {
        // Sort by priority (lower values first)
        const sorted = [...this.entries].sort((a, b) => a.priority - b.priority)

        for (const entry of sorted) {
            if (entry.signature.length !== signature.length) {
                continue
            }

            // Check if all signature components match
            let matches = true
            for (let i = 0; i < entry.signature.length; i++) {
                const pattern = entry.signature[i]
                const arg = signature[i]

                if (!this.matchesPattern(arg, pattern)) {
                    matches = false
                    break
                }
            }

            if (matches) {
                return entry.method
            }
        }

        return undefined
    }

    /**
     * Get all registered methods (snapshot)
     */
    getAllMethods(): readonly MethodEntry[] {
        return this.entries
    }

    /**
     * Create a new MultiDispatch with methods removed matching a signature
     */
    remove(...signature: Signature[]): MultiDispatch {
        const filtered = this.entries.filter(entry => {
            if (entry.signature.length !== signature.length) {
                return true
            }
            return !entry.signature.every((sig, i) => sig === signature[i])
        })

        return new MultiDispatch([...filtered])
    }

    /**
     * Create a new MultiDispatch with all entries replaced
     */
    clear(): MultiDispatch {
        return new MultiDispatch([])
    }

    /**
     * Create a copy of this registry
     */
    clone(): MultiDispatch {
        return new MultiDispatch([...this.entries])
    }

    /**
     * Check if a method with signature exists
     */
    has(...signature: Signature[]): boolean {
        return this.entries.some(entry => {
            if (entry.signature.length !== signature.length) {
                return false
            }
            return entry.signature.every((sig, i) => sig === signature[i])
        })
    }

    /**
     * Check if an argument matches a pattern
     * Patterns can be:
     * - "*" or "any" for any type
     * - "number", "string", "boolean", etc. for type checks
     * - Specific values for exact matches
     */
    private matchesPattern(arg: any, pattern: Signature): boolean {
        // Wildcard patterns
        if (pattern === "*" || pattern === "any") {
            return true
        }

        // Type patterns
        if (typeof pattern === "string") {
            const argType = typeof arg
            if (
                pattern === "number" ||
                pattern === "string" ||
                pattern === "boolean" ||
                pattern === "function" ||
                pattern === "object"
            ) {
                if (pattern === "object") {
                    // Special case: null should not match "object"
                    return argType === "object" && arg !== null
                }
                return argType === pattern
            }

            // Array pattern
            if (pattern === "array") {
                return Array.isArray(arg)
            }

            // Null pattern
            if (pattern === "null") {
                return arg === null
            }

            // Exact value match
            return arg === pattern
        }

        // Exact value match for non-string patterns
        return arg === pattern
    }
}

/**
 * Create a new MultiDispatch registry
 */
export function createMultiDispatch(): MultiDispatch {
    return new MultiDispatch()
}

/**
 * Example usage:
 *
 * const dispatch = createMultiDispatch()
 *   .register("number", "number", (a, b) => a + b)
 *   .register("string", "string", (a, b) => a + b)
 *   .register("*", "number", (a, b) => `${a} repeated ${b} times`)
 *
 * const addNumbers = dispatch.get(5, 10)
 * console.log(addNumbers(5, 10)) // 15
 *
 * const addStrings = dispatch.get("hello", "world")
 * console.log(addStrings("hello", "world")) // "helloworld"
 *
 * const repeat = dispatch.get("abc", 3)
 * console.log(repeat("abc", 3)) // "abc repeated 3 times"
 */
