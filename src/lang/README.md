# Datasheet DSL

This directory contains the implementation of a Domain-Specific Language (DSL) for interacting with tabular and text data through the user interface. This is a small functional scripting language similar to JavaScript, designed for querying and manipulating datasets within the Datasheet application.

## Language Features

-   **Data Types**: Supports primitive types (numbers, strings, booleans), arrays, and objects. The type system is dynamic but similar to Julia with all types information available at runtime with types being first-class citizens. The main difference is that multiple dispatch is static and resolved at compile time when possible.

-   **Variables**: Allows declaration and assignment of variables.

-   **Functions**: Supports _universal call syntax_ for defining and invoking functions.

-   **Blocks**: For defining closures inline.

-   **Control Flow**: Simple control flow constructs.

    -   For conditional statements there is the `match` expression for pattern matching.

    -   Use `map`, `filter`, and `reduce` for iterating over data.

-   **Algebraic Data Types (ADTs)**: Define sum types with variants using the `type Name := | Variant1 [...] | Variant2 [...]` syntax. Each variant can have named fields.

-   **Pattern Matching with Captures**: Match on ADT variants and extract values using the `?name` syntax for binding captures. Supports nested patterns and wildcard `?` for catch-all cases.

-   **Error Handling**: Result and Option types for safe error handling and nullability.

-   **Operator Overloading**: Operators can be overloaded for custom types.

## Example Usage

#### Basic Example

```dsl
arr := [1, 2, 3, 4, 5, 6]
result := arr
  .map { x | x * 2 }
  .filter { x | x > 5 }

print result  # Outputs: [ 6, 8, 10, 12 ]
```

#### Functions

```dsl
fn square x :=
    x * x

fn cube x :=
    x * x * x

result := square 5
print result  # Outputs: 25
```

#### Closures

```dsl
squareFn := { x | x * x }

add := { a, b | a + b }
concat := { a, b | a + b }

print squareFn 5          # Outputs: 25
print add(3, 4)           # Outputs: 7
print concat("a", "b")    # Outputs: ab
```

## Example Implementation

The DSL is implemented in TypeScript within the Datasheet application. The core components include:

-   **Lexer**: Tokenizes DSL code
-   **Parser**: Converts DSL code into an Abstract Syntax Tree (AST) using Pratt parsing
-   **Interpreter**: Evaluates the AST and executes the DSL code
-   **Type Checker**: (Future) Ensures type safety and resolves types at compile time
-   **Standard Library**: Provides built-in functions for data manipulation

## Pattern Matching System

The DSL supports a powerful pattern matching system with algebraic data types (ADTs):

### ADT Syntax

Define a type with multiple variants:

```dsl
type TypeName :=
  | VariantA
  | VariantB [ field1: Type, field2: Type ]
  | VariantC [ field: Type ]
```

### Pattern Capture Syntax

The `?name` syntax binds matched values to variables:

-   `?varName` - Capture a value and bind it to `varName`
-   `fieldName: ?varName` - Match a field and capture its value
-   `?varName [ nested: ?pattern ]` - Capture with nested pattern matching
-   `?` - Wildcard that matches anything without binding

### Match Expression Syntax

```dsl
match value {
  Pattern1 => expression1;
  Pattern2 => expression2;
  ? => default_expression
}
```

### Assignment Pattern Matching

Extract values from ADT instances in assignments:

```dsl
PatternName [ field: ?varName ] := expression
```

All captured variables are bound in the current scope.

A command-line interface is provided for debugging and testing the language components:

### Lexer Mode

View tokens generated from source code:

```bash
bun run src/lang/cli.ts --lexer -c "1 + 2"
bun run src/lang/cli.ts --lexer -c "fn add (x, y) := x + y"
```

### AST Mode

View the Abstract Syntax Tree:

```bash
bun run src/lang/cli.ts --ast -c "1 + 2"
bun run src/lang/cli.ts --ast -c "fn square x := x * x"
```

### Eval Mode

Execute code and see results:

```bash
bun run src/lang/cli.ts --eval -c "1 + 2"
bun run src/lang/cli.ts --eval -c "x := 10; y := 20; x + y"
bun run src/lang/cli.ts --eval -c "fn square x := x * x; square(5)"
bun run src/lang/cli.ts --eval -c "[1, 2, 3, 4, 5]"
bun run src/lang/cli.ts --eval -c "[1, 2, 3].join(\",\")"
```

