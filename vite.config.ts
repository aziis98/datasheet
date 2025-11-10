import preact from "@preact/preset-vite"
import { cssExtractPlugin } from "preact-css-extract/plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [tsconfigPaths(), cssExtractPlugin(), preact()],
})
