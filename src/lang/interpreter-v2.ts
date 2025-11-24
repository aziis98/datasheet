/**
 * INTERPRETER V2 - Multi-Dispatch Based Interpreter
 *
 * This interpreter uses the multi-dispatch system for all operators and built-in functions.
 * All values are wrapped in RuntimeValue with type metadata.
 */

import {
    ArrayT,
    BooleanT,
    BUILTIN_FUNCTIONS,
    BUILTIN_METHODS,
    BUILTIN_OPERATORS,
    BUILTIN_TYPES,
    IntT,
    NumberT,
    StringT,
} from "./builtins"
import { BaseType } from "./type-system"
import type { ASTNode, RuntimeValue } from "./types"

/**
 * Environment for storing variable bindings
 */
export class Environment {
    private variables: Map<string, RuntimeValue> = new Map()
    private parent: Environment | null = null

    constructor(parent: Environment | null = null) {
        this.parent = parent
    }

    define(name: string, value: RuntimeValue): void {
        this.variables.set(name, value)
    }

    get(name: string): RuntimeValue {
        if (this.variables.has(name)) {
            return this.variables.get(name)!
        }
        if (this.parent) {
            return this.parent.get(name)
        }
        throw new Error(`Undefined variable: ${name}`)
    }

    set(name: string, value: RuntimeValue): void {
        if (this.variables.has(name)) {
            this.variables.set(name, value)
        } else if (this.parent) {
            this.parent.set(name, value)
        } else {
            this.variables.set(name, value)
        }
    }
}

/**
 * Interpreter V2 with multi-dispatch support
 */
export class InterpreterV2 {
    private globalEnv: Environment

    constructor() {
        this.globalEnv = new Environment()
        this.initializeBuiltins()
    }

    private initializeBuiltins(): void {
        // Register built-in functions
        for (const [name, fn] of BUILTIN_FUNCTIONS.entries()) {
            this.globalEnv.define(name, {
                value: fn,
                __type__: BUILTIN_TYPES.get("Any")!,
            })
        }
    }

    interpret(nodes: ASTNode[]): any {
        let result: RuntimeValue = wrapValue(undefined, BUILTIN_TYPES.get("Undefined")!)

        for (const node of nodes) {
            result = this.evaluate(node, this.globalEnv)
        }

        return unwrapValue(result)
    }

    private evaluate(node: ASTNode, env: Environment): RuntimeValue {
        switch (node.type) {
            case "literal":
                return this.evaluateLiteral(node as any, env)

            case "identifier":
                return this.evaluateIdentifier(node as any, env)

            case "binaryOp":
                return this.evaluateBinaryOp(node as any, env)

            case "unaryOp":
                return this.evaluateUnaryOp(node as any, env)

            case "assignment":
                return this.evaluateAssignment(node as any, env)

            case "fieldAccess":
                return this.evaluateFieldAccess(node as any, env)

            case "methodCall":
                return this.evaluateMethodCall(node as any, env)

            case "block":
                return this.evaluateBlock(node as any, env)

            case "matchExpression":
                return this.evaluateMatch(node as any, env)

            case "typeInstance":
                return this.evaluateTypeInstance(node as any, env)

            case "functionDeclaration":
                return this.evaluateFunctionDeclaration(node as any, env)

            case "typeDeclaration":
                return this.evaluateTypeDeclaration(node as any, env)

            default:
                throw new Error(`Unknown node type: ${(node as any).type}`)
        }
    }

    private evaluateLiteral(node: any, _env: Environment): RuntimeValue {
        const valueType = node.valueType
        const value = node.value

        if (valueType === "number") {
            return wrapValue(value, NumberT)
        } else if (valueType === "string") {
            return wrapValue(value, StringT)
        } else if (valueType === "boolean") {
            return wrapValue(value, BooleanT)
        }

        return wrapValue(value, BUILTIN_TYPES.get("Any")!)
    }

    private evaluateIdentifier(node: any, env: Environment): RuntimeValue {
        return env.get(node.name)
    }

    private evaluateBinaryOp(node: any, env: Environment): RuntimeValue {
        const left = this.evaluate(node.left, env)
        const right = this.evaluate(node.right, env)
        const operator = node.operator

        const opFunc = BUILTIN_OPERATORS.get(operator)
        if (!opFunc) {
            throw new Error(`Unknown operator: ${operator}`)
        }

        return opFunc.call(left, right) as RuntimeValue
    }

