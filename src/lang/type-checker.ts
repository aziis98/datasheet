/**
 * TYPE CHECKER - Bidirectional Type Inference
 *
 * Implements a bidirectional type checking system:
 * - infer(node): Infers the type of an expression (bottom-up)
 * - check(node, expected): Checks if an expression has the expected type (top-down)
 *
 * Features:
 * - Type inference for literals, identifiers, operators, functions
 * - ADT variant type checking and construction
 * - Struct field access validation
 * - Pattern matching exhaustiveness (future)
 * - Generic type instantiation from call sites
 * - Error collection with location information
 */

import {
    ADTType,
    ANY,
    AbstractType,
    BaseType,
    ConcreteType,
    FunctionType,
    ParametricType,
    StructType,
    TypeVar,
    isSubtype,
} from "./type-system"
import type { ASTNode } from "./types"

/**
 * Type error with location information
 */
export interface TypeError {
    message: string
    node: ASTNode
    expected?: BaseType
    actual?: BaseType
}

/**
 * Type environment for tracking bindings
 */
export class TypeEnvironment {
    private variables: Map<string, BaseType> = new Map()
    private types: Map<string, BaseType> = new Map()
    private parent: TypeEnvironment | null = null

    constructor(parent: TypeEnvironment | null = null) {
        this.parent = parent
    }

    /**
     * Define a variable with its type
     */
    defineVar(name: string, type: BaseType): void {
        this.variables.set(name, type)
    }

    /**
     * Get variable type
     */
    getVar(name: string): BaseType | null {
        if (this.variables.has(name)) {
            return this.variables.get(name)!
        }
        if (this.parent) {
            return this.parent.getVar(name)
        }
        return null
    }

    /**
     * Define a type in the environment
     */
    defineType(name: string, type: BaseType): void {
        this.types.set(name, type)
    }

    /**
     * Get a type by name
     */
    getType(name: string): BaseType | null {
        if (this.types.has(name)) {
            return this.types.get(name)!
        }
        if (this.parent) {
            return this.parent.getType(name)
        }
        return null
    }

    /**
     * Create a child scope
     */
    createChild(): TypeEnvironment {
        return new TypeEnvironment(this)
    }
}

/**
 * Type Checker
 */
export class TypeChecker {
    private errors: TypeError[] = []
    private env: TypeEnvironment

    constructor(env: TypeEnvironment) {
        this.env = env
    }

    /**
     * Type check a list of AST nodes
     */
    check(nodes: ASTNode[]): { errors: TypeError[]; typedNodes: ASTNode[] } {
        const typedNodes = nodes.map(node => this.inferNode(node))
        return { errors: this.errors, typedNodes }
    }

    /**
     * Add a type error
     */
    private addError(message: string, node: ASTNode, expected?: BaseType, actual?: BaseType): void {
        this.errors.push({ message, node, expected, actual })
    }

    /**
     * Infer the type of a node (bottom-up)
     */
    private inferNode(node: ASTNode): ASTNode {
        let inferredType: BaseType

        switch (node.type) {
            case "literal":
                inferredType = this.inferLiteral(node)
                break

            case "identifier":
                inferredType = this.inferIdentifier(node)
                break

            case "binaryOp":
                inferredType = this.inferBinaryOp(node)
                break

            case "unaryOp":
                inferredType = this.inferUnaryOp(node)
                break

            case "assignment":
                inferredType = this.inferAssignment(node)
                break

            case "fieldAccess":
                inferredType = this.inferFieldAccess(node)
                break

            case "methodCall":
                inferredType = this.inferMethodCall(node)
                break

            case "block":
                inferredType = this.inferBlock(node)
                break

            case "matchExpression":
                inferredType = this.inferMatch(node)
                break

            case "typeInstance":
                inferredType = this.inferTypeInstance(node)
                break

            case "functionDeclaration":
                inferredType = this.inferFunctionDeclaration(node)
                break

            case "typeDeclaration":
                inferredType = this.inferTypeDeclaration(node)
                break

            default:
                this.addError(`Unknown node type: ${(node as any).type}`, node)
                inferredType = ANY
        }

        // Attach inferred type to node
        ;(node as any)._inferredType = inferredType
        return node
    }

