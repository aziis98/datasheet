# DataSheet

A modern web version of Lotus Improv with some features from AirTable in a clean and simple Google Sheets / VSCode style.

### Features

-   Manipulate and visualize multidimensional data

-   A sheet can be composed of various blocks

    -   **Markdown** blocks for text and LaTeX

    -   **Tensor** blocks for entering multidimensional data.

        Values can be

        -   _primitives_ as strings, numbers, rationals

        -   _references_ to link multiple tensors together in a sheet in a reactive fashion

        -   _files_ and other "multimedia" as in AirTable

    -   **Formulas** ca be

    -   **Plots** (WIP)

## Backend

Golang + Fiber + SQLite (with recent json features to use it as a document database)

## FrontEnd

ViteJS + Preact + Scss + ndarray

## TODOs / Ideas

-   Idea:

## License

MIT
