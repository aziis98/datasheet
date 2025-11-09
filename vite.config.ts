import preact from "@preact/preset-vite"
import { cssExtractPlugin } from "preact-css-extract/plugin"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [cssExtractPlugin(), preact()],
})