    /**
     * Check if a node has the expected type (top-down)
     */
    private checkNode(node: ASTNode, expected: BaseType): ASTNode {
        const typedNode = this.inferNode(node)
        const actual = (typedNode as any)._inferredType as BaseType

        if (!isSubtype(actual, expected)) {
            this.addError(`Type mismatch`, node, expected, actual)
        }

        return typedNode
    }

    // ==================== Type Inference Methods ====================

    private inferLiteral(node: any): BaseType {
        const valueType = node.valueType
        const typeName = valueType === "number" ? "Number" : valueType === "string" ? "String" : "Boolean"

        const type = this.env.getType(typeName)
        if (!type) {
            this.addError(`Unknown type: ${typeName}`, node)
            return ANY
        }
        return type
    }

    private inferIdentifier(node: any): BaseType {
        const name = node.name
        const type = this.env.getVar(name)

        if (!type) {
            this.addError(`Undefined variable: ${name}`, node)
            return ANY
        }
        return type
    }

    private inferBinaryOp(node: any): BaseType {
        // Infer operand types
        const leftNode = this.inferNode(node.left)
        this.inferNode(node.right)

        const leftType = (leftNode as any)._inferredType as BaseType

        // For now, assume operators return the same type as operands
        // This will be replaced by multi-dispatch in runtime
        const op = node.operator

        // Comparison operators return Boolean
        if (["==", "!=", "<", ">", "<=", ">="].includes(op)) {
            const boolType = this.env.getType("Boolean")
            return boolType || ANY
        }

        // Logical operators expect and return Boolean
        if (["&&", "||"].includes(op)) {
            const boolType = this.env.getType("Boolean")
            return boolType || ANY
        }

        // Arithmetic operators - return left operand type
        // (multi-dispatch will handle actual type resolution)
        return leftType
    }

    private inferUnaryOp(node: any): BaseType {
        const operandNode = this.inferNode(node.operand)
        const operandType = (operandNode as any)._inferredType as BaseType

        const op = node.operator

        // Logical not returns Boolean
        if (op === "!") {
            const boolType = this.env.getType("Boolean")
            return boolType || ANY
        }

        // Numeric negation returns same type
        return operandType
    }

    private inferAssignment(node: any): BaseType {
        const valueNode = this.inferNode(node.value)
        const valueType = (valueNode as any)._inferredType as BaseType

        // If there's a pattern, we need to destructure and bind types
        if (node.pattern) {
            this.inferPattern(node.pattern, valueType)
        } else {
            // Simple assignment
            this.env.defineVar(node.variable, valueType)
        }

        return valueType
    }

