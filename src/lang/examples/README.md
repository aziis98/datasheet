# Examples

This folder contains example `.lang` files demonstrating various features of the Datasheet DSL.

## Running Examples

To run an example file, use the CLI:

```bash
bun src/lang/cli.ts examples/hello.lang
```

You can also inspect the tokens or AST:

```bash
# View tokens from lexer
bun src/lang/cli.ts --lexer -c "1 + 2"

# View AST
bun src/lang/cli.ts --ast -c "1 + 2"

# Run file in eval mode
bun src/lang/cli.ts --eval examples/hello.lang
# or simply (eval is default for files)
bun src/lang/cli.ts examples/hello.lang
```

## Files

-   **hello.lang** - Basic string output
-   **arithmetic.lang** - Basic arithmetic operations
-   **variables.lang** - Variable assignment and usage
-   **functions.lang** - Function definition and calling
-   **arrays.lang** - Array creation and mapping
-   **filter.lang** - Array filtering with closures
-   **objects.lang** - Object literals and field access
-   **string_operations.lang** - String concatenation

## Language Features

For a complete guide to the DSL syntax, see [../src/lang/SPEC.md](../src/lang/SPEC.md)
