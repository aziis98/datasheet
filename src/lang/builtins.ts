/**
 * BUILT-IN FUNCTIONS AND OPERATORS
 *
 * Defines all built-in types, operators, and functions using multi-dispatch.
 * All operators and functions are implemented as GenericFunction instances
 * with proper type signatures.
 */

import { GenericFunction } from "./multi-dispatch"
import { ANY, AbstractType, BaseType, ConcreteType, ParametricType, TypeVar } from "./type-system"
import type { RuntimeValue } from "./types"

// ==================== Type Hierarchy ====================

export const NumberT = new AbstractType("Number", ANY)
export const IntT = new ConcreteType("Int", NumberT)
export const FloatT = new ConcreteType("Float", NumberT)
export const StringT = new ConcreteType("String", ANY)
export const BooleanT = new ConcreteType("Boolean", ANY)
export const NullT = new ConcreteType("Null", ANY)
export const UndefinedT = new ConcreteType("Undefined", ANY)

/**
 * Cache for array types to ensure we reuse the same instance
 */
const ARRAY_TYPE_CACHE = new Map<number, ParametricType>()

/**
 * Create an Array type with specific element type
 */
export function ArrayT(elementType: BaseType): ParametricType {
    // Use element type's id as cache key
    const cacheKey = elementType.id

    if (!ARRAY_TYPE_CACHE.has(cacheKey)) {
        ARRAY_TYPE_CACHE.set(cacheKey, new ParametricType("Array", [elementType], ANY))
    }

    return ARRAY_TYPE_CACHE.get(cacheKey)!
}

/**
 * Registry of all built-in types
 */
export const BUILTIN_TYPES: Map<string, BaseType> = new Map([
    ["Any", ANY],
    ["Number", NumberT],
    ["Int", IntT],
    ["Float", FloatT],
    ["String", StringT],
    ["Boolean", BooleanT],
    ["Null", NullT],
    ["Undefined", UndefinedT],
])

// ==================== Operators ====================

/**
 * Addition operator: +
 * Supports: Int + Int, Float + Float, Number + Number, String + String
 */
export const OP_ADD = new GenericFunction("op_add")
    .withMethod([], [IntT, IntT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value + b.value,
        __type__: IntT,
    }))
    .withMethod([], [FloatT, FloatT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value + b.value,
        __type__: FloatT,
    }))
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value + b.value,
        __type__: NumberT,
    }))
    .withMethod([], [StringT, StringT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value + b.value,
        __type__: StringT,
    }))

/**
 * Subtraction operator: -
 */
export const OP_SUB = new GenericFunction("op_sub")
    .withMethod([], [IntT, IntT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value - b.value,
        __type__: IntT,
    }))
    .withMethod([], [FloatT, FloatT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value - b.value,
        __type__: FloatT,
    }))
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value - b.value,
        __type__: NumberT,
    }))

/**
 * Multiplication operator: *
 * Supports: Number * Number, String * Int (repetition)
 */
export const OP_MUL = new GenericFunction("op_mul")
    .withMethod([], [IntT, IntT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value * b.value,
        __type__: IntT,
    }))
    .withMethod([], [FloatT, FloatT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value * b.value,
        __type__: FloatT,
    }))
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value * b.value,
        __type__: NumberT,
    }))
    .withMethod([], [StringT, IntT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value.repeat(b.value),
        __type__: StringT,
    }))

/**
 * Division operator: /
 */
export const OP_DIV = new GenericFunction("op_div")
    .withMethod([], [IntT, IntT], (a: RuntimeValue, b: RuntimeValue) => {
        if (b.value === 0) throw new Error("Division by zero")
        return {
            value: a.value / b.value,
            __type__: IntT,
        }
    })
    .withMethod([], [FloatT, FloatT], (a: RuntimeValue, b: RuntimeValue) => {
        if (b.value === 0) throw new Error("Division by zero")
        return {
            value: a.value / b.value,
            __type__: FloatT,
        }
    })
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => {
        if (b.value === 0) throw new Error("Division by zero")
        return {
            value: a.value / b.value,
            __type__: NumberT,
        }
    })