### Reading from stdin

All modes support reading from stdin with the `-` argument:

```bash
echo "1 + 2" | bun run src/lang/cli.ts --eval -c -
echo "type Result := | Ok [value: String] | Err [message: String]" | bun run src/lang/cli.ts --ast -c -
```

## Interpreter Features

The interpreter supports:

-   **Arithmetic**: `+`, `-`, `*`, `/`, `%`, `^`
-   **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`
-   **Logical**: `&&`, `||`, `!`
-   **String operations**: Concatenation with `+`, repetition with `*`
-   **Variables**: Assignment with `:=`
-   **Functions**: Definition with `fn` and calls
-   **Arrays**: `[1, 2, 3]` with methods like `.join()`, `.map()`, `.filter()`, `.reduce()`
-   **Objects**: Key-value pairs
-   **Blocks**: Anonymous code blocks with optional parameters
-   **Method chaining**: Chain method calls across multiple lines (e.g., `arr.map { ... }.filter { ... }`)
-   **Match expressions**: Pattern matching with `match value { pattern => body; ... }`
-   **Brace-delimited match blocks**: Multiple arms separated by semicolons within braces
-   **Wildcard patterns**: Use `?` for catch-all patterns that match anything
-   **Capture patterns**: Use `?name` to bind matched values to variables
-   **Nested patterns**: Combine captures with nested structures for deep value extraction
-   **Built-in functions**: `print`, `add`, `sub`, `mul`, `div`, `len`, `type`

## Example Programs

### Simple Arithmetic

```dsl
1 + 2 * 3
# Result: 7
```

### Variables and Functions

```dsl
fn square x := x * x
fn cube x := x * x * x
square(5) + cube(2)
# Result: 33
```

### Arrays

```dsl
arr := [1, 2, 3, 4, 5]
arr.join(",")
# Result: "1,2,3,4,5"
```

### Method Chaining

Chain multiple method calls across lines for readable data transformations:

```dsl
result := [1, 2, 3, 4, 5, 6]
  .map { x | x * 2 }
  .filter { x | x > 5 }

print result
# Result: [ 6, 8, 10, 12 ]
```

### Pattern Matching

#### Basic Pattern Matching on ADT Variants

```dsl
type Result := | Ok [ value: String ] | Err [ message: String ]

result := Ok [ value: "success" ]

match result {
  Ok [ value: ?v ] => print("Success: " + v)
  Err [ message: ?msg ] => print("Error: " + msg)
  ? => print("Unknown")
}
# Outputs: Success: success
```

#### Pattern Matching in Assignments

Extract values from ADT instances using pattern binding:

```dsl
type Option := | Some [ value: String ] | None

wrapped := Some [ value: "hello" ]
Some [ value: ?msg ] := wrapped

print(msg)
# Outputs: hello
```

#### Nested Pattern Matching

Match deeply nested structures in a single pattern:

```dsl
type Response := | Success [ result: Result ] | Failed

response := Success [ result: Ok [ value: "data" ] ]

match response {
  Success [ result: Ok [ value: ?data ] ] => print("Got: " + data)
  Success [ result: Err [ message: ?err ] ] => print("Error: " + err)
  Failed => print("Failed")
}
# Outputs: Got: data
```

#### Algebraic Data Types (ADTs)

Define custom types with multiple variants:

```dsl
type Result := | Ok [ value: String ] | Err [ message: String ]
type Option := | Some [ value: String ] | None
type Color := | Red | Green | Blue

# Construct instances
ok_result := Ok [ value: "data" ]
error_result := Err [ message: "something went wrong" ]
some_val := Some [ value: "wrapped" ]
red := Red

# Pattern match on variants
match ok_result {
  Ok [ value: ?v ] => print(v)
  Err [ message: ?m ] => print(m)
}
```

### Logical Operators

```dsl
x := 5
y := 10
x > 3 && y < 20
# Result: true
```

### Blocks

```dsl
{ x := 42; x * 2 }
# Result: 84
```

```

```