    private inferPattern(pattern: ASTNode, valueType: BaseType): void {
        if (pattern.type === "capturePattern") {
            const name = (pattern as any).name
            if (name !== "?") {
                this.env.defineVar(name, valueType)
            }

            // Handle nested pattern
            if ((pattern as any).pattern) {
                this.inferPattern((pattern as any).pattern, valueType)
            }
        } else if (pattern.type === "typeInstance") {
            // ADT pattern matching
            const typeName = (pattern as any).typeName
            const adtType = this.env.getType(typeName)

            if (adtType && adtType.kind === "ADT") {
                const adt = adtType as ADTType
                const variant = adt.getVariant(typeName)

                if (variant) {
                    const fields = (pattern as any).fields
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i]
                        const fieldType = variant.fields[i]?.type || ANY

                        if (field.value.type === "capturePattern") {
                            this.inferPattern(field.value, fieldType)
                        }
                    }
                }
            }
        }
    }

    private inferFieldAccess(node: any): BaseType {
        const objNode = this.inferNode(node.object)
        const objType = (objNode as any)._inferredType as BaseType
        const fieldName = node.field

        // Handle struct field access
        if (objType.kind === "Struct") {
            const struct = objType as StructType
            const field = struct.fields.find(f => f.name === fieldName)

            if (!field) {
                this.addError(`Field '${fieldName}' not found on type ${objType.toString()}`, node)
                return ANY
            }
            return field.type
        }

        // Handle array.length, string.length
        if (objType.kind === "Parametric" && (objType as ParametricType).base === "Array" && fieldName === "length") {
            const numberType = this.env.getType("Number")
            return numberType || ANY
        }

        if (objType.name === "String" && fieldName === "length") {
            const numberType = this.env.getType("Number")
            return numberType || ANY
        }

        this.addError(`Cannot access field '${fieldName}' on type ${objType.toString()}`, node)
        return ANY
    }

    private inferMethodCall(node: any): BaseType {
        this.inferNode(node.object)

        // Infer argument types
        node.arguments.map((arg: ASTNode) => this.inferNode(arg))

        // For now, return ANY - actual type resolution happens at runtime via multi-dispatch
        // In a full implementation, we'd look up method signatures
        return ANY
    }

    private inferBlock(node: any): BaseType {
        const blockEnv = this.env.createChild()
        const oldEnv = this.env
        this.env = blockEnv

        // If block has parameters, it's a function
        if (node.parameters && node.parameters.length > 0) {
            // Define parameters in block scope
            const paramTypes: BaseType[] = []
            for (const param of node.parameters) {
                // Parameters in blocks are just names (strings), not parameter nodes
                const paramName = typeof param === "string" ? param : param.name
                const paramType = ANY // No type annotations on block parameters yet
                paramTypes.push(paramType)
                this.env.defineVar(paramName, paramType)
            }

            const bodyType = this.inferBlockBody(node.body)

            this.env = oldEnv
            return new FunctionType(paramTypes, bodyType)
        }

        // Regular block
        const resultType = this.inferBlockBody(node.body)
        this.env = oldEnv
        return resultType
    }

    private inferBlockBody(body: ASTNode[]): BaseType {
        let lastType: BaseType = ANY

        for (const stmt of body) {
            const stmtNode = this.inferNode(stmt)
            lastType = (stmtNode as any)._inferredType as BaseType
        }

        return lastType
    }

    private inferMatch(node: any): BaseType {
        const valueNode = this.inferNode(node.value)
        const valueType = (valueNode as any)._inferredType as BaseType

        // Infer types of all arms
        const armTypes: BaseType[] = []

        for (const arm of node.arms) {
            // Create new scope for pattern bindings
            const armEnv = this.env.createChild()
            const oldEnv = this.env
            this.env = armEnv

            // Bind pattern variables
            this.inferPattern(arm.pattern, valueType)

            // Infer body type
            const bodyNode = this.inferNode(arm.body)
            const bodyType = (bodyNode as any)._inferredType as BaseType
            armTypes.push(bodyType)

            this.env = oldEnv
        }

        // All arms should return compatible types
        // For now, return the first arm's type
        return armTypes[0] || ANY
    }

    private inferTypeInstance(node: any): BaseType {
        const typeName = node.typeName

        // Handle Array construction
        if (typeName === "Array") {
            const fields = node.fields
            if (fields.length === 0) {
                // Empty array - Array[Any]
                return new ParametricType("Array", [ANY], ANY)
            }

            // Infer element type from first element
            const firstElem = this.inferNode(fields[0].value)
            const elemType = (firstElem as any)._inferredType as BaseType

            return new ParametricType("Array", [elemType], ANY)
        }

        // Handle Object construction
        if (typeName === "Object") {
            // For now, treat objects as Any
            // In full implementation, create anonymous struct type
            return ANY
        }

        // Check if it's an ADT variant constructor
        const type = this.env.getType(typeName)
        if (type && type.kind === "ADT") {
            return type
        }

        // Check if it's a struct type
        if (type && type.kind === "Struct") {
            // Validate field types
            const struct = type as StructType
            const providedFields = node.fields as Array<{ key: string; value: ASTNode }>

            for (const field of struct.fields) {
                const provided = providedFields.find(f => f.key === field.name)
                if (!provided) {
                    this.addError(`Missing field '${field.name}' in struct construction`, node)
                } else {
                    this.checkNode(provided.value, field.type)
                }
            }

            return type
        }

        this.addError(`Unknown type: ${typeName}`, node)
        return ANY
    }

    private inferFunctionDeclaration(node: any): BaseType {
        const name = node.name
        const params = node.parameters

        // Create function scope
        const funcEnv = this.env.createChild()
        const oldEnv = this.env
        this.env = funcEnv

        // Infer parameter types from annotations or default to Any
        const paramTypes: BaseType[] = []
        for (const param of params) {
            const paramType = param.typeAnnotation ? this.resolveTypeAnnotation(param.typeAnnotation) : ANY

            paramTypes.push(paramType)
            this.env.defineVar(param.name, paramType)
        }

        // Infer body type
        const bodyNode = this.inferNode(node.body)
        const returnType = (bodyNode as any)._inferredType as BaseType

        this.env = oldEnv

        // Create function type
        const funcType = new FunctionType(paramTypes, returnType)

        // Register function in environment
        this.env.defineVar(name, funcType)

        return funcType
    }

    private inferTypeDeclaration(node: any): BaseType {
        const name = node.name
        const typeParams = node.typeParams || []
        const parent = node.parent

        // Resolve parent type
        const parentType = parent ? this.env.getType(parent) || ANY : ANY

        // Create type variables for generic parameters
        const typeVars: TypeVar[] = typeParams.map((p: string) => new TypeVar(p, ANY))

        if (node.variants) {
            // ADT
            const variants = node.variants.map((v: any) => ({
                name: v.name,
                fields: v.fields.map((f: any) => ({
                    name: f.name,
                    type: this.resolveTypeAnnotation(f.fieldType),
                })),
            }))

            const adtType = new ADTType(name, typeVars, variants, parentType)
            this.env.defineType(name, adtType)

            // Register variant constructors as functions
            for (const variant of variants) {
                const variantParamTypes = variant.fields.map((f: { name: string; type: BaseType }) => f.type)
                const constructorType = new FunctionType(variantParamTypes, adtType)
                this.env.defineVar(variant.name, constructorType)
            }

            return adtType
        } else {
            // Struct
            const fields = node.fields.map((f: any) => ({
                name: f.name,
                type: this.resolveTypeAnnotation(f.fieldType),
            }))

            const structType = new StructType(name, fields, parentType)
            this.env.defineType(name, structType)

            return structType
        }
    }

    /**
     * Resolve a type annotation node to a BaseType
     */
    private resolveTypeAnnotation(node: ASTNode): BaseType {
        if (node.type === "identifier") {
            const typeName = (node as any).name
            const type = this.env.getType(typeName)

            if (!type) {
                this.addError(`Unknown type: ${typeName}`, node)
                return ANY
            }
            return type
        }

        if (node.type === "typeInstance") {
            // Parametric type like Array<Int>
            const baseName = (node as any).typeName
            const typeArgs = (node as any).fields.map((f: any) => this.resolveTypeAnnotation(f.value))

            const baseType = this.env.getType(baseName)
            if (!baseType) {
                this.addError(`Unknown type: ${baseName}`, node)
                return ANY
            }

            return new ParametricType(baseName, typeArgs, baseType)
        }

        return ANY
    }
}

/**
 * Initialize a type environment with built-in types
 */
export function createDefaultTypeEnvironment(): TypeEnvironment {
    const env = new TypeEnvironment()

    // Define base types
    const NumberT = new AbstractType("Number", ANY)
    const IntT = new ConcreteType("Int", NumberT)
    const FloatT = new ConcreteType("Float", NumberT)
    const StringT = new ConcreteType("String", ANY)
    const BooleanT = new ConcreteType("Boolean", ANY)

    env.defineType("Any", ANY)
    env.defineType("Number", NumberT)
    env.defineType("Int", IntT)
    env.defineType("Float", FloatT)
    env.defineType("String", StringT)
    env.defineType("Boolean", BooleanT)

    // Define built-in functions
    const T = new TypeVar("T", ANY)

    // print: (Any...) -> Undefined
    env.defineVar("print", new FunctionType([ANY], ANY))

    // len: String -> Int | Array<T> -> Int
    env.defineVar("len", new FunctionType([ANY], IntT))

    // type: T -> String
    env.defineVar("type", new FunctionType([T], StringT))

    return env
}
