# DataSheet

A modern web version of Lotus Improv with some features from AirTable in a clean and simple Google Sheets / VSCode style.

### Features

-   Manipulate and visualize multidimensional data

-   A sheet can be composed of various blocks

    -   **Markdown** blocks

        -   [x] Minimal editable markdown-like syntax

        -   [ ] Full Markdown with LaTeX

    -   **Tensor** blocks for entering multidimensional data.

        Values can be

        -   [x] _primitives_ as strings

        -   [ ] _primitives_ as numbers, rationals

        -   [ ] _references_ to link multiple tensors together in a sheet in a reactive fashion

        -   [ ] _files_ and other "multimedia" as in AirTable

    -   [ ] **Formulas** ca be...

    -   [ ] **Plots** (WIP)

## Backend

Golang + Fiber + SQLite (with recent json features to use it as a document database)

-   [ ] Add accounts and store data server side

## FrontEnd

ViteJS + Preact + Scss + ndarray

## TODOs / Ideas / Open Questions

-   [ ] TODO: Restyle of the tensor component

    The axis selector for columns should be on the right side of the table for clarity (differently from Lotus Improv).

    Currenly the style of the tensor component is too bulky, simplify a bit and maybe add space for some common action somewhere.

-   IDEA: Maybe add the ability to edit the "RAW data" as for markdown blocks (should this be
    JSON for tensors?)

    It would be cool to have a new language for entering data (also used for computations), something based on S-Expressions or M-Expressions... (json is too verbose and js itself imposes performance problems)

-   QUESTION: Should every tensor have a name to use for referencing elsewhere? It looks like a good idea even for the outline pane.

-   QUESTION: How to handle other _file type_ and non-textual content inside tensor cells?

    It would be cool to have something completely generic and arbitrarily recursive, for example one could even put a tensor inside a tensor cell (or even a list of tensors inside a tensor cell)

    Lists can be implemented as a special type that is more dynamic while tensors would be more "static" objects. Otherwise lists could just be one dimensional tensors and the GUI changes a bit in this case to simplify interaction (?) Actually it should already be simply to insert new cells/rows/columns inside tensors.

-   The concept of "merge cells" should die as it is generally used to make multidimensional tables (and that is already covered). Lists inside tensor cells should be clearly distinguishable from the cell border to avoid confusion and always show the algebraic structure of content

-   IDEA: An interesting thing is the concept of "set" or "list without duplicates", the name is "DataSheet" so this could actually be a play ground for direct interactions with data structures

-   IDEA: A "showcase video" of a spreadsheet where cells can also be tables and the `SUM` operation works recursively and there is also a `MATRIX_TIMES` function to multiply matrices.

-   Structs are just 1-dimensional tensors with named cells, so a generic tensor could just be `Tensor[any]`

    ```go
    type Tensor[T any] struct {
        DimensionNames      []string    // can be empty to make unnamed
        DimensionValueNames [][]string  // can be empty to make unnamed

        Shape []uint
        Data  []T
    }
    ```

    then a struct is just

    ```go
    treeNode := Tensor[any]{
        DimensionNames: []string{}, // unnamed single axis
        DimensionValueNames: [][]string{{"Value", "Children"}}, // single axis, two cells addressable by name (or also by index)

        Shape: []uint{2}, // one dimension of size 2, two cells in total
        Data: []any{"Lorem ipsum", ...}
    }
    ```

-   IDEA: Everything is a tensor? One axis means "list" or "struct" and even markdown (text nodes) are represented as tensors? JSON can be mapped to tensors using just the concept of lists and struct...

## License

MIT
