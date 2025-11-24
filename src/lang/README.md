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

-   **Error Handling**: Result and Option types for safe error handling and nullability.

-   **Operator Overloading**: Operators can be overloaded for custom types.

## Example Usage

#### Basic Example

```dsl
data := load "data.csv"
filteredData := data.filter | _.age > 30 |
result := filteredData.mapColumn "age" { _ * 2 }
print result
```

#### Functions

```dsl
fn square x: Int :=
    x * x

fn square x: Float :=
    x * x

result := square 5
print result  # Outputs: 25
```

#### Closures

```dsl
squareFn := { x: Int | x * x }

add := { a: Int, b: Int | a + b }
concat := { a: String, b: String | a + b }
```

## Example Implementation

The DSL is implemented in TypeScript within the Datasheet application. The core components include:

-   **Lexer**: Tokenizes DSL code
-   **Parser**: Converts DSL code into an Abstract Syntax Tree (AST) using Pratt parsing
-   **Interpreter**: Evaluates the AST and executes the DSL code
-   **Type Checker**: (Future) Ensures type safety and resolves types at compile time
-   **Standard Library**: Provides built-in functions for data manipulation

## CLI Usage

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
echo "fn factorial n := match n: 0 => 1; n => n" | bun run src/lang/cli.ts --ast -c -
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
-   **Match expressions**: Pattern matching with `match value: pattern => result`
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

### Pattern Matching

```dsl
match 5:
  0 => "zero"
  1 => "one"
# Throws error: No matching pattern found
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
