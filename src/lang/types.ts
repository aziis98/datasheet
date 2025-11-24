import type { BaseType } from "./type-system"

export type RuntimeValue = {
    value: any
    __type__: BaseType
}

export type ASTNode =
    | Literal
    | Identifier
    | BinaryOp
    | UnaryOp
    | Assignment
    | CapturePattern
    | TypeDeclaration
    | FunctionDeclaration
    | TypeInstance
    | FieldAccess
    | MethodCall
    | Block
    | MatchExpression
    | PatternArm
    | QuotedForm
    | TypeAnnotation
    | FunctionParameter
    | ADTVariant

export type Literal = {
    type: "literal"
    valueType: "number" | "string" | "boolean"
    value: number | string | boolean
}

export type Identifier = {
    type: "identifier"
    name: string
}

export type BinaryOp = {
    type: "binaryOp"
    operator: string
    left: ASTNode
    right: ASTNode
}

export type UnaryOp = {
    type: "unaryOp"
    operator: string
    operand: ASTNode
}

export type Assignment = {
    type: "assignment"
    variable: string
    value: ASTNode
    pattern?: ASTNode
}

export type CapturePattern = {
    type: "capturePattern"
    name: string
    pattern?: ASTNode
}

export type TypeAnnotation = {
    type: "typeAnnotation"
    typeExpr: ASTNode
}

export type FunctionParameter = {
    type: "parameter"
    name: string
    typeAnnotation?: ASTNode
}

export type ADTVariant = {
    type: "adtVariant"
    name: string
    fields: Array<{ name: string; fieldType: ASTNode }>
}

export type TypeDeclaration = {
    type: "typeDeclaration"
    name: string
    isAbstract: boolean
    typeParams?: string[]
    parent?: string
    fields: Array<{ name: string; fieldType: ASTNode }>
    variants?: ADTVariant[]
}

export type FunctionDeclaration = {
    type: "functionDeclaration"
    name: string
    parameters: FunctionParameter[]
    returnType?: ASTNode
    body: ASTNode
}

export type TypeInstance = {
    type: "typeInstance"
    typeName: string
    fields: Array<{ key: string; value: ASTNode }>
}

export type FieldAccess = {
    type: "fieldAccess"
    object: ASTNode
    field: string
}

export type MethodCall = {
    type: "methodCall"
    object: ASTNode
    method: string
    arguments: ASTNode[]
}

export type Block = {
    type: "block"
    parameters?: string[]
    body: ASTNode[]
}

export type PatternArm = {
    type: "patternArm"
    pattern: ASTNode
    body: ASTNode
}

export type MatchExpression = {
    type: "matchExpression"
    value: ASTNode
    arms: PatternArm[]
}

export type QuotedForm = {
    type: "quotedForm"
    expression: ASTNode
}

export type TokenType = "number" | "string" | "identifier" | "keyword" | "operator" | "punctuation" | "eof"

export type Token = {
    type: TokenType
    value: string
    line: number
    column: number
}
