import { defineConfig } from "@farmfe/core";
import preact from "@preact/preset-vite";

export default defineConfig({
  // Options related to the compilation
  compilation: {
    input: {
      // can be a relative path or an absolute path
      index: "./index.html",
    },
    output: {
      path: "./build",
      publicPath: "/",
    },
  },
  // Options related to the dev server
  server: {
    port: 9000,
  },
  vitePlugins: [
    () => ({
      filters: ['.jsx$', '.js$'],
      vitePlugin: preact()
    })
  ]
});