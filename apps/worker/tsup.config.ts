import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  esbuildOptions(options) {
    options.alias = {
      ...(options.alias ?? {}),
      "@ai-site/content": path.resolve(
        __dirname,
        "../../packages/content/src/index.ts",
      ),
      "@ai-site/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
    };
  },
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  target: "node20",
});
