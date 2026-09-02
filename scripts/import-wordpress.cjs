#!/usr/bin/env node

/**
 * Import WordPress WXR XML -> Astro .astro pages + basic navigation.
 *
 * Usage:
 *   node scripts/import-wordpress.cjs hi-cyclesgroup.WordPress.2026-09-01.xml
 */

const fs = require("node:fs");
const path = require("node:path");

const input = process.argv[2] || "hi-cyclesgroup.WordPress.2026-09-01.xml";
const repoRoot = process.cwd();
const inputPath = path.resolve(repoRoot, input);

if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

const xml = fs.readFileSync(inputPath, "utf8");

// ---------------- helpers ----------------
const decode = (s = "") =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const getTag = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return m ? decode(m[1]) : "";
};

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";

function sanitizeHtml(html) {
  let out = html || "";

  // Remove comments/scripts/styles
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Common WP malformed HTML fixes
  out = out.replace(/<\/br\s*>/gi, "");         // invalid closing br
  out = out.replace(/<br>/gi, "<br />");        // XHTML-style self-close
  out = out.replace(/<hr>/gi, "<hr />");
  out = out.replace(/<img([^>]*?)(?<!\/)>/gi, "<img$1 />");

  // Remove empty paragraphs
  out = out.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");

  // Normalize weird nested line breaks before p close
  out = out.replace(/<br\s*\/?>\s*<\/p>/gi, "</p>");

  // Some WP exports include non-breaking spaces in empty blocks
  out = out.replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, "");

  return out.trim();
}

function escTemplateLiteral(s) {
  return (s || "").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function toAstroPage({ title, html }) {
  const safeTitle = (title || "Untitled").replace(/"/g, '\\"');
  const safeHtml = escTemplateLiteral(html || "");

  return `---
import Layout from "../layouts/Layout.astro";
const title = "${safeTitle}";
const html = \`${safeHtml}\`;
---

<Layout title={title}>
  <main class="content">
    <article set:html={html} />
  </main>
</Layout>
`;
}

// ---------------- parse items ----------------
const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

const pages = [];
for (const block of itemBlocks) {
  const postType = getTag(block, "wp:post_type");
  const status = getTag(block, "wp:status");

  if (postType !== "page") continue;
  if (status && status !== "publish" && status !== "private") continue;

  const id = Number(getTag(block, "wp:post_id") || 0);
  const parentId = Number(getTag(block, "wp:post_parent") || 0);
  const title = getTag(block, "title");
  const slug = getTag(block, "wp:post_name") || slugify(title);
  const rawContent = getTag(block, "content:encoded");
  const content = sanitizeHtml(rawContent);
  const link = getTag(block, "link");
  const menuOrder = Number(getTag(block, "wp:menu_order") || 0);

  pages.push({ id, parentId, title, slug, content, link, menuOrder });
}

if (!pages.length) {
  console.error("❌ No published/private WordPress pages found.");
  process.exit(1);
}

// index by id
const byId = new Map(pages.map((p) => [p.id, p]));

function buildRoute(page) {
  const seen = new Set();
  const parts = [page.slug];
  let cur = page;

  while (cur.parentId && byId.has(cur.parentId) && !seen.has(cur.parentId)) {
    seen.add(cur.parentId);
    cur = byId.get(cur.parentId);
    parts.unshift(cur.slug);
  }

  let route = "/" + parts.filter(Boolean).join("/");
  route = route.replace(/\/+/g, "/");

  // Common home aliases -> root
  if (["/home", "/homepage", "/welcome", "/index"].includes(route.toLowerCase())) {
    route = "/";
  }

  return route;
}

const withRoutes = pages.map((p) => ({ ...p, route: buildRoute(p) }));

// ensure unique routes
const used = new Map();
for (const p of withRoutes) {
  const base = p.route;
  if (!used.has(base)) {
    used.set(base, 1);
  } else {
    const n = used.get(base);
    p.route = `${base}-${n + 1}`;
    used.set(base, n + 1);
  }
}

// write files
const pagesDir = path.join(repoRoot, "src", "pages");
fs.mkdirSync(pagesDir, { recursive: true });

let written = 0;
for (const p of withRoutes) {
  const rel = p.route === "/" ? "index" : p.route.replace(/^\//, "");
  const outPath = path.join(pagesDir, `${rel}.astro`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const file = toAstroPage({
    title: p.title || p.slug || "Untitled",
    html: p.content || `<p>${p.title || p.slug}</p>`,
  });

  fs.writeFileSync(outPath, file, "utf8");
  written++;
}

// nav
const top = withRoutes
  .filter((p) => !p.parentId || !byId.has(p.parentId))
  .sort((a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title));

const navPath = path.join(repoRoot, "src", "data", "navigation.ts");
fs.mkdirSync(path.dirname(navPath), { recursive: true });

const nav = `export type NavItem = { title: string; href: string };

export const mainNav: NavItem[] = [
${top.map((p) => `  { title: ${JSON.stringify(p.title || p.slug)}, href: ${JSON.stringify(p.route)} },`).join("\n")}
];
`;
fs.writeFileSync(navPath, nav, "utf8");

// report
const reportPath = path.join(repoRoot, "wordpress-import-report.json");
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      source: input,
      generatedAt: new Date().toISOString(),
      pageCount: withRoutes.length,
      pages: withRoutes.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        parentId: p.parentId,
        route: p.route,
      })),
    },
    null,
    2
  ),
  "utf8"
);

console.log(`✅ Imported ${written} pages to src/pages/*.astro`);
console.log(`✅ Wrote src/data/navigation.ts`);
console.log(`✅ Wrote wordpress-import-report.json`);
