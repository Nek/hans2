import { defineConfig } from "@farmfe/core";
import preact from "@preact/preset-vite";
import react from '@farmfe/plugin-react'

export default defineConfig({
  plugins: [
    react({ runtime: 'automatic', refresh: true})
  ],
  // Options related to the compilation
  compilation: {
    sourcemap: false,
    partialBundling: {
      enforceResources: [
        {
          name: 'index',
          test: ['.+'],
        }
      ]
    },
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