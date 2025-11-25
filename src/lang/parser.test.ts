import { describe, expect, test } from "bun:test"
import { parse } from "./parser"

describe("Lexer and Parser", () => {
    describe("Literals", () => {
        test("parses integer literals", () => {
            const ast = parse("42")
            expect(ast).toHaveLength(1)
            expect(ast[0]).toMatchObject({
                type: "literal",
                valueType: "number",
                value: 42,
            })
        })

        test("parses float literals", () => {
            const ast = parse("3.14")
            expect(ast).toHaveLength(1)
            expect(ast[0]).toMatchObject({
                type: "literal",
                valueType: "number",
                value: 3.14,
            })
        })

        test("parses string literals", () => {
            const ast = parse('"hello world"')
            expect(ast).toHaveLength(1)
            expect(ast[0]).toMatchObject({
                type: "literal",
                valueType: "string",
                value: "hello world",
            })
        })

        test("parses multiline string literals", () => {
            const ast = parse('"""line 1\nline 2\nline 3"""')
            expect(ast).toHaveLength(1)
            expect(ast[0]).toMatchObject({
                type: "literal",
                valueType: "string",
                value: "line 1\nline 2\nline 3",
            })
        })

        test("parses boolean literals", () => {
            const ast1 = parse("true")
            expect(ast1[0]).toMatchObject({
                type: "literal",
                valueType: "boolean",
                value: true,
            })

            const ast2 = parse("false")
            expect(ast2[0]).toMatchObject({
                type: "literal",
                valueType: "boolean",
                value: false,
            })
        })

        test("handles escape sequences in strings", () => {
            const ast = parse('"hello\\nworld\\t!"')
            expect(ast[0]).toMatchObject({
                type: "literal",
                valueType: "string",
                value: "hello\nworld\t!",
            })
        })
    })

    describe("Identifiers", () => {
        test("parses simple identifiers", () => {
            const ast = parse("myVariable")
            expect(ast[0]).toMatchObject({
                type: "identifier",
                name: "myVariable",
            })
        })

        test("parses identifiers with underscores", () => {
            const ast = parse("my_variable_name")
            expect(ast[0]).toMatchObject({
                type: "identifier",
                name: "my_variable_name",
            })
        })
    })

    describe("Binary Operations", () => {
        test("parses addition", () => {
            const ast = parse("1 + 2")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "+",
                left: { type: "literal", value: 1 },
                right: { type: "literal", value: 2 },
            })
        })

        test("parses subtraction", () => {
            const ast = parse("5 - 3")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "-",
            })
        })

        test("parses multiplication", () => {
            const ast = parse("4 * 7")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "*",
            })
        })

        test("parses division", () => {
            const ast = parse("10 / 2")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "/",
            })
        })

        test("respects operator precedence", () => {
            const ast = parse("1 + 2 * 3")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "+",
                left: { type: "literal", value: 1 },
                right: {
                    type: "binaryOp",
                    operator: "*",
                    left: { type: "literal", value: 2 },
                    right: { type: "literal", value: 3 },
                },
            })
        })

        test("handles parentheses for grouping", () => {
            const ast = parse("(1 + 2) * 3")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "*",
                left: {
                    type: "binaryOp",
                    operator: "+",
                    left: { type: "literal", value: 1 },
                    right: { type: "literal", value: 2 },
                },
                right: { type: "literal", value: 3 },
            })
        })

        test("parses comparison operators", () => {
            const ast = parse("x == 5")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "==",
                left: { type: "identifier", name: "x" },
                right: { type: "literal", value: 5 },
            })
        })

        test("parses logical operators", () => {
            const ast = parse("true && false")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "&&",
            })
        })
    })

    describe("Unary Operations", () => {
        test("parses negation", () => {
            const ast = parse("-42")
            expect(ast[0]).toMatchObject({
                type: "unaryOp",
                operator: "-",
                operand: { type: "literal", value: 42 },
            })
        })

        test("parses logical not", () => {
            const ast = parse("!true")
            expect(ast[0]).toMatchObject({
                type: "unaryOp",
                operator: "!",
                operand: { type: "literal", value: true },
            })
        })
    })

    describe("Assignments", () => {
        test("parses simple assignment", () => {
            const ast = parse("x := 42")
            expect(ast[0]).toMatchObject({
                type: "assignment",
                variable: "x",
                value: { type: "literal", value: 42 },
            })
        })

        test("parses assignment with expression", () => {
            const ast = parse("result := 1 + 2 * 3")
            expect(ast[0]).toMatchObject({
                type: "assignment",
                variable: "result",
                value: {
                    type: "binaryOp",
                    operator: "+",
                },
            })
        })
    })

    describe("Field Access", () => {
        test("parses simple field access", () => {
            const ast = parse("user.name")
            expect(ast[0]).toMatchObject({
                type: "fieldAccess",
                object: { type: "identifier", name: "user" },
                field: "name",
            })
        })

        test("parses chained field access", () => {
            const ast = parse("user.profile.email")
            expect(ast[0]).toMatchObject({
                type: "fieldAccess",
                object: {
                    type: "fieldAccess",
                    object: { type: "identifier", name: "user" },
                    field: "profile",
                },
                field: "email",
            })
        })
    })

    describe("Method Calls", () => {
        test("parses method calls with no arguments", () => {
            const ast = parse("data.load()")
            expect(ast[0]).toMatchObject({
                type: "methodCall",
                object: { type: "identifier", name: "data" },
                method: "load",
                arguments: [],
            })
        })

        test("parses method calls with arguments", () => {
            const ast = parse('user.setName("John")')
            expect(ast[0]).toMatchObject({
                type: "methodCall",
                object: { type: "identifier", name: "user" },
                method: "setName",
                arguments: [{ type: "literal", value: "John" }],
            })
        })

        test("parses function calls", () => {
            const ast = parse("load(42)")
            expect(ast[0]).toMatchObject({
                type: "methodCall",
                method: "load",
                arguments: [{ type: "literal", value: 42 }],
            })
        })
    })

    describe("Type Declarations", () => {
        test("parses simple type declaration", () => {
            const ast = parse("type User [ id: Int, name: String ]")
            expect(ast[0]).toMatchObject({
                type: "typeDeclaration",
                name: "User",
                isAbstract: false,
                fields: [
                    { name: "id", fieldType: { type: "identifier", name: "Int" } },
                    { name: "name", fieldType: { type: "identifier", name: "String" } },
                ],
            })
        })

        test("parses abstract type declaration", () => {
            const ast = parse("abstract type Shape")
            expect(ast[0]).toMatchObject({
                type: "typeDeclaration",
                name: "Shape",
                isAbstract: true,
            })
        })

        test("parses type with inheritance", () => {
            const ast = parse("type Circle <: Shape [ radius: Float ]")
            expect(ast[0]).toMatchObject({
                type: "typeDeclaration",
                name: "Circle",
                isAbstract: false,
                parent: "Shape",
                fields: [{ name: "radius", fieldType: { type: "identifier", name: "Float" } }],
            })
        })
    })

    describe("Type Instances", () => {
        test("parses type instance creation", () => {
            const ast = parse('User [ id: 101, username: "jdoe" ]')
            expect(ast[0]).toMatchObject({
                type: "typeInstance",
                typeName: "User",
                fields: [
                    { key: "id", value: { type: "literal", value: 101 } },
                    { key: "username", value: { type: "literal", value: "jdoe" } },
                ],
            })
        })

        test("parses nested type instances", () => {
            const ast = parse('Person [ name: "John", age: 30 ]')
            expect(ast[0]).toMatchObject({
                type: "typeInstance",
                typeName: "Person",
            })
        })
    })

    describe("Function Declarations", () => {
        test("parses simple function", () => {
            const ast = parse("fn square x: Int := x * x")
            expect(ast[0]).toMatchObject({
                type: "functionDeclaration",
                name: "square",
                parameters: [
                    {
                        type: "parameter",
                        name: "x",
                        typeAnnotation: { type: "identifier", name: "Int" },
                    },
                ],
                body: {
                    type: "binaryOp",
                    operator: "*",
                },
            })
        })

        test("parses function with multiple parameters", () => {
            const ast = parse("fn add (x: Int, y: Int) := x + y")
            expect(ast[0]).toMatchObject({
                type: "functionDeclaration",
                name: "add",
                parameters: [
                    { type: "parameter", name: "x" },
                    { type: "parameter", name: "y" },
                ],
            })
        })

        test("parses function with no type annotations", () => {
            const ast = parse("fn identity x := x")
            expect(ast[0]).toMatchObject({
                type: "functionDeclaration",
                name: "identity",
                parameters: [{ type: "parameter", name: "x", typeAnnotation: undefined }],
                body: { type: "identifier", name: "x" },
            })
        })
    })

    describe("Blocks and Closures", () => {
        test("parses simple block", () => {
            const ast = parse("{ 1 + 2 }")
            expect(ast[0]).toMatchObject({
                type: "block",
                body: [
                    {
                        type: "binaryOp",
                        operator: "+",
                    },
                ],
            })
        })

        test("parses block with parameters", () => {
            const ast = parse("{ x, y | x + y }")
            expect(ast[0]).toMatchObject({
                type: "block",
                parameters: ["x", "y"],
                body: [
                    {
                        type: "binaryOp",
                        operator: "+",
                    },
                ],
            })
        })

        test("parses block used as closure", () => {
            const ast = parse("data.map { row | row.age * 2 }")
            expect(ast[0]).toMatchObject({
                type: "methodCall",
                object: { type: "identifier", name: "data" },
                method: "map",
                arguments: [
                    {
                        type: "block",
                        parameters: ["row"],
                    },
                ],
            })
        })
    })

    describe("Match Expressions", () => {
        test("parses match expression", () => {
            const ast = parse("match x { 1 => true }")
            expect(ast[0]).toMatchObject({
                type: "matchExpression",
                value: { type: "identifier", name: "x" },
                arms: [
                    {
                        type: "patternArm",
                        pattern: { type: "literal", value: 1 },
                        body: { type: "literal", value: true },
                    },
                ],
            })
        })

        test("parses match with multiple arms", () => {
            const ast = parse('match value { 1 => "one", 2 => "two" }')
            expect(ast[0]).toMatchObject({
                type: "matchExpression",
                value: { type: "identifier", name: "value" },
                arms: [
                    { type: "patternArm", pattern: { type: "literal", value: 1 } },
                    { type: "patternArm", pattern: { type: "literal", value: 2 } },
                ],
            })
        })
    })

    describe("Quoted Forms", () => {
        test("parses quoted expression", () => {
            const ast = parse("#[ 1 + 2 ]")
            expect(ast[0]).toMatchObject({
                type: "quotedForm",
                expression: {
                    type: "typeInstance",
                    typeName: "Array",
                },
            })
        })

        test("parses quoted form with simple expression", () => {
            const ast = parse("#42")
            expect(ast[0]).toMatchObject({
                type: "quotedForm",
                expression: { type: "literal", value: 42 },
            })
        })
    })

    describe("Arrays", () => {
        test("parses empty array", () => {
            const ast = parse("[]")
            expect(ast[0]).toMatchObject({
                type: "typeInstance",
                typeName: "Array",
                fields: [],
            })
        })

        test("parses array with elements", () => {
            const ast = parse("[1, 2, 3]")
            expect(ast[0]).toMatchObject({
                type: "typeInstance",
                typeName: "Array",
                fields: [
                    { key: "0", value: { type: "literal", value: 1 } },
                    { key: "1", value: { type: "literal", value: 2 } },
                    { key: "2", value: { type: "literal", value: 3 } },
                ],
            })
        })
    })

    describe("Comments", () => {
        test("ignores line comments", () => {
            const ast = parse("# This is a comment\n42")
            expect(ast).toHaveLength(1)
            expect(ast[0]).toMatchObject({
                type: "literal",
                value: 42,
            })
        })

        test("handles inline comments", () => {
            const ast = parse("x := 42 # assign value")
            expect(ast[0]).toMatchObject({
                type: "assignment",
                variable: "x",
                value: { type: "literal", value: 42 },
            })
        })
    })

    describe("Complex Expressions", () => {
        test("parses complex nested expression", () => {
            const ast = parse("(1 + 2) * (3 - 4) / 5")
            expect(ast[0]).toMatchObject({
                type: "binaryOp",
                operator: "/",
            })
        })

        test("parses assignment with method call", () => {
            const ast = parse('data := load("file.csv")')
            expect(ast[0]).toMatchObject({
                type: "assignment",
                variable: "data",
                value: {
                    type: "methodCall",
                    method: "load",
                },
            })
        })

        test("parses chained method calls", () => {
            const ast = parse("data.filter().map().reduce()")
            expect(ast[0]).toMatchObject({
                type: "methodCall",
                method: "reduce",
            })
        })
    })

    describe("Multiple Statements", () => {
        test("parses multiple statements", () => {
            const ast = parse("x := 1; y := 2; z := 3")
            expect(ast).toHaveLength(3)
            expect(ast[0]).toMatchObject({ type: "assignment", variable: "x" })
            expect(ast[1]).toMatchObject({ type: "assignment", variable: "y" })
            expect(ast[2]).toMatchObject({ type: "assignment", variable: "z" })
        })

        test("handles statements without semicolons", () => {
            const ast = parse("x := 1\ny := 2\nz := 3")
            expect(ast).toHaveLength(3)
        })
    })

    describe("Error Handling", () => {
        test("throws error on unexpected token", () => {
            expect(() => parse("@ invalid")).toThrow()
        })

        test("throws error on unclosed parenthesis", () => {
            expect(() => parse("(1 + 2")).toThrow()
        })

        test("throws error on invalid assignment target", () => {
            expect(() => parse("42 := x")).toThrow()
        })
    })

    describe("Generic Types", () => {
        test("parses generic type annotation", () => {
            const ast = parse("type Container [ value: Option<Int> ]")
            expect(ast[0]).toMatchObject({
                type: "typeDeclaration",
                name: "Container",
                fields: [
                    {
                        name: "value",
                        fieldType: {
                            type: "typeInstance",
                            typeName: "Option",
                        },
                    },
                ],
            })
        })

        test("parses nested generic types", () => {
            const ast = parse("type Data [ items: Result<List<String>, Error> ]")
            expect(ast[0]).toMatchObject({
                type: "typeDeclaration",
                name: "Data",
            })
        })
    })
})
