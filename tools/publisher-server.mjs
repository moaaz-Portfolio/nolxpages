import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const PORT = Number(process.env.NOLX_PUBLISHER_PORT || 4173);
const TOKEN = process.env.NOLX_GITHUB_TOKEN || "";
const GITHUB_API = "https://api.github.com";
const MAX_BODY = 12 * 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

async function github(endpoint, options = {}) {
  const response = await fetch(GITHUB_API + endpoint, {
    method: options.method || "GET",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + TOKEN,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || ("GitHub API returned " + response.status));
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY) {
        reject(Object.assign(new Error("حجم الطلب أكبر من الحد المسموح (12 MB)."), { status: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch { reject(Object.assign(new Error("بيانات الطلب غير صالحة."), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

function requireLocalOrigin(req, res) {
  const origin = req.headers.origin;
  const expected = "http://" + HOST + ":" + PORT;
  if (origin && origin !== expected) {
    sendJson(res, 403, { error: "الطلب مسموح من نسخة NOLX المحلية فقط." });
    return false;
  }
  return true;
}

async function publishSite(repoName, html) {
  if (!TOKEN) throw Object.assign(new Error("لم يتم ضبط NOLX_GITHUB_TOKEN في PowerShell."), { status: 401 });
  if (!/^[a-zA-Z0-9._-]{1,90}$/.test(repoName)) {
    throw Object.assign(new Error("اسم المستودع غير صالح."), { status: 400 });
  }
  if (typeof html !== "string" || html.length < 30 || Buffer.byteLength(html) > 10 * 1024 * 1024) {
    throw Object.assign(new Error("ملف HTML فارغ أو أكبر من 10 MB."), { status: 400 });
  }

  const user = await github("/user");
  const owner = user.login;

  // A new repository is created for each published site. Existing repositories are never overwritten.
  const repo = await github("/user/repos", {
    method: "POST",
    body: {
      name: repoName,
      description: "Website published with NOLX PAGES",
      private: false,
      auto_init: true,
      has_issues: false,
      has_wiki: false
    }
  });

  const branch = repo.default_branch || "main";
  const refPath = "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repoName) +
    "/git/ref/heads/" + encodeURIComponent(branch);
  const baseRef = await github(refPath);
  const parentSha = baseRef.object.sha;
  const parentCommit = await github(
    "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repoName) +
    "/git/commits/" + encodeURIComponent(parentSha)
  );

  const publishableHtml = html.startsWith("<!doctype") || html.startsWith("<!DOCTYPE")
    ? html
    : "<!doctype html>\n" + html;
  const blob = await github(
    "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repoName) + "/git/blobs",
    { method: "POST", body: { content: publishableHtml, encoding: "utf-8" } }
  );
  const tree = await github(
    "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repoName) + "/git/trees",
    {
      method: "POST",
      body: {
        base_tree: parentCommit.tree.sha,
        tree: [{ path: "index.html", mode: "100644", type: "blob", sha: blob.sha }]
      }
    }
  );
  const commit = await github(
    "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repoName) + "/git/commits",
    {
      method: "POST",
      body: {
        message: "Publish website from NOLX PAGES",
        tree: tree.sha,
        parents: [parentSha]
      }
    }
  );
  await github(
    "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repoName) +
    "/git/refs/heads/" + encodeURIComponent(branch),
    { method: "PATCH", body: { sha: commit.sha, force: false } }
  );

  let pagesEnabled = true;
  let pages = null;
  let pagesError = "";
  const pagesEndpoint = "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repoName) + "/pages";
  try {
    pages = await github(pagesEndpoint, {
      method: "POST",
      body: { build_type: "legacy", source: { branch, path: "/" } }
    });
  } catch (error) {
    try {
      pages = await github(pagesEndpoint);
    } catch (_) {
      pagesEnabled = false;
      pagesError = error.message || "GitHub Pages could not be enabled automatically.";
    }
  }

  return {
    owner,
    repo: repoName,
    repoUrl: repo.html_url,
    pageUrl: pages?.html_url || ("https://" + owner.toLowerCase() + ".github.io/" + repoName + "/"),
    pagesEnabled,
    pagesError
  };
}

async function handleApi(req, res, pathname) {
  if (!requireLocalOrigin(req, res)) return;

  if (pathname === "/api/status" && req.method === "GET") {
    if (!TOKEN) return sendJson(res, 401, { ready: false, error: "NOLX_GITHUB_TOKEN is not set." });
    try {
      const user = await github("/user");
      return sendJson(res, 200, { ready: true, username: user.login });
    } catch (error) {
      return sendJson(res, error.status || 502, { ready: false, error: error.message });
    }
  }

  if (pathname === "/api/publish" && req.method === "POST") {
    try {
      const payload = await readJson(req);
      const repoName = String(payload.repoName || "").trim();
      const result = await publishSite(repoName, payload.html);
      return sendJson(res, 201, result);
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.message || "تعذر النشر." });
    }
  }

  return sendJson(res, 404, { error: "API route not found." });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", "http://" + HOST + ":" + PORT);
  if (requestUrl.pathname.startsWith("/api/")) {
    return handleApi(req, res, requestUrl.pathname);
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Method Not Allowed");
  }

  let pathname;
  try { pathname = decodeURIComponent(requestUrl.pathname); }
  catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }
  if (pathname === "/") pathname = "/index.html";

  const absolute = path.resolve(ROOT, "." + pathname);
  const blocked = /(^|[\\/])(?:\.git|\.github|tools|node_modules)(?:[\\/]|$)/i.test(pathname) ||
    /(^|[\\/])\.env(?:\.|$)/i.test(pathname);
  if (!absolute.startsWith(ROOT + path.sep) || blocked) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(absolute, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not Found");
    }
    const type = mimeTypes[path.extname(absolute).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(absolute).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log("\nNOLX local publisher is running at http://" + HOST + ":" + PORT);
  console.log("Open http://" + HOST + ":" + PORT + "/editor.html?id=1");
  console.log("GitHub token stays in this local Node.js process; it is not sent to the browser.\n");
});