    private evaluateUnaryOp(node: any, env: Environment): RuntimeValue {
        const operand = this.evaluate(node.operand, env)
        const operator = node.operator

        const opKey = operator === "-" ? "unary-" : operator
        const opFunc = BUILTIN_OPERATORS.get(opKey)
        if (!opFunc) {
            throw new Error(`Unknown unary operator: ${operator}`)
        }

        return opFunc.call(operand) as RuntimeValue
    }

    private evaluateAssignment(node: any, env: Environment): RuntimeValue {
        const value = this.evaluate(node.value, env)

        if (node.pattern) {
            const captures = this.tryMatch(node.pattern, value, env)
            if (captures === null) {
                throw new Error(`Pattern match failed for assignment`)
            }
            for (const [name, capturedValue] of Object.entries(captures)) {
                env.set(name, capturedValue)
            }
        } else {
            env.set(node.variable, value)
        }

        return value
    }

    private evaluateFieldAccess(node: any, env: Environment): RuntimeValue {
        const obj = this.evaluate(node.object, env)
        const fieldName = node.field

        if (typeof obj.value === "object" && obj.value !== null && !Array.isArray(obj.value)) {
            const fieldValue = obj.value[fieldName]
            if (fieldValue !== undefined) {
                if (isRuntimeValue(fieldValue)) {
                    return fieldValue
                }
                return wrapValue(fieldValue, BUILTIN_TYPES.get("Any")!)
            }
        }

        if (Array.isArray(obj.value) && fieldName === "length") {
            return wrapValue(obj.value.length, IntT)
        }

        if (typeof obj.value === "string" && fieldName === "length") {
            return wrapValue(obj.value.length, IntT)
        }

        throw new Error(`Cannot access field ${fieldName} on ${obj.__type__.toString()}`)
    }

    private evaluateMethodCall(node: any, env: Environment): RuntimeValue {
        const args = node.arguments.map((arg: ASTNode) => this.evaluate(arg, env))

        // Check if this is a global function call
        if (node.object.type === "identifier" && node.object.name === "global") {
            const funcName = node.method
            const func = env.get(funcName)

            if (func.value && typeof func.value.call === "function") {
                // It's a GenericFunction
                const argsArray = wrapValue(args, ArrayT(BUILTIN_TYPES.get("Any")!))
                return func.value.call(argsArray) as RuntimeValue
            }

            if (typeof func.value === "function") {
                // Regular function - could be ADT constructor or user-defined
                const result = func.value(args)

                // If result is already a RuntimeValue, return it
                if (isRuntimeValue(result)) {
                    return result
                }

                // Otherwise wrap it
                return wrapValue(result, BUILTIN_TYPES.get("Any")!)
            }

            throw new Error(`${funcName} is not a function`)
        }

        const obj = this.evaluate(node.object, env)
        const methodName = node.method

        // Check for built-in methods
        const method = BUILTIN_METHODS.get(methodName)
        if (method) {
            return method.call(obj, ...args) as RuntimeValue
        }

        // Handle string format method
        if (obj.__type__ === StringT && methodName === "format") {
            const stringFormatMethod = BUILTIN_METHODS.get("string_format")
            if (stringFormatMethod) {
                const argsArray = wrapValue(args.map(unwrapValue), ArrayT(BUILTIN_TYPES.get("Any")!))
                return stringFormatMethod.call(obj, argsArray) as RuntimeValue
            }
        }

        // Handle array methods
        if (Array.isArray(obj.value)) {
            if (methodName === "format") {
                const arrayFormatMethod = BUILTIN_METHODS.get("format")
                if (arrayFormatMethod && args.length > 0) {
                    return arrayFormatMethod.call(obj, args[0]) as RuntimeValue
                }
            }
        }

        throw new Error(`Method ${methodName} not found on ${obj.__type__.toString()}`)
    }