/**
 * Modulo operator: %
 */
export const OP_MOD = new GenericFunction("op_mod")
    .withMethod([], [IntT, IntT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value % b.value,
        __type__: IntT,
    }))
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value % b.value,
        __type__: NumberT,
    }))

/**
 * Power operator: ^
 */
export const OP_POW = new GenericFunction("op_pow")
    .withMethod([], [IntT, IntT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: Math.pow(a.value, b.value),
        __type__: IntT,
    }))
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: Math.pow(a.value, b.value),
        __type__: NumberT,
    }))

/**
 * Equality operator: ==
 */
export const OP_EQ = new GenericFunction("op_eq").withMethod(
    [new TypeVar("T", ANY)],
    [new TypeVar("T", ANY), new TypeVar("T", ANY)],
    (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value === b.value,
        __type__: BooleanT,
    })
)

/**
 * Inequality operator: !=
 */
export const OP_NE = new GenericFunction("op_ne").withMethod(
    [new TypeVar("T", ANY)],
    [new TypeVar("T", ANY), new TypeVar("T", ANY)],
    (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value !== b.value,
        __type__: BooleanT,
    })
)

/**
 * Less than operator: <
 */
export const OP_LT = new GenericFunction("op_lt")
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value < b.value,
        __type__: BooleanT,
    }))
    .withMethod([], [StringT, StringT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value < b.value,
        __type__: BooleanT,
    }))

/**
 * Greater than operator: >
 */
export const OP_GT = new GenericFunction("op_gt")
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value > b.value,
        __type__: BooleanT,
    }))
    .withMethod([], [StringT, StringT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value > b.value,
        __type__: BooleanT,
    }))

/**
 * Less than or equal operator: <=
 */
export const OP_LE = new GenericFunction("op_le")
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value <= b.value,
        __type__: BooleanT,
    }))
    .withMethod([], [StringT, StringT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value <= b.value,
        __type__: BooleanT,
    }))

/**
 * Greater than or equal operator: >=
 */
export const OP_GE = new GenericFunction("op_ge")
    .withMethod([], [NumberT, NumberT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value >= b.value,
        __type__: BooleanT,
    }))
    .withMethod([], [StringT, StringT], (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value >= b.value,
        __type__: BooleanT,
    }))

/**
 * Logical AND operator: &&
 */
export const OP_AND = new GenericFunction("op_and").withMethod(
    [],
    [BooleanT, BooleanT],
    (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value && b.value,
        __type__: BooleanT,
    })
)

/**
 * Logical OR operator: ||
 */
export const OP_OR = new GenericFunction("op_or").withMethod(
    [],
    [BooleanT, BooleanT],
    (a: RuntimeValue, b: RuntimeValue) => ({
        value: a.value || b.value,
        __type__: BooleanT,
    })
)

/**
 * Unary negation operator: - (unary)
 */
export const OP_NEG = new GenericFunction("op_neg")
    .withMethod([], [IntT], (a: RuntimeValue) => ({
        value: -a.value,
        __type__: IntT,
    }))
    .withMethod([], [NumberT], (a: RuntimeValue) => ({
        value: -a.value,
        __type__: NumberT,
    }))

/**
 * Logical NOT operator: !
 */
export const OP_NOT = new GenericFunction("op_not").withMethod([], [BooleanT], (a: RuntimeValue) => ({
    value: !a.value,
    __type__: BooleanT,
}))

// ==================== Built-in Functions ====================

/**
 * print(...values) - Print values to console
 */
export const FN_PRINT = new GenericFunction("print").withMethod(
    [new TypeVar("T", ANY)],
    [ArrayT(new TypeVar("T", ANY))],
    (args: RuntimeValue) => {
        console.log(...args.value.map((v: any) => valueToString(v)))
        return { value: undefined, __type__: UndefinedT }
    }
)

/**
 * len(value) - Get length of string or array
 */
