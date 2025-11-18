import preact from "@preact/preset-vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { cssExtractPlugin } from "./plugin/css-extract-v2"

export default defineConfig({
    build: {
        cssCodeSplit: false,
    },
    plugins: [tsconfigPaths(), cssExtractPlugin(), preact()],
})
