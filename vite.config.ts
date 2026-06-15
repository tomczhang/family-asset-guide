import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// viteSingleFile 会把内联的大 <script> 放进 <head>，排在 body 的 #root 之前，
// 导致浏览器必须下载完整段脚本才解析到首屏加载占位（白屏）。把它移到 </body>
// 之前，让 #root 里的 loader 先渲染，脚本随后加载执行。
function moveScriptToBodyEnd(): Plugin {
  return {
    name: "move-script-to-body-end",
    enforce: "post",
    apply: "build",
    generateBundle(_options, bundle) {
      const html = bundle["index.html"];
      if (html && html.type === "asset" && typeof html.source === "string") {
        const match = html.source.match(/<script type="module"[^>]*>[\s\S]*?<\/script>/);
        if (match) {
          const without = html.source.replace(match[0], "");
          html.source = without.replace("</body>", `    ${match[0]}\n  </body>`);
        }
      }
    },
  };
}

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
  plugins: [react(), viteSingleFile(), cspPlugin(), moveScriptToBodyEnd()],
  build: {
    target: "es2020",
    reportCompressedSize: true,
  },
});
