import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname);
const outputDirectory = resolve(root, "dist/server");
const [html, css, javascript] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "style.css"), "utf8"),
  readFile(resolve(root, "script.js"), "utf8")
]);

const worker = `
const files = {
  "/": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/index.html": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/style.css": { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" },
  "/script.js": { body: ${JSON.stringify(javascript)}, type: "text/javascript; charset=utf-8" }
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const file = files[url.pathname];
    if (!file) {
      return new Response("Страницата не е намерена. Вероятно е на гише 7.", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }
    return new Response(file.body, {
      headers: {
        "content-type": file.type,
        "cache-control": url.pathname === "/" || url.pathname === "/index.html" ? "no-cache" : "public, max-age=3600",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer"
      }
    });
  }
};
`;

await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "index.js"), worker, "utf8");
console.log("Built plain HTML/CSS/JS site for deployment.");
