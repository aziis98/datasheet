/**
 * Generic Function Multiple Dispatch
 *
 * Implements Julia-style multiple dispatch with:
 * - Type-based method resolution
 * - Specificity ordering
 * - Caching for performance
 * - Ambiguity detection
 *
 * Methods are prioritized by specificity: more specific signatures are tried first.
 * A method is more specific if its signature is a subtype of another signature.
 */

import { isSubtype, type BaseType, type TypeVar } from "./type-system"

/**
 * Represents a method with its type signature and implementation
 */
export interface MethodEntry {
    typeVars: TypeVar[]
    signature: BaseType[]
    implementation: Function
}

/**
 * Unification environment for tracking type variable bindings
 */
interface UnificationEnv {
    [key: string]: BaseType
}

export type Method = {
    typeVars: TypeVar[]
    signature: BaseType[]
    fn: Function
}

export let debug: {
    cacheHitCallback: ((name: string, argTypes: BaseType[]) => void) | null
} = {
    cacheHitCallback: null,
}

function isMethodApplicable(method: Method, args: BaseType[]): boolean {
    if (args.length !== method.signature.length) return false

    const env: UnificationEnv = {}

    for (let i = 0; i < args.length; i++) {
        if (!unify(args[i], method.signature[i], env)) {
            return false
        }
    }
    return true
}

function unify(concrete: BaseType, pattern: BaseType, env: UnificationEnv): boolean {
    // A. Pattern is a Type Variable (T)
    if (pattern.kind === "TypeVar") {
        const tv = pattern as TypeVar
        // 1. Check constraint
        if (!isSubtype(concrete, tv.constraint)) return false

        // 2. Check existing binding
        if (tv.name in env) {
            // Enforce strict equality for consistency (T must be exactly T everywhere)
            return env[tv.name].id === concrete.id
        } else {
            // Bind T to the concrete type
            env[tv.name] = concrete
            return true
        }
    }

    // B. Pattern is Parametric (Array[T])
    if (pattern.kind === "Parametric" && concrete.kind === "Parametric") {
        const pPattern = pattern as any
        const pConcrete = concrete as any

        if (pPattern.base !== pConcrete.base) return false
        if (pPattern.typeArgs.length !== pConcrete.typeArgs.length) return false

        // Recursively unify type arguments
        for (let i = 0; i < pPattern.typeArgs.length; i++) {
            if (!unify(pConcrete.typeArgs[i], pPattern.typeArgs[i], env)) {
                return false
            }
        }
        return true
    }

    // C. Structural equality check for same-named types
    if (concrete.name === pattern.name && concrete.kind === pattern.kind) {
        return true
    }

    // D. Standard Subtyping
    return isSubtype(concrete, pattern)
}

/**
 * A method with unification capabilities
 */
// class Method {
//     public readonly typeVars: TypeVar[]
//     public readonly signature: BaseType[]
//     public readonly fn: Function

//     constructor(typeVars: TypeVar[], signature: BaseType[], fn: Function) {
//         this.typeVars = typeVars
//         this.signature = signature
//         this.fn = fn
//     }

//     /**
//      * Checks if runtime arguments match this method's signature.
//      * Handles generic unification (e.g., T must be consistent across all uses).
//      */
//     isApplicable(args: BaseType[]): boolean {
//         if (args.length !== this.signature.length) return false

//         const env: UnificationEnv = {}

//         for (let i = 0; i < args.length; i++) {
//             if (!this.unify(args[i], this.signature[i], env)) {
//                 return false
//             }
//         }
//         return true
//     }

//     /**
//      * Unifies a concrete argument type with a pattern type from the method signature.
//      * Handles type variables, parametric types, and standard subtyping.
//      */
//     private unify(concrete: BaseType, pattern: BaseType, env: UnificationEnv): boolean {
//         // A. Pattern is a Type Variable (T)
//         if (pattern.kind === "TypeVar") {
//             const tv = pattern as TypeVar
//             // 1. Check constraint
//             if (!isSubtype(concrete, tv.constraint)) return false

//             // 2. Check existing binding
//             if (tv.name in env) {
//                 // Enforce strict equality for consistency (T must be exactly T everywhere)
//                 return env[tv.name].id === concrete.id
//             } else {
//                 // Bind T to the concrete type
//                 env[tv.name] = concrete
//                 return true
//             }
//         }

//         // B. Pattern is Parametric (Array<T>)
//         if (pattern.kind === "Parametric" && concrete.kind === "Parametric") {
//             const pPattern = pattern as any
//             const pConcrete = concrete as any

//             if (pPattern.base !== pConcrete.base) return false
//             if (pPattern.typeArgs.length !== pConcrete.typeArgs.length) return false

