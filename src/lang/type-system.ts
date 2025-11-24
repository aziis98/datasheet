/**
 * TYPE SYSTEM & MULTIPLE DISPATCH IMPLEMENTATION
 *
 * A structural, Julia-inspired type system supporting:
 * 1. Nominal hierarchy (Abstract < Concrete)
 * 2. Parametric Polymorphism (Generics like Array[T])
 * 3. Multiple Dispatch (f(A, B) vs f(A, C))
 * 4. Runtime Unification (resolving [T] based on arguments)
 * 5. Algebraic Data Types (ADTs) - Sum types with variants
 * 6. Structural Types (Structs) - Record types with named fields
 * 7. Function Types - First-class function signatures
 */

export type TypeKind = "Any" | "Abstract" | "Concrete" | "Parametric" | "TypeVar" | "ADT" | "Struct" | "Function"

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
 * ADT Types - Algebraic Data Types (Sum types)
 * Represents types like: Option := Some[value: T] | None
 */
export class ADTType extends BaseType {
    public parent: BaseType
    public typeParams: TypeVar[] // Generic type parameters
    public variants: Array<{ name: string; fields: Array<{ name: string; type: BaseType }> }>

    constructor(
        name: string,
        typeParams: TypeVar[],
        variants: Array<{ name: string; fields: Array<{ name: string; type: BaseType }> }>,
        parent: BaseType
    ) {
        super(name, "ADT")
        this.parent = parent
        this.typeParams = typeParams
        this.variants = variants
    }

    toString(): string {
        const params = this.typeParams.length > 0 ? `[${this.typeParams.map(t => t.name).join(",")}]` : ""
        return `${this.name}${params}`
    }

    /**
     * Get a variant by name
     */
    getVariant(name: string) {
        return this.variants.find(v => v.name === name)
    }
}

/**
 * Struct Types - Record types with named fields
 * Represents types like: Person: name: String, age: Int
 */
export class StructType extends BaseType {
    public parent: BaseType
    public fields: Array<{ name: string; type: BaseType }>

    constructor(name: string, fields: Array<{ name: string; type: BaseType }>, parent: BaseType) {
        super(name, "Struct")
        this.parent = parent
        this.fields = fields
    }

    toString(): string {
        const fieldStr = this.fields.map(f => `${f.name}: ${f.type.toString()}`).join(", ")
        return `${this.name}{${fieldStr}}`
    }
}

/**
 * Function Types - Function signatures
 * Represents types like: (Int, Int) -> Int
 */
export class FunctionType extends BaseType {
    public paramTypes: BaseType[]
    public returnType: BaseType

    constructor(paramTypes: BaseType[], returnType: BaseType) {
        const paramStr = paramTypes.map(t => t.toString()).join(", ")
        super(`(${paramStr}) -> ${returnType.toString()}`, "Function")
        this.paramTypes = paramTypes
        this.returnType = returnType
    }

    toString(): string {
        return this.name
    }
}

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

    // 4. ADT Types - Nominal matching only
    // Option[Int] <: Option[Int] (same ADT, same type args)
    if (child.kind === "ADT" && parent.kind === "ADT") {
        const adtChild = child as ADTType
        const adtParent = parent as ADTType

        if (adtChild.id === adtParent.id) return true
        return isSubtype(adtChild.parent, parent)
    }

    // 5. Struct Types - Exact structural matching
    // All fields must match exactly (no width subtyping)
    if (child.kind === "Struct" && parent.kind === "Struct") {
        const structChild = child as StructType
        const structParent = parent as StructType

        if (structChild.fields.length !== structParent.fields.length) return false

        // Check all fields match by name and type
        for (const parentField of structParent.fields) {
            const childField = structChild.fields.find(f => f.name === parentField.name)
            if (!childField) return false
            if (!isSubtype(childField.type, parentField.type)) return false
        }
        return true
    }

    // 6. Function Types - Contravariant in parameters, covariant in return
    // (A -> B) <: (C -> D) if C <: A and B <: D
    if (child.kind === "Function" && parent.kind === "Function") {
        const funcChild = child as FunctionType
        const funcParent = parent as FunctionType

        if (funcChild.paramTypes.length !== funcParent.paramTypes.length) return false

        // Parameters are contravariant
        for (let i = 0; i < funcChild.paramTypes.length; i++) {
            if (!isSubtype(funcParent.paramTypes[i], funcChild.paramTypes[i])) {
                return false
            }
        }

        // Return type is covariant
        return isSubtype(funcChild.returnType, funcParent.returnType)
    }

    // 7. Standard Hierarchy Traversal
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
