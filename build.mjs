import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname);
const outputDirectory = resolve(root, "dist/server");
const [html, css, javascript, teacherFace] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "style.css"), "utf8"),
  readFile(resolve(root, "script.js"), "utf8"),
  readFile(resolve(root, "assets/teacher-face.jpeg"))
]);

const worker = `
const teacherFaceBase64 = ${JSON.stringify(teacherFace.toString("base64"))};
const teacherFace = Uint8Array.from(atob(teacherFaceBase64), (character) => character.charCodeAt(0));
const files = {
  "/": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/index.html": { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" },
  "/style.css": { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" },
  "/script.js": { body: ${JSON.stringify(javascript)}, type: "text/javascript; charset=utf-8" },
  "/assets/teacher-face.jpeg": { body: teacherFace, type: "image/jpeg" }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const file = files[url.pathname];
    if (!file) {
      if (env && env.ASSETS && url.pathname.startsWith("/assets/")) {
        const asset = await env.ASSETS.fetch(request);
        if (asset.status !== 404) return asset;
      }
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
await mkdir(resolve(root, "dist/client/assets"), { recursive: true });
await writeFile(resolve(outputDirectory, "index.js"), worker, "utf8");
await copyFile(resolve(root, "assets/municipal-video.mp4"), resolve(root, "dist/client/assets/municipal-video.mp4"));
console.log("Built plain HTML/CSS/JS site for deployment.");
