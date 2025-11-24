## 📑 Datasheet DSL Syntax Summary

This summary outlines the complete syntax features of the Datasheet DSL, incorporating the Lisp-style object instantiation, multiline strings, quoted forms, and function-based operator overloading.

-----

### 1\. Data Types and Variables

| Feature | Syntax | Description |
| :--- | :--- | :--- |
| **Primitives** | `42`, `3.14`, `"text"`, `true` | Supports `Int`, `Float`, `String`, and `Bool`. |
| **Assignment** | `data := load "file.csv"` | Uses `:=` for variable declaration and assignment. |
| **Access** | `user.username` | Dot notation for accessing fields of an Object or Record. |
| **Multiline String** | `"""A string\nspanning\nmultiple lines"""` | Uses triple quotes for strings that can contain newlines. |

-----

### 2\. Named Types and Algebraic Data Types (ADTs)

This structure supports both **Product Types** (Structs/Records) and **Sum Types** (Tagged Unions) for high type safety.

| Feature | Syntax | Example |
| :--- | :--- | :--- |
| **Type Definition** | `type <Name>: <fields>` | `type User: id: Int, username: String` |
| **Abstract Type** | `abstract type <Name>` | `abstract type Shape` |
| **Inheritance** | `type <Child> <: <Parent>` | `type Circle <: Shape: radius: Float` |
| **Instance Creation** | `Type [ <key>: <value>, ... ]` | `User [ id: 101, username: "jdoe" ]` |
| **Key-Value Pair** | `<key>: <value>` | The `:` operator creates the required pair. |

-----

### 3\. Functions and Closures

The DSL uses **Universal Call Syntax** and supports **multiple dispatch** resolved at compile-time when possible.

| Feature | Syntax | Description |
| :--- | :--- | :--- |
| **Function Definition** | `fn <name> <params> := <body>` | `fn square x: Int := x * x` |
| **Multiple Dispatch** | `fn <name> <params> := <body>` | Defined by different type signatures for the same function name. |
| **Closure (Block)** | `{ <params> | <body> }` | `data.map { row | row.age * 2 }` |

-----

### 4\. Control Flow and Iteration

| Feature | Syntax | Description |
| :--- | :--- | :--- |
| **Pattern Match** | `match <value>: <pattern> => <body>` | The core conditional and ADT deconstruction mechanism. |
| **Iteration** | `data.map`, `data.filter`, `data.reduce` | High-order functions for data iteration (preferred over loops). |

-----

### 5\. Advanced Features

| Feature | Syntax | Description |
| :--- | :--- | :--- |
| **Error Handling** | `Result<T, E>`, `Option<T>` | Non-exception based types for safe error handling and nullability. |
| **Trait** | `trait <Name>: <method signatures>` | Defines a set of methods that a type must implement. |
| **Trait Impl** | `impl <Trait> for <Type>: ...` | Provides the implementation of a trait for a specific type. |
| **Operator Overloading** | `fn op_add (a: <TypeA>, b: <TypeB>) := ...` | Implemented via special, user-defined functions (e.g., `op_add`, `op_mul`). |
| **Quoted Forms** | `'[ fn square x: Int ]` | The `'` (single quote) operator prevents evaluation of the subsequent expression, treating it as data (Abstract Syntax Tree). |
| **Unquoted Forms (Splicing)** | `@[ 1, 2, 3 ]` | (Implied/Potential Feature): Allows embedding the result of an expression inside a quoted form. |

### Example demonstrating `op_add` and Quoted Forms

```dsl
# 1. Operator Overloading (The compiler maps '+' to op_add)
fn op_add (v1: Vector, v2: Vector): Vector :=
    Vector [ x: v1.x + v2.x, y: v1.y + v2.y ]

# 2. Quoted Form
expression_data := '[ 1 + 2 * 3 ]

# The interpreter can later analyze the expression_data AST without running it.
```