    private evaluateBlock(node: any, env: Environment): RuntimeValue {
        // If block has parameters, return a closure function
        if (node.parameters && node.parameters.length > 0) {
            const closure = (...fnArgs: any[]) => {
                const blockEnv = new Environment(env)

                // Handle both array and individual arguments
                const actualArgs = fnArgs.length === 1 && Array.isArray(fnArgs[0]) ? fnArgs[0] : fnArgs

                for (let i = 0; i < node.parameters.length; i++) {
                    const paramName = node.parameters[i]
                    const argValue = actualArgs[i]

                    if (argValue !== undefined) {
                        if (isRuntimeValue(argValue)) {
                            blockEnv.define(paramName, argValue)
                        } else {
                            blockEnv.define(paramName, wrapValue(argValue, BUILTIN_TYPES.get("Any")!))
                        }
                    } else {
                        blockEnv.define(paramName, wrapValue(null, BUILTIN_TYPES.get("Null")!))
                    }
                }

                let result: RuntimeValue = wrapValue(undefined, BUILTIN_TYPES.get("Undefined")!)
                for (const stmt of node.body) {
                    result = this.evaluate(stmt, blockEnv)
                }

                return result
            }

            return wrapValue(closure, BUILTIN_TYPES.get("Any")!)
        }

        // Regular block
        const blockEnv = new Environment(env)
        let result: RuntimeValue = wrapValue(undefined, BUILTIN_TYPES.get("Undefined")!)

        for (const stmt of node.body) {
            result = this.evaluate(stmt, blockEnv)
        }

        return result
    }

    private evaluateMatch(node: any, env: Environment): RuntimeValue {
        const value = this.evaluate(node.value, env)

        for (const arm of node.arms) {
            const armEnv = new Environment(env)
            const captures = this.tryMatch(arm.pattern, value, armEnv)

            if (captures !== null) {
                for (const [name, capturedValue] of Object.entries(captures)) {
                    armEnv.define(name, capturedValue)
                }
                return this.evaluate(arm.body, armEnv)
            }
        }

        throw new Error("No matching pattern found")
    }

    private tryMatch(patternNode: ASTNode, value: RuntimeValue, env: Environment): Record<string, RuntimeValue> | null {
        const pattern = patternNode as any

        // Simple identifier pattern
        if (pattern.type === "identifier") {
            const val = unwrapValue(value)
            if (typeof val === "object" && val !== null && val.__adt) {
                return val.__variant === pattern.name ? {} : null
            }
            return pattern.name === unwrapValue(value) ? {} : null
        }

        // Capture pattern
        if (pattern.type === "capturePattern") {
            if (pattern.name === "?") {
                return {}
            }
            return { [pattern.name]: value }
        }

        // Type instance pattern
        if (pattern.type === "typeInstance") {
            const val = unwrapValue(value)
            if (typeof val !== "object" || val === null) return null

            if (val.__adt && val.__variant === pattern.typeName) {
                const captures: Record<string, RuntimeValue> = {}
                const fields = pattern.fields

                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i]
                    const fieldValue = val[field.key]

                    if (field.value.type === "capturePattern") {
                        const captureName = field.value.name
                        if (captureName !== "?") {
                            const wrappedFieldValue = isRuntimeValue(fieldValue)
                                ? fieldValue
                                : wrapValue(fieldValue, BUILTIN_TYPES.get("Any")!)
                            captures[captureName] = wrappedFieldValue
                        }

                        if (field.value.pattern) {
                            const wrappedFieldValue = isRuntimeValue(fieldValue)
                                ? fieldValue
                                : wrapValue(fieldValue, BUILTIN_TYPES.get("Any")!)
                            const nestedCaptures = this.tryMatch(field.value.pattern, wrappedFieldValue, env)
                            if (nestedCaptures === null) return null
                            Object.assign(captures, nestedCaptures)
                        }
                    } else {
                        const wrappedFieldValue = isRuntimeValue(fieldValue)
                            ? fieldValue
                            : wrapValue(fieldValue, BUILTIN_TYPES.get("Any")!)
                        const fieldCaptures = this.tryMatch(field.value, wrappedFieldValue, env)
                        if (fieldCaptures === null) return null
                        Object.assign(captures, fieldCaptures)
                    }
                }

                return captures
            }

