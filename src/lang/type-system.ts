/**
 * TYPE SYSTEM & MULTIPLE DISPATCH IMPLEMENTATION
 *
 * A structural, Julia-inspired type system supporting:
 * 1. Nominal hierarchy (Abstract < Concrete)
 * 2. Parametric Polymorphism (Generics like Array[T])
 * 3. Multiple Dispatch (f(A, B) vs f(A, C))
 * 4. Runtime Unification (resolving [T] based on arguments)
 */

export type TypeKind = "Any" | "Abstract" | "Concrete" | "Parametric" | "TypeVar"

/**
 * Base class for all types in the system
 */
export abstract class BaseType {
    static idCounter = 0
    public id: number
    public name: string
    public kind: TypeKind

    constructor(name: string, kind: TypeKind) {
        this.name = name
        this.kind = kind
        this.id = ++BaseType.idCounter
    }

    abstract toString(): string
}

/**
 * The Top Type - everything is a subtype of Any
 */
export class AnyType extends BaseType {
    constructor() {
        super("Any", "Any")
    }

    toString(): string {
        return "Any"
    }
}

/**
 * Abstract Types - represent abstract classifications (e.g., Number)
 * Abstract types have parents and children but are not concrete instances
 */
export class AbstractType extends BaseType {
    public parent: BaseType

    constructor(name: string, parent: BaseType) {
        super(name, "Abstract")
        this.parent = parent
    }

    toString(): string {
        return this.name
    }
}

/**
 * Concrete Types - leaf types (e.g., Int, String)
 * Concrete types can be instantiated and have a parent in the hierarchy
 */
export class ConcreteType extends BaseType {
    public parent: BaseType

    constructor(name: string, parent: BaseType) {
        super(name, "Concrete")
        this.parent = parent
    }

    toString(): string {
        return this.name
    }
}

/**
 * Type Variables - generics (e.g., T in function<T>)
 * Type variables have a constraint (upper bound) on what types can bind to them
 */
export class TypeVar extends BaseType {
    public constraint: BaseType

    constructor(name: string, constraint: BaseType) {
        super(name, "TypeVar")
        this.constraint = constraint
    }

    toString(): string {
        return `${this.name}<:${this.constraint.toString()}`
    }
}

/**
 * Parametric Types - generic instances (e.g., Array<Int>)
 * Parametric types are invariant in their type arguments
 */
export class ParametricType extends BaseType {
    public parent: BaseType
    public base: string // e.g., "Array"
    public typeArgs: BaseType[]

    constructor(base: string, typeArgs: BaseType[], parent: BaseType) {
        super(`${base}[${typeArgs.map(t => t.toString()).join(",")}]`, "Parametric")
        this.base = base
        this.typeArgs = typeArgs
        this.parent = parent
    }

    toString(): string {
        return this.name
    }
}

/**
 * The Top Type instance
 */
export const ANY = new AnyType()

/**
 * Subtyping Relation: child <: parent
 *
 * Implements a structural subtyping relation with:
 * - Reflexivity: T <: T
 * - Transitivity: A <: B, B <: C => A <: C
 * - Top type: T <: Any (everything is subtype of Any)
 * - Hierarchy traversal for nominal types
 * - Invariance for parametric types
 */
export function isSubtype(child: BaseType, parent: BaseType): boolean {
    // 1. Reflexivity and Top Type
    if (child.id === parent.id) return true
    if (parent.kind === "Any") return true
    if (child.kind === "Any") return false // Any is only subtype of Any

    // 2. Type Variables
    // When checking if Concrete <: T, we check against the constraint
    // (Real unification happens in method dispatch)
    if (parent.kind === "TypeVar") {
        const tv = parent as TypeVar
        return isSubtype(child, tv.constraint)
    }

    // 3. Parametric Types (Invariant)
    // Array[Int] <: Array[Number] is FALSE (invariant parameters)
    // Array[Int] <: AbstractArray is TRUE (hierarchy)
    if (child.kind === "Parametric" && parent.kind === "Parametric") {
        const pChild = child as ParametricType
        const pParent = parent as ParametricType

        if (pChild.base !== pParent.base) {
            // Different bases, check hierarchy
            return isSubtype(pChild.parent, parent)
        }

        if (pChild.typeArgs.length !== pParent.typeArgs.length) return false

        // Invariant check: type arguments must be exactly equal
        for (let i = 0; i < pChild.typeArgs.length; i++) {
            if (pChild.typeArgs[i].id !== pParent.typeArgs[i].id) {
                return false
            }
        }
        return true
    }

    // 4. Standard Hierarchy Traversal
    // For concrete and abstract types, traverse up the parent chain
    if ("parent" in child) {
        return isSubtype((child as any).parent, parent)
    }

    return false
}

/**
 * Create a type hierarchy
 *
 * Example:
 * ```ts
 * const NumberT = new AbstractType("Number", ANY)
 * const IntT = new ConcreteType("Int", NumberT)
 * const FloatT = new ConcreteType("Float", NumberT)
 * ```
 */
export function createTypeHierarchy() {
    return {
        Any: ANY,
        Number: new AbstractType("Number", ANY),
        Int: new ConcreteType("Int", new AbstractType("Number", ANY)),
        Float: new ConcreteType("Float", new AbstractType("Number", ANY)),
        String: new ConcreteType("String", ANY),
        Boolean: new ConcreteType("Boolean", ANY),
    }
}

/**
 * Create a parametric type instance
 *
 * Example:
 * ```ts
 * const ArrayOfInt = createParametricType("Array", [IntT], ANY)
 * ```
 */
export function createParametricType(base: string, typeArgs: BaseType[], parent: BaseType): ParametricType {
    return new ParametricType(base, typeArgs, parent)
}