//             // Recursively unify type arguments
//             for (let i = 0; i < pPattern.typeArgs.length; i++) {
//                 if (!this.unify(pConcrete.typeArgs[i], pPattern.typeArgs[i], env)) {
//                     return false
//                 }
//             }
//             return true
//         }

//         // C. Standard Subtyping
//         return isSubtype(concrete, pattern)
//     }
// }

/**
 * Generic Function dispatcher using multiple dispatch
 * Resolves method calls based on argument types with specificity ordering
 */
export class GenericFunction {
    public readonly name: string
    private readonly methods: readonly Method[]

    private readonly cache: Map<string, Method>

    constructor(name: string, methods: readonly Method[] = []) {
        this.name = name
        this.methods = methods
        this.cache = new Map()
    }

    /**
     * Add a method to this generic function, returning a new GenericFunction
     */
    withMethod(typeVars: TypeVar[], signature: BaseType[], fn: Function): GenericFunction {
        const newMethods = [...this.methods, { typeVars, signature, fn }]
        return new GenericFunction(this.name, newMethods)
    }

    /**
     * Returns applicable methods for given argument types, sorted by specificity.
     * Most specific methods come first.
     */
    private resolve(argTypes: BaseType[]): readonly Method[] {
        // Filter applicable methods
        const applicable = this.methods.filter(m => isMethodApplicable(m, argTypes))

        // Sort by specificity (most specific first)
        applicable.sort((m1, m2) => this.compareSpecificity(m1, m2))

        return applicable
    }

    /**
     * Call the generic function with runtime arguments.
     * Dispatches to the most specific matching method.
     *
     * @throws MethodError if no method matches
     * @throws MethodAmbiguity if multiple equally specific methods match
     */
    call(...args: any[]): any {
        // 1. Extract runtime types from argument metadata
        const argTypes = args.map(a => a.__type__)
        if (argTypes.some(t => !t)) {
            throw new Error(`Arguments missing __type__ property for ${this.name}`)
        }

        // 2. Check cache
        const cacheKey = argTypes.map(t => t.id).join(",")
        if (this.cache.has(cacheKey)) {
            debug.cacheHitCallback?.(this.name, argTypes)

            return this.cache.get(cacheKey)!.fn(...args)
        }

        // 3. Resolve applicable methods
        const applicable = this.resolve(argTypes)

        if (applicable.length === 0) {
            throw new Error(
                `MethodError: no method matching ${this.name}(${argTypes.map(t => t.toString()).join(", ")})`
            )
        }

        const winner = applicable[0]

        // 4. Ambiguity check
        if (applicable.length > 1) {
            const runnerUp = applicable[1]
            const winnerMoreSpecific = this.isMoreSpecific(winner, runnerUp)
            const runnerMoreSpecific = this.isMoreSpecific(runnerUp, winner)

            if (!winnerMoreSpecific && !runnerMoreSpecific) {
                throw new Error(
                    `MethodAmbiguity: ${this.name}(${argTypes
                        .map(t => t.toString())
                        .join(", ")}) matches multiple methods equally`
                )
            }
        }

        // 5. Update cache with new entry and execute
        const newCache = new Map(this.cache)
        newCache.set(cacheKey, winner)

        // Note: In a truly immutable design, cache updates would return a new instance,
        // but for performance reasons during execution, we update the cache directly
        // This is safe since cache is an implementation detail
        this.cache.set(cacheKey, winner)

        return winner.fn(...args)
    }

    /**
     * Compare specificity of two methods for given argument types.
     * Returns negative if m1 is more specific, positive if m2.
     */
    private compareSpecificity(m1: Method, m2: Method): number {
        const m1Spec = this.isMoreSpecific(m1, m2)
        const m2Spec = this.isMoreSpecific(m2, m1)

        if (m1Spec && !m2Spec) return -1 // m1 wins (more specific)
        if (m2Spec && !m1Spec) return 1 // m2 wins (more specific)
        return 0 // Tie (ambiguous)
    }

    /**
     * Check if method m1 is more specific than m2.
     * m1 is more specific if its signature is a subtype of m2's signature.
     * i.e., m1 accepts a narrower set of types.
     */
    private isMoreSpecific(m1: Method, m2: Method): boolean {
        for (let i = 0; i < m1.signature.length; i++) {
            const t1 = m1.signature[i]
            const t2 = m2.signature[i]

            // If t1 is not a subtype of t2, m1 cannot be more specific
            if (!isSubtype(t1, t2)) {
                return false
            }
        }
        return true
    }

    /**
     * Get all registered methods
     */
    getAllMethods(): readonly MethodEntry[] {
        return this.methods.map(m => ({
            typeVars: m.typeVars,
            signature: m.signature,
            implementation: m.fn,
        }))
    }
}
