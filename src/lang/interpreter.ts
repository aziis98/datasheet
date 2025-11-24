import type {
    Assignment,
    ASTNode,
    BinaryOp,
    Block,
    FieldAccess,
    Identifier,
    Literal,
    MatchExpression,
    MethodCall,
    UnaryOp,
} from "./types"

export type Value =
    | number
    | string
    | boolean
    | null
    | undefined
    | { [key: string]: Value }
    | Value[]
    | ((args: Value[]) => Value)

export class Environment {
    private variables: Map<string, Value> = new Map()
    private parent: Environment | null = null

    constructor(parent: Environment | null = null) {
        this.parent = parent
    }

    define(name: string, value: Value): void {
        this.variables.set(name, value)
    }

    get(name: string): Value {
        if (this.variables.has(name)) {
            return this.variables.get(name)!
        }
        if (this.parent) {
            return this.parent.get(name)
        }
        throw new Error(`Undefined variable: ${name}`)
    }

    set(name: string, value: Value): void {
        if (this.variables.has(name)) {
            this.variables.set(name, value)
        } else if (this.parent) {
            this.parent.set(name, value)
        } else {
            this.variables.set(name, value)
        }
    }
}

export class Interpreter {
    private globalEnv: Environment

    constructor() {
        this.globalEnv = new Environment()
        this.initializeBuiltins()
    }

    private initializeBuiltins(): void {
        // Add built-in functions
        this.globalEnv.define("print", (args: Value[]) => {
            console.log(...args.map(v => this.valueToString(v)))
            return undefined
        })

        this.globalEnv.define("add", (args: Value[]) => {
            if (args.length !== 2) throw new Error("add expects 2 arguments")
            return Number(args[0]) + Number(args[1])
        })

        this.globalEnv.define("sub", (args: Value[]) => {
            if (args.length !== 2) throw new Error("sub expects 2 arguments")
            return Number(args[0]) - Number(args[1])
        })

        this.globalEnv.define("mul", (args: Value[]) => {
            if (args.length !== 2) throw new Error("mul expects 2 arguments")
            return Number(args[0]) * Number(args[1])
        })

        this.globalEnv.define("div", (args: Value[]) => {
            if (args.length !== 2) throw new Error("div expects 2 arguments")
            const divisor = Number(args[1])
            if (divisor === 0) throw new Error("Division by zero")
            return Number(args[0]) / divisor
        })

        this.globalEnv.define("len", (args: Value[]) => {
            if (args.length !== 1) throw new Error("len expects 1 argument")
            const val = args[0]
            if (typeof val === "string") return val.length
            if (Array.isArray(val)) return val.length
            if (typeof val === "object" && val !== null) return Object.keys(val).length
            throw new Error("len: invalid argument type")
        })

        this.globalEnv.define("type", (args: Value[]) => {
            if (args.length !== 1) throw new Error("type expects 1 argument")
            const val = args[0]
            if (val === null) return "null"
            if (Array.isArray(val)) return "array"
            if (typeof val === "function") return "function"
            return typeof val
        })
    }

    interpret(nodes: ASTNode[]): Value {
        let result: Value = undefined

        for (const node of nodes) {
            result = this.evaluate(node, this.globalEnv)
        }

        return result
    }

    private evaluate(node: ASTNode, env: Environment): Value {
        switch (node.type) {
            case "literal":
                return this.evaluateLiteral(node as Literal)

            case "identifier":
                return env.get((node as Identifier).name)

            case "binaryOp":
                return this.evaluateBinaryOp(node as BinaryOp, env)

            case "unaryOp":
                return this.evaluateUnaryOp(node as UnaryOp, env)

            case "assignment":
                return this.evaluateAssignment(node as Assignment, env)

            case "fieldAccess":
                return this.evaluateFieldAccess(node as FieldAccess, env)

            case "methodCall":
                return this.evaluateMethodCall(node as MethodCall, env)

            case "block":
                return this.evaluateBlock(node as Block, env)

            case "matchExpression":
                return this.evaluateMatch(node as MatchExpression, env)

            case "typeInstance":
                return this.evaluateTypeInstance(node as any, env)

            case "functionDeclaration":
                return this.evaluateFunctionDeclaration(node, env)

            case "typeDeclaration":
                return this.evaluateTypeDeclaration(node as any, env)

            default:
                throw new Error(`Unknown node type: ${(node as any).type}`)
        }
    }

