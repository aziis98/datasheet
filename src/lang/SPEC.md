# Datasheet DSL Language Specification

A functional scripting language with Julia-inspired multiple dispatch and algebraic data types, designed for data manipulation and transformation.

---

## Table of Contents

1. [Lexical Elements](#1-lexical-elements)
2. [Data Types](#2-data-types)
3. [Variables and Assignment](#3-variables-and-assignment)
4. [Operators](#4-operators)
5. [Functions](#5-functions)
6. [Blocks and Closures](#6-blocks-and-closures)
7. [Arrays](#7-arrays)
8. [Objects](#8-objects)
9. [Type Declarations](#9-type-declarations)
10. [Algebraic Data Types (ADTs)](#10-algebraic-data-types-adts)
11. [Pattern Matching](#11-pattern-matching)
12. [Method Chaining](#12-method-chaining)
13. [Built-in Functions](#13-built-in-functions)
14. [Comments](#14-comments)

---

## 1. Lexical Elements

### Identifiers

Identifiers start with a letter or underscore, followed by letters, digits, or underscores.

```
identifier := [a-zA-Z_][a-zA-Z0-9_]*
```

### Keywords

```
fn, type, abstract, match, true, false
```

### Operators

```
:= => <: == != <= >= && || + - * / % ^ : . < > ! & | #
```

### Punctuation

```
( ) { } [ ] , ; . @ | ?
```

---

## 2. Data Types

### Primitive Types

| Type       | Description                       | Examples             |
| ---------- | --------------------------------- | -------------------- |
| `Int`      | Integer numbers                   | `42`, `-7`, `0`      |
| `Float`    | Floating-point numbers            | `3.14`, `-0.5`       |
| `Number`   | Abstract parent of Int and Float  | -                    |
| `String`   | Text strings                      | `"hello"`, `"world"` |
| `Boolean`  | Truth values                      | `true`, `false`      |
| `Array[T]` | Ordered collection                | `[1, 2, 3]`          |
| `Any`      | Top type (all types are subtypes) | -                    |

### Type Hierarchy

```
Any
├── Number
│   ├── Int
│   └── Float
├── String
├── Boolean
└── Array[T]
```

### Multiline Strings

Use triple quotes for strings spanning multiple lines:

```go
text := """
This is a
multiline string
"""
```

---

## 3. Variables and Assignment

Variables are declared and assigned using the `:=` operator:

```go
// Simple assignment
x := 42
name := "Alice"
active := true

// Assignment with expression
result := x * 2 + 10
```

Variables can be reassigned:

```go
counter := 0
counter := counter + 1
```

---

## 4. Operators

### Arithmetic Operators

| Operator | Description    | Example  | Result    |
| -------- | -------------- | -------- | --------- |
| `+`      | Addition       | `5 + 3`  | `8`       |
| `-`      | Subtraction    | `5 - 3`  | `2`       |
| `*`      | Multiplication | `5 * 3`  | `15`      |
| `/`      | Division       | `10 / 3` | `3` (Int) |
| `%`      | Modulo         | `10 % 3` | `1`       |
| `^`      | Power          | `2 ^ 3`  | `8`       |

### String Operators

| Operator | Description   | Example              | Result          |
| -------- | ------------- | -------------------- | --------------- |
| `+`      | Concatenation | `"Hello" + " World"` | `"Hello World"` |
| `*`      | Repetition    | `"ab" * 3`           | `"ababab"`      |

### Comparison Operators

| Operator | Description      | Example  |
| -------- | ---------------- | -------- |
| `==`     | Equal            | `x == y` |
| `!=`     | Not equal        | `x != y` |
| `<`      | Less than        | `x < y`  |
| `>`      | Greater than     | `x > y`  |
| `<=`     | Less or equal    | `x <= y` |
| `>=`     | Greater or equal | `x >= y` |

### Logical Operators

| Operator | Description | Example    |
| -------- | ----------- | ---------- |
| `&&`     | Logical AND | `a && b`   |
| `\|\|`   | Logical OR  | `a \|\| b` |
| `!`      | Logical NOT | `!a`       |

### Operator Precedence (lowest to highest)

1. `:=` (assignment)
2. `=>` (arrow)
3. `\|\|`
4. `&&`
5. `==`, `!=`
6. `<`, `>`, `<=`, `>=`
7. `+`, `-`
8. `*`, `/`, `%`
9. `^`
10. `.`, `[` (access)
11. `(` (call)

---

## 5. Functions

### Function Declaration

Functions are declared with the `fn` keyword:

```go
fn square x := x * x

fn add x, y := x + y
```

### Typed Parameters

Add type annotations with `:`:

```go
fn square x: Int := x * x

fn greet name: String := "Hello, " + name
```

### Multiple Dispatch

Define multiple implementations for different types:

```go
fn process x: Int := x * 2
fn process x: String := x + "!"

process(5)        // Returns: 10
process("hello")  // Returns: "hello!"
```

### Function Calls

Two styles of function invocation:

```go
// Parenthesized call
square(5)
add(3, 4)

// FP-style (space-separated)
square 5
print "hello"
```

### Universal Call Syntax

Methods can be called on any value:

```go
// These are equivalent:
len("hello")
"hello".len()
```

---

## 6. Blocks and Closures

### Anonymous Blocks

Blocks are defined with curly braces:

```go
{
  x := 10
  y := 20
  x + y
}
// Returns: 30
```

### Closures with Parameters

Use `|` to separate parameters from body:

```go
// Single parameter
{ x | x * 2 }

// Multiple parameters
{ a, b | a + b }

// With type annotation
{ x: Int | x * x }
```

### Using Closures

Closures are first-class values:

```go
double := { x | x * 2 }
double(5)  // Returns: 10

// As arguments to higher-order functions
[1, 2, 3].map { x | x * 2 }  // Returns: [2, 4, 6]
```

---

## 7. Arrays

### Array Literals

```go
empty := []
numbers := [1, 2, 3, 4, 5]
mixed := ["a", "b", "c"]
```

### Array Methods

| Method        | Description            | Example                                         |
| ------------- | ---------------------- | ----------------------------------------------- |
| `.map { }`    | Transform elements     | `[1, 2, 3].map { x \| x * 2 }` → `[2, 4, 6]`    |
| `.filter { }` | Filter elements        | `[1, 2, 3, 4].filter { x \| x > 2 }` → `[3, 4]` |
| `.reduce { }` | Reduce to single value | `[1, 2, 3].reduce({ a, b \| a + b }, 0)` → `6`  |
| `.join(sep)`  | Join to string         | `[1, 2, 3].join(",")` → `"1,2,3"`               |
| `.push(elem)` | Add element            | `arr.push(4)`                                   |
| `.pop()`      | Remove last element    | `arr.pop()`                                     |
| `.length`     | Get length             | `[1, 2, 3].length` → `3`                        |

### Method Chaining

Chain multiple operations:

```go
result := [1, 2, 3, 4, 5, 6]
  .map { x | x * 2 }
  .filter { x | x > 5 }
  .join(", ")

// Returns: "6, 8, 10, 12"
```

---

## 8. Objects

### Object Literals

Objects are created with key-value pairs in brackets:

```go
person := [
  name: "Alice",
  age: 30,
  active: true
]
```

### Field Access

Use dot notation:

```go
person.name   // "Alice"
person.age    // 30
```

---

## 9. Type Declarations

### Simple Type Definition

```go
type Point [
  x: Float
  y: Float
]
```

### Abstract Types

```go
type Shape
```

### Type Inheritance

````go
type Circle <: Shape [
  radius: Float
]

type Rectangle <: Shape [
  width: Float
  height: Float
]

### Creating Instances

Use bracket syntax:

```go
point := Point [ x: 3.0, y: 4.0 ]
circle := Circle [ radius: 5.0 ]
````

---

## 10. Algebraic Data Types (ADTs)

### Sum Type Definition

Define types with multiple variants using `|`:

```go
type Option :=
| Some [ value: String ]
| None

type Result :=
| Ok [ value: String ]
| Err [ message: String ]
```

### Variants with Multiple Fields

```go
type User :=
| Admin [ name: String, level: Int ]
| Basic [ name: String, age: Int ]
| Anonymous
```

### Creating ADT Instances

```go
// Variant with fields
user := Admin [ name: "Alice", level: 5 ]
result := Ok [ value: "success" ]

// Variant without fields
guest := Anonymous
nothing := None
```

---

## 11. Pattern Matching

### Match Expression

```go
match value {
  Pattern1 => expression1
  Pattern2 => expression2
  ? => default_expression
}
```

### Capture Patterns

Use `?name` to capture and bind values:

```go
type Option := | Some [ value: String ] | None

option := Some [ value: "hello" ]

match option {
  Some [ value: ?v ] => print ("Got: " + v)
  None => print "Nothing"
}
// Prints: "Got: hello"
```

### Wildcard Pattern

Use `?` alone to match anything without binding:

```go
match value {
  Some [ value: ?v ] => v
  ? => "default"
}
```

### Nested Pattern Matching

Match deeply nested structures:

```go
type Response := | Success [ result: Result ] | Failed

response := Success [ result: Ok [ value: "data" ] ]

match response {
  Success [ result: Ok [ value: ?data ] ] => print ("Data: " + data)
  Success [ result: Err [ message: ?err ] ] => print ("Error: " + err)
  Failed => print "Failed"
}
```

### Pattern Matching in Assignment

Extract values directly in assignments:

```go
result := Ok [ value: "important" ]

// Destructure and bind
Ok [ value: ?info ] := result

print info  // Prints: "important"
```

### Literal Patterns

Match specific values:

```go
match x {
  0 => "zero"
  1 => "one"
  ? => "other"
}
```

---

## 12. Method Chaining

Methods can be chained across multiple lines. The parser handles line continuation automatically when a line ends with an operator or starts with `.`:

```go
data := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .filter { x | x % 2 == 0 }
  .map { x | x * x }
  .filter { x | x > 10 }

// Result: [16, 36, 64, 100]
```

---

## 13. Built-in Functions

### I/O Functions

| Function | Description       | Example         |
| -------- | ----------------- | --------------- |
| `print`  | Output to console | `print "hello"` |

### Utility Functions

| Function | Description            | Example             |
| -------- | ---------------------- | ------------------- |
| `len`    | Length of string/array | `len "hello"` → `5` |
| `type`   | Get type name          | `type 42` → `"Int"` |

### Operators as Functions

Operators are implemented as functions and can be overloaded:

```go
fn op_add (v1: Vector, v2: Vector) :=
  Vector [ x: v1.x + v2.x, y: v1.y + v2.y ]
```

---

## 14. Comments

### Single-line Comments

Use `//` or `#`:

```go
// This is a comment
x := 42  // inline comment

# Alternative comment style
y := 10  # also works
```

---

## Complete Examples

### Example 1: Data Transformation Pipeline

```go
// Process a list of numbers
numbers := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

result := numbers
  .filter { x | x % 2 == 0 }    // Keep even numbers
  .map { x | x * x }            // Square them
  .join(", ")                   // Join as string

print result  // "4, 16, 36, 64, 100"
```

### Example 2: Error Handling with Result Type

```go
type Result :=
| Ok [ value: String ]
| Err [ message: String ]

fn processData input: String :=
  match input {
    "" => Err [ message: "Empty input" ]
    ? => Ok [ value: "Processed: " + input ]
  }

result := processData("hello")

match result {
  Ok [ value: ?v ] => print v
  Err [ message: ?m ] => print ("Error: " + m)
}
```

### Example 3: Multiple Dispatch

```go
type Shape

// Define area function for different shapes
type Circle <: Shape [
  radius: Float
]

type Rectangle <: Shape [
  width: Float
  height: Float
]

fn area shape: Circle := 3.14159 * shape.radius * shape.radius
fn area shape: Rectangle := shape.width * shape.height

c := Circle [ radius: 5.0 ]
r := Rectangle [ width: 4.0, height: 3.0 ]

print (area c)  // 78.53975
print (area r)  // 12.0
```

### Example 4: Nested Pattern Matching

```go
type Option := | Some [ value: String ] | None
type Result := | Ok [ data: Option ] | Err [ message: String ]

response := Ok [ data: Some [ value: "nested value" ] ]

match response {
  Ok [ data: Some [ value: ?v ] ] => print ("Got: " + v)
  Ok [ data: None ] => print "Got nothing"
  Err [ message: ?m ] => print ("Error: " + m)
}
// Prints: "Got: nested value"
```

---

## Grammar Summary (EBNF-like)

```ebnf
program        = { statement } ;
statement      = expression [ ";" ] ;
expression     = assignment | match_expr | binary_expr ;

assignment     = ( identifier | pattern ) ":=" expression ;
match_expr     = "match" expression "{" { match_arm } "}" ;
match_arm      = pattern "=>" expression [ "," | ";" ] ;

pattern        = capture_pattern | type_pattern | literal | identifier ;
capture_pattern = "?" [ identifier ] [ type_pattern ] ;
type_pattern   = identifier "[" { field_pattern } "]" ;
field_pattern  = identifier ":" pattern ;

binary_expr    = unary_expr { operator unary_expr } ;
unary_expr     = [ "-" | "!" ] primary_expr { postfix } ;
postfix        = "." identifier [ "(" args ")" | block ]
               | "[" expression "]"
               | "(" args ")" ;

primary_expr   = literal | identifier | "(" expression ")"
               | array | block | fn_decl | type_decl ;

literal        = number | string | "true" | "false" ;
array          = "[" [ expression { "," expression } ] "]" ;
block          = "{" [ params "|" ] { statement } "}" ;
params         = identifier { "," identifier } ;

fn_decl        = "fn" identifier { parameter } ":=" expression ;
parameter      = identifier [ ":" type ] ;

type_decl      = [ "abstract" ] "type" identifier [ "<:" identifier ]
                 [ "[" fields "]" | ":=" variants ] ;
variants       = "|" variant { "|" variant } ;
variant        = identifier [ "[" fields "]" ] ;
fields         = field { "," field } ;
field          = identifier ":" type ;
```
