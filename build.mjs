import * as esbuild from "esbuild"
import { solidPlugin } from "esbuild-plugin-solid"

await esbuild.build({
  entryPoints: ["src/tui.tsx"],
  outfile: "dist/tui.js",
  format: "esm",
  platform: "node",
  bundle: true,
  external: ["@opencode-ai/*", "@opentui/*", "solid-js", "node:*"],
  plugins: [solidPlugin({ solid: { moduleName: "@opentui/solid", generate: "universal" } })],
})