    private evaluateLiteral(node: Literal): Value {
        return node.value
    }

    private evaluateBinaryOp(node: BinaryOp, env: Environment): Value {
        const left = this.evaluate(node.left, env)
        const right = this.evaluate(node.right, env)

        switch (node.operator) {
            case "+":
                if (typeof left === "string" || typeof right === "string") {
                    return this.valueToString(left) + this.valueToString(right)
                }
                return Number(left) + Number(right)

            case "-":
                return Number(left) - Number(right)

            case "*":
                if (typeof left === "string" && typeof right === "number") {
                    return left.repeat(right)
                }
                if (typeof right === "string" && typeof left === "number") {
                    return right.repeat(left)
                }
                return Number(left) * Number(right)

            case "/":
                const divisor = Number(right)
                if (divisor === 0) throw new Error("Division by zero")
                return Number(left) / divisor

            case "%":
                return Number(left) % Number(right)

            case "^":
                return Math.pow(Number(left), Number(right))

            case "==":
                return left === right

            case "!=":
                return left !== right

            case "<":
                return Number(left) < Number(right)

            case ">":
                return Number(left) > Number(right)

            case "<=":
                return Number(left) <= Number(right)

            case ">=":
                return Number(left) >= Number(right)

            case "&&":
                return this.isTruthy(left) && this.isTruthy(right)

            case "||":
                return this.isTruthy(left) || this.isTruthy(right)

            default:
                throw new Error(`Unknown binary operator: ${node.operator}`)
        }
    }

    private evaluateUnaryOp(node: UnaryOp, env: Environment): Value {
        const operand = this.evaluate(node.operand, env)

        switch (node.operator) {
            case "-":
                return -Number(operand)

            case "!":
                return !this.isTruthy(operand)

            default:
                throw new Error(`Unknown unary operator: ${node.operator}`)
        }
    }

    private evaluateAssignment(node: Assignment, env: Environment): Value {
        const value = this.evaluate(node.value, env)

        // If there's a pattern, use pattern matching to bind captures
        if (node.pattern) {
            const captures = this.tryMatch(node.pattern, value, env)
            if (captures === null) {
                throw new Error(`Pattern match failed in assignment`)
            }
            // Bind all captured variables
            for (const [name, capturedValue] of Object.entries(captures)) {
                env.define(name, capturedValue)
            }
        } else {
            // Simple assignment
            env.set(node.variable, value)
        }
        return value
    }

    private evaluateFieldAccess(node: FieldAccess, env: Environment): Value {
        const obj = this.evaluate(node.object, env)

        if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
            return (obj as Record<string, Value>)[node.field]
        }

        if (Array.isArray(obj) && node.field === "length") {
            return obj.length
        }

        if (typeof obj === "string" && node.field === "length") {
            return obj.length
        }