const T = new TypeVar("T", ANY)
export const FN_LEN = new GenericFunction("len")
    .withMethod([], [StringT], (s: RuntimeValue) => ({
        value: s.value.length,
        __type__: IntT,
    }))
    .withMethod([T], [ArrayT(T)], (arr: RuntimeValue) => ({
        value: arr.value.length,
        __type__: IntT,
    }))

/**
 * type(value) - Get type name of value
 */
export const FN_TYPE = new GenericFunction("type").withMethod(
    [new TypeVar("T", ANY)],
    [new TypeVar("T", ANY)],
    (val: RuntimeValue) => ({
        value: val.__type__.toString(),
        __type__: StringT,
    })
)

// ==================== Array Methods ====================

/**
 * map(array, fn) - Transform array elements
 */
const T1 = new TypeVar("T1", ANY)
const T2 = new TypeVar("T2", ANY)
export const METHOD_MAP = new GenericFunction("map").withMethod(
    [T1, T2],
    [ArrayT(T1), ANY],
    (arr: RuntimeValue, fn: RuntimeValue) => {
        const mapped = arr.value.map((elem: any) => {
            if (typeof fn.value === "function") {
                return fn.value([elem])
            }
            return elem
        })
        return {
            value: mapped,
            __type__: ArrayT(ANY),
        }
    }
)

/**
 * filter(array, predicate) - Filter array elements
 */
const T3 = new TypeVar("T3", ANY)
export const METHOD_FILTER = new GenericFunction("filter").withMethod(
    [T3],
    [ArrayT(T3), ANY],
    (arr: RuntimeValue, fn: RuntimeValue) => {
        const filtered = arr.value.filter((elem: any) => {
            if (typeof fn.value === "function") {
                const result = fn.value([elem])
                return isTruthy(result)
            }
            return false
        })
        return {
            value: filtered,
            __type__: ArrayT(T3),
        }
    }
)

/**
 * reduce(array, fn, initial) - Reduce array to single value
 */
const T4 = new TypeVar("T4", ANY)
const T5 = new TypeVar("T5", ANY)
export const METHOD_REDUCE = new GenericFunction("reduce").withMethod(
    [T4, T5],
    [ArrayT(T4), ANY, T5],
    (arr: RuntimeValue, fn: RuntimeValue, initial: RuntimeValue) => {
        let accumulator = initial
        for (const elem of arr.value) {
            if (typeof fn.value === "function") {
                accumulator = fn.value([accumulator, elem])
            }
        }
        return accumulator
    }
)

/**
 * join(array, separator) - Join array elements into string
 */
const T6 = new TypeVar("T6", ANY)
export const METHOD_JOIN = new GenericFunction("join").withMethod(
    [T6],
    [ArrayT(T6), StringT],
    (arr: RuntimeValue, sep: RuntimeValue) => ({
        value: arr.value.map((v: any) => valueToString(v)).join(sep.value),
        __type__: StringT,
    })
)

/**
 * push(array, ...elements) - Add elements to array (mutating)
 */
const T7 = new TypeVar("T7", ANY)
export const METHOD_PUSH = new GenericFunction("push").withMethod(
    [T7],
    [ArrayT(T7), ArrayT(T7)],
    (arr: RuntimeValue, elems: RuntimeValue) => {
        arr.value.push(...elems.value)
        return {
            value: undefined,
            __type__: UndefinedT,
        }
    }
)

/**
 * pop(array) - Remove last element from array (mutating)
 */
const T8 = new TypeVar("T8", ANY)
export const METHOD_POP = new GenericFunction("pop").withMethod([T8], [ArrayT(T8)], (arr: RuntimeValue) => {
    const elem = arr.value.pop()
    return elem || { value: undefined, __type__: UndefinedT }
})

/**
 * format(array, template) - Format array values into template
 */
const T9 = new TypeVar("T9", ANY)
export const METHOD_ARRAY_FORMAT = new GenericFunction("array_format").withMethod(
    [T9],
    [ArrayT(T9), StringT],
    (arr: RuntimeValue, template: RuntimeValue) => ({
        value: formatString(template.value, arr.value),
        __type__: StringT,
    })
)