            return null
        }

        // Literal pattern
        if (pattern.type === "literal") {
            return pattern.value === unwrapValue(value) ? {} : null
        }

        return null
    }

    private evaluateTypeInstance(node: any, env: Environment): RuntimeValue {
        if (node.typeName === "Array") {
            const elements = node.fields.map((field: any) => this.evaluate(field.value, env))
            return wrapValue(elements, ArrayT(BUILTIN_TYPES.get("Any")!))
        }

        // Check if it's an ADT constructor
        try {
            const constructor = env.get(node.typeName)
            if (constructor.value && typeof constructor.value === "function") {
                // Extract field values in order
                const args = node.fields.map((field: any) => this.evaluate(field.value, env))
                const result = constructor.value(...args)

                // If result is already a RuntimeValue, return it
                if (isRuntimeValue(result)) {
                    return result
                }

                // Otherwise wrap it
                return wrapValue(result, BUILTIN_TYPES.get("Any")!)
            }
        } catch {
            // Not a constructor, fall through
        }

        // Object construction
        const obj: Record<string, any> = {}
        for (const field of node.fields) {
            obj[field.key] = this.evaluate(field.value, env)
        }
        return wrapValue(obj, BUILTIN_TYPES.get("Any")!)
    }

    private evaluateFunctionDeclaration(node: any, env: Environment): RuntimeValue {
        const name = node.name
        const params = node.parameters
        const body = node.body

        const func = (fnArgs: any[]) => {
            const funcEnv = new Environment(env)

            for (let i = 0; i < params.length; i++) {
                const paramName = params[i].name
                const argValue = fnArgs[i]

                if (isRuntimeValue(argValue)) {
                    funcEnv.define(paramName, argValue)
                } else {
                    funcEnv.define(paramName, wrapValue(argValue, BUILTIN_TYPES.get("Any")!))
                }
            }

            return this.evaluate(body, funcEnv)
        }

        const funcValue = wrapValue(func, BUILTIN_TYPES.get("Any")!)
        env.define(name, funcValue)

        return funcValue
    }

    private evaluateTypeDeclaration(node: any, env: Environment): RuntimeValue {
        const typeName = node.name

        // If this is an ADT, register variant constructors
        if (node.variants && node.variants.length > 0) {
            for (const variant of node.variants) {
                const variantName = variant.name
                const variantFields = variant.fields

                // Parameter-less variants are simple values
                if (variantFields.length === 0) {
                    const instance = {
                        __adt: typeName,
                        __variant: variantName,
                    }
                    env.define(variantName, wrapValue(instance, BUILTIN_TYPES.get("Any")!))
                } else {
                    // Variants with parameters are constructors
                    const variantConstructor = (...args: any[]) => {
                        const instance: Record<string, any> = {
                            __adt: typeName,
                            __variant: variantName,
                        }

                        for (let i = 0; i < variantFields.length; i++) {
                            const fieldName = variantFields[i].name
                            const argValue = args[i]

                            // Properly unwrap the argument
                            if (argValue !== undefined) {
                                instance[fieldName] = unwrapValue(argValue)
                            } else {
                                instance[fieldName] = null
                            }
                        }

                        return wrapValue(instance, BUILTIN_TYPES.get("Any")!)
                    }

                    env.define(variantName, wrapValue(variantConstructor, BUILTIN_TYPES.get("Any")!))
                }
            }
        }

        return wrapValue(undefined, BUILTIN_TYPES.get("Undefined")!)
    }
}

// ==================== Helper Functions ====================

export function wrapValue(value: any, type: BaseType): RuntimeValue {
    return { value, __type__: type }
}

export function unwrapValue(rv: RuntimeValue | any): any {
    if (isRuntimeValue(rv)) {
        const val = rv.value

        // Recursively unwrap arrays
        if (Array.isArray(val)) {
            return val.map(unwrapValue)
        }

        // Recursively unwrap objects (but not ADT instances)
        if (typeof val === "object" && val !== null && !val.__adt) {
            const result: any = {}
            for (const [key, value] of Object.entries(val)) {
                if (key !== "__type__") {
                    result[key] = unwrapValue(value)
                }
            }
            return result
        }

        return val
    }
    return rv
}

function isRuntimeValue(val: any): val is RuntimeValue {
    return val !== null && typeof val === "object" && "__type__" in val && "value" in val
}
