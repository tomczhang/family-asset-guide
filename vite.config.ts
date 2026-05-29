import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

function cspPlugin(): Plugin {
  const cspTag = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self'; frame-src 'none'; object-src 'none';" />`;
  return {
    name: "inject-csp",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace("<!--CSP_PLACEHOLDER-->", cspTag);
      },
    },
    apply: "build",
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), cspPlugin()],
  build: {
    target: "es2020",
    reportCompressedSize: true,
  },
});