// ==================== String Methods ====================

/**
 * format(string, ...values) - Format string with values
 */
export const METHOD_STRING_FORMAT = new GenericFunction("string_format").withMethod(
    [],
    [StringT, ArrayT(ANY)],
    (str: RuntimeValue, values: RuntimeValue) => ({
        value: formatString(str.value, values.value),
        __type__: StringT,
    })
)

// ==================== Helper Functions ====================

function valueToString(val: any): string {
    if (val === null) return "null"
    if (val === undefined) return "undefined"
    if (val.value === null) return "null"
    if (val.value === undefined) return "undefined"

    // Unwrap runtime value
    const actualValue = val.value !== undefined ? val.value : val

    if (typeof actualValue === "string") return actualValue
    if (typeof actualValue === "boolean") return String(actualValue)
    if (typeof actualValue === "function") return "[Function]"
    if (Array.isArray(actualValue)) {
        return `[${actualValue.map(v => valueToString(v)).join(", ")}]`
    }
    if (typeof actualValue === "object") {
        // Check for ADT instance
        if (actualValue.__adt && actualValue.__variant) {
            const fields = Object.keys(actualValue)
                .filter(k => k !== "__adt" && k !== "__variant" && k !== "__type__")
                .map(k => `${k}: ${valueToString(actualValue[k])}`)
                .join(", ")
            return fields.length > 0 ? `${actualValue.__variant}[${fields}]` : actualValue.__variant
        }
        // Regular object
        const entries = Object.entries(actualValue)
            .filter(([k]) => k !== "__type__")
            .map(([k, v]) => `${k}: ${valueToString(v)}`)
            .join(", ")
        return `{${entries}}`
    }
    return String(actualValue)
}

function isTruthy(val: any): boolean {
    const actualValue = val.value !== undefined ? val.value : val
    if (actualValue === null || actualValue === undefined || actualValue === false) return false
    if (actualValue === 0 || actualValue === "") return false
    return true
}

function formatString(formatStr: string, values: any[]): string {
    let result = formatStr

    // Replace {} with values in order
    let valueIndex = 0
    result = result.replace(/{}/g, () => {
        if (valueIndex >= values.length) return "{}"
        return valueToString(values[valueIndex++])
    })

    // Replace {0}, {1}, etc. with indexed values
    result = result.replace(/{(\d+)}/g, (_, indexStr) => {
        const index = parseInt(indexStr, 10)
        if (index < 0 || index >= values.length) return `{${indexStr}}`
        return valueToString(values[index])
    })

    return result
}

// ==================== Registry ====================

/**
 * Map of operator symbols to GenericFunction
 */
export const BUILTIN_OPERATORS: Map<string, GenericFunction> = new Map([
    ["+", OP_ADD],
    ["-", OP_SUB],
    ["*", OP_MUL],
    ["/", OP_DIV],
    ["%", OP_MOD],
    ["^", OP_POW],
    ["==", OP_EQ],
    ["!=", OP_NE],
    ["<", OP_LT],
    [">", OP_GT],
    ["<=", OP_LE],
    [">=", OP_GE],
    ["&&", OP_AND],
    ["||", OP_OR],
    ["unary-", OP_NEG],
    ["!", OP_NOT],
])

/**
 * Map of function names to GenericFunction
 */
export const BUILTIN_FUNCTIONS: Map<string, GenericFunction> = new Map([
    ["print", FN_PRINT],
    ["len", FN_LEN],
    ["type", FN_TYPE],
])

/**
 * Map of method names to GenericFunction
 */
export const BUILTIN_METHODS: Map<string, GenericFunction> = new Map([
    ["map", METHOD_MAP],
    ["filter", METHOD_FILTER],
    ["reduce", METHOD_REDUCE],
    ["join", METHOD_JOIN],
    ["push", METHOD_PUSH],
    ["pop", METHOD_POP],
    ["format", METHOD_ARRAY_FORMAT],
    ["string_format", METHOD_STRING_FORMAT],
])