        throw new Error(`Cannot access field ${node.field} on ${typeof obj}`)
    }

    private evaluateMethodCall(node: MethodCall, env: Environment): Value {
        const args = node.arguments.map(arg => this.evaluate(arg, env))

        // Check if this is a global function call (object is "global" identifier)
        if (node.object.type === "identifier" && (node.object as Identifier).name === "global") {
            const func = env.get(node.method)
            if (typeof func === "function") {
                return func(args)
            }
            throw new Error(`${node.method} is not a function`)
        }

        const obj = this.evaluate(node.object, env)

        // Handle string methods
        if (typeof obj === "string") {
            if (node.method === "format") {
                if (args.length !== 1 || typeof args[0] !== "string") {
                    throw new Error("format expects a string argument")
                }
                return this.formatString(args[0], [obj])
            }
        }

        // Handle object method calls
        if (typeof obj === "object" && obj !== null) {
            if (Array.isArray(obj)) {
                return this.evaluateArrayMethod(obj, node.method, args)
            }
            if (typeof (obj as any)[node.method] === "function") {
                return (obj as any)[node.method](...args)
            }
        }

        throw new Error(`Method ${node.method} not found`)
    }

    private evaluateArrayMethod(arr: Value[], method: string, args: Value[]): Value {
        switch (method) {
            case "map":
                if (args.length !== 1 || typeof args[0] !== "function") {
                    throw new Error("map expects a function")
                }
                return arr.map(item => (args[0] as Function)(item))

            case "filter":
                if (args.length !== 1 || typeof args[0] !== "function") {
                    throw new Error("filter expects a function")
                }
                return arr.filter(item => this.isTruthy((args[0] as Function)(item)))

            case "reduce":
                if (args.length < 1 || typeof args[0] !== "function") {
                    throw new Error("reduce expects a function")
                }
                let acc = args.length > 1 ? args[1] : arr[0]
                const startIdx = args.length > 1 ? 0 : 1
                for (let i = startIdx; i < arr.length; i++) {
                    acc = (args[0] as Function)(acc, arr[i])
                }
                return acc

            case "join":
                return arr.map(v => this.valueToString(v)).join(this.valueToString(args[0] ?? ""))

            case "push":
                arr.push(...args)
                return arr.length

            case "pop":
                return arr.pop()

            case "format":
                if (args.length !== 1 || typeof args[0] !== "string") {
                    throw new Error("format expects a string argument")
                }
                return this.formatString(args[0], arr)

            default:
                throw new Error(`Array method ${method} not found`)
        }
    }

    private evaluateBlock(node: Block, env: Environment): Value {
        // If the block has parameters, return a closure function
        if (node.parameters && node.parameters.length > 0) {
            // Return a function that can be called with individual arguments or an array
            const closure = (...args: any[]) => {
                const blockEnv = new Environment(env)

                // Handle both single call style and array call style
                const actualArgs = Array.isArray(args[0]) ? args[0] : args

                // Bind parameters to arguments
                for (let i = 0; i < node.parameters!.length; i++) {
                    blockEnv.define(node.parameters![i], actualArgs[i])
                }

                // Execute block body
                let result: Value = undefined
                for (const stmt of node.body) {
                    result = this.evaluate(stmt, blockEnv)
                }
                return result
            }
            return closure
        }

        // For blocks without parameters, just execute the statements
        const blockEnv = new Environment(env)
        let result: Value = undefined

        for (const stmt of node.body) {
            result = this.evaluate(stmt, blockEnv)
        }

        return result
    }

    private evaluateMatch(node: MatchExpression, env: Environment): Value {
        const value = this.evaluate(node.value, env)

        for (const arm of node.arms) {
            const patternType = (arm.pattern as any).type

            // Check if pattern is a capture pattern (?name) - matches anything and binds
            if (patternType === "capturePattern") {
                const name = (arm.pattern as any).name
                const bodyEnv = new Environment(env)
                bodyEnv.define(name, value)
                return this.evaluate(arm.body, bodyEnv)
            }

            // Check if pattern is a simple identifier (e.g., matching ADT variant name or wildcard)
            if (patternType === "identifier") {
                const variantName = (arm.pattern as any).name

                // Wildcard pattern "?" matches anything
                if (variantName === "?") {
                    return this.evaluate(arm.body, env)
                }

                // Check if value is an ADT instance with matching variant
                if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                    const obj = value as Record<string, Value>
                    if (obj.__variant === variantName) {
                        return this.evaluate(arm.body, env)
                    }
                }
            } else if (patternType === "typeInstance") {
                // Pattern matching with potential captures: Ok [ ?value ]
                const captures = this.tryMatch(arm.pattern, value, env)
                if (captures !== null) {
                    const bodyEnv = new Environment(env)
                    for (const [name, capturedValue] of Object.entries(captures)) {
                        bodyEnv.define(name, capturedValue as Value)
                    }
                    return this.evaluate(arm.body, bodyEnv)
                }
            } else {
                // Evaluate pattern and try to match
                const pattern = this.evaluate(arm.pattern, env)
                if (this.matchesPattern(value, pattern)) {
                    return this.evaluate(arm.body, env)
                }
            }
        }

        throw new Error("No matching pattern found")
    }
    private matchesPattern(value: Value, pattern: Value): boolean {
        if (typeof pattern === "number") {
            return value === pattern
        }
        if (typeof pattern === "string") {
            return value === pattern
        }
        if (typeof pattern === "boolean") {
            return value === pattern
        }
        return value === pattern
    }

    /**
     * Try to match a pattern against a value and extract bindings.
     * Returns a map of variable names to their captured values, or null if no match.
     *
     * Pattern format:
     * - Identifier: variantName
     * - Capture pattern: { type: "capturePattern", name: "varName" }
     * - Structure: { type: "typeInstance", typeName: "VariantName", fields: [...] }
     */
    private tryMatch(patternNode: ASTNode, value: Value, env: Environment): Record<string, Value> | null {
        const pattern = patternNode as any

        // Simple identifier pattern - must match variant name
        if (pattern.type === "identifier") {
            const variantName = pattern.name
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                const obj = value as Record<string, Value>
                if (obj.__variant === variantName) {
                    return {} // Matched, no captures
                }
            }
            return null
        }

        // Capture pattern - matches anything and binds to a variable
        if (pattern.type === "capturePattern") {
            return { [pattern.name]: value }
        }

        // Structure pattern with potential field captures: VariantName [ ?field1, ?field2: [...] ]
        if (pattern.type === "typeInstance") {
            const variantName = pattern.typeName

            // Check if value is an ADT instance with matching variant
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                return null
            }

            const obj = value as Record<string, Value>
            if (obj.__variant !== variantName) {
                return null // Variant doesn't match
            }

            // Matched the variant, now process field patterns
            const captures: Record<string, Value> = {}

            for (const field of pattern.fields) {
                const fieldName = field.key
                const fieldPattern = field.value as any

                // Get the value from the object
                const fieldValue = obj[fieldName]

                // Handle capture patterns
                if (fieldPattern.type === "capturePattern") {
                    // ?fieldName - bind the field value to this name
                    captures[fieldPattern.name] = fieldValue

                    // Check if there's a nested pattern to match
                    if (fieldPattern.pattern) {
                        const nestedCaptures = this.tryMatch(fieldPattern.pattern, fieldValue, env)
                        if (nestedCaptures === null) {
                            return null // Nested pattern didn't match
                        }
                        // Merge nested captures
                        Object.assign(captures, nestedCaptures)
                    }
                } else if (fieldPattern.type === "typeInstance") {
                    // Nested structure pattern
                    const nestedCaptures = this.tryMatch(fieldPattern, fieldValue, env)
                    if (nestedCaptures === null) {
                        return null
                    }
                    Object.assign(captures, nestedCaptures)
                } else {
                    // Literal pattern - must match exactly
                    const literalValue = this.evaluate(fieldPattern, env)
                    if (!this.matchesPattern(fieldValue, literalValue)) {
                        return null
                    }
                }
            }

            return captures
        }

        // Unknown pattern type
        return null
    }

    private formatString(formatStr: string, values: Value[]): string {
        let result = formatStr

        // Replace {} with values in order
        let valueIndex = 0
        result = result.replace(/{}/g, () => {
            if (valueIndex < values.length) {
                return this.valueToString(values[valueIndex++])
            }
            return "{}"
        })

        // Replace {0}, {1}, etc. with indexed values (0-based indexing)
        result = result.replace(/{(\d+)}/g, (_, indexStr) => {
            const index = parseInt(indexStr, 10)
            if (index >= 0 && index < values.length) {
                return this.valueToString(values[index])
            }
            return `{${indexStr}}`
        })

        return result
    }

    private evaluateFunctionDeclaration(node: any, env: Environment): Value {
        const params = node.parameters.map((p: any) => p.name)
        const body = node.body

        const func = (args: Value[]) => {
            const funcEnv = new Environment(env)

            for (let i = 0; i < params.length; i++) {
                funcEnv.define(params[i], args[i])
            }

            return this.evaluate(body, funcEnv)
        }

        if (node.name) {
            env.define(node.name, func)
        }

        return func
    }

    private evaluateTypeDeclaration(node: any, env: Environment): Value {
        const typeName = node.name

        // If this is an ADT (has variants), register variant constructors
        if (node.variants && node.variants.length > 0) {
            for (const variant of node.variants) {
                const variantName = variant.name
                const variantFields = variant.fields

                // Create constructor function for this variant
                const variantConstructor = (args: Value[]) => {
                    const instance: Record<string, Value> = {
                        __adt: typeName,
                        __variant: variantName,
                    }

                    // Bind provided field values
                    for (let i = 0; i < variantFields.length; i++) {
                        const fieldName = variantFields[i].name
                        instance[fieldName] = args[i] !== undefined ? args[i] : null
                    }

                    return instance
                }

                env.define(variantName, variantConstructor)
            }
        }

        // Return undefined as type declarations don't produce values
        return undefined
    }

    private evaluateTypeInstance(node: any, env: Environment): Value {
        if (node.typeName === "Array") {
            // Handle array construction
            return node.fields.map((field: any) => this.evaluate(field.value, env))
        }

        // Check if this is a constructor function (e.g., a registered ADT variant)
        try {
            const constructor = env.get(node.typeName)
            if (typeof constructor === "function") {
                // This is a constructor - call it with field values as arguments
                const args = node.fields.map((field: any) => this.evaluate(field.value, env))
                return constructor(args)
            }
        } catch (e) {
            // Not a constructor, fall through to object construction
        }

        // Handle object construction
        const obj: Record<string, Value> = {}
        for (const field of node.fields) {
            obj[field.key] = this.evaluate(field.value, env)
        }
        return obj
    }

    private isTruthy(value: Value): boolean {
        if (value === null || value === undefined || value === false) {
            return false
        }
        if (value === 0 || value === "") {
            return false
        }
        return true
    }

    private valueToString(value: Value): string {
        if (value === null) return "null"
        if (value === undefined) return "undefined"
        if (typeof value === "string") return value
        if (typeof value === "boolean") return value ? "true" : "false"
        if (typeof value === "function") return "[Function]"
        if (Array.isArray(value)) {
            return `[${value.map(v => this.valueToString(v)).join(", ")}]`
        }
        if (typeof value === "object") {
            const obj = value as Record<string, Value>
            // Check if this is an ADT instance
            if (obj.__adt && obj.__variant) {
                const fields = Object.entries(obj)
                    .filter(([k]) => k !== "__adt" && k !== "__variant")
                    .map(([k, v]) => `${k}: ${this.valueToString(v)}`)
                    .join(", ")
                const variantStr = String(obj.__variant)
                return fields ? `${variantStr} { ${fields} }` : variantStr
            }
            // Regular object
            const entries = Object.entries(obj)
                .map(([k, v]) => `${k}: ${this.valueToString(v)}`)
                .join(", ")
            return `{${entries}}`
        }
        return String(value)
    }
}
