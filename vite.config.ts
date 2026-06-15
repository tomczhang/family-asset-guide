import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function cspPlugin(): Plugin {
  const cspTag = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https://static.refly.ai https://fonts.gstatic.com; frame-src 'none'; object-src 'none';" />`;
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
  // GitHub Pages 部署在子路径下，用相对路径引用 asset，避免 /assets 404。
  base: "./",
  plugins: [react(), cspPlugin()],
  build: {
    target: "es2020",
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // react 单独成 vendor chunk，利于长期缓存；pdf-lib/fontkit 因仅被
        // 动态 import 引用，会自动拆成独立异步 chunk，不进首屏。
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
        },
      },
    },
  },
});
