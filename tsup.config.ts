import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  cjsInterop: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "rxjs", "@meshsdk/hydra"],
});
