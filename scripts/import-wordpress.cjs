#!/usr/bin/env node

/**
 * Import WordPress WXR XML -> Astro MDX pages + basic navigation.
 *
 * Usage:
 *   node scripts/import-wordpress.js hi-cyclesgroup.WordPress.2026-09-01.xml
 */

const fs = require("fs");
const path = require("path");

const input = process.argv[2] || "hi-cyclesgroup.WordPress.2026-09-01.xml";
const repoRoot = process.cwd();
const inputPath = path.resolve(repoRoot, input);

if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

const xml = fs.readFileSync(inputPath, "utf8");

// --- tiny helpers ------------------------------------------------------------
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

// Remove obvious WP/import artifacts that shouldn't be page content
function cleanHtml(html) {
  let out = html || "";
  out = out.replace(/<\!--[\s\S]*?-->/g, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  // keep content mostly intact (Astro MDX can render HTML)
  return out.trim();
}

function toMdxFrontmatter(page, route) {
  return `---
title: "${(page.title || "").replace(/"/g, '\\"')}"
slug: "${page.slug}"
originalLink: "${page.link || ""}"
wordpressId: ${page.id}
route: "${route}"
---`;
}

// --- parse <item> blocks -----------------------------------------------------
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
  const content = cleanHtml(getTag(block, "content:encoded"));
  const link = getTag(block, "link");
  const menuOrder = Number(getTag(block, "wp:menu_order") || 0);

  pages.push({ id, parentId, title, slug, content, link, menuOrder });
}

if (!pages.length) {
  console.error("❌ No published WordPress pages found in XML.");
  process.exit(1);
}

// index by id
const byId = new Map(pages.map((p) => [p.id, p]));

// compute hierarchical route from parents
function buildRoute(page) {
  const seen = new Set();
  const parts = [page.slug];
  let cur = page;
  while (cur.parentId && byId.has(cur.parentId) && !seen.has(cur.parentId)) {
    seen.add(cur.parentId);
    cur = byId.get(cur.parentId);
    parts.unshift(cur.slug);
  }
  const route = "/" + parts.filter(Boolean).join("/");
  return route.replace(/\/+/g, "/");
}

const withRoutes = pages.map((p) => ({ ...p, route: buildRoute(p) }));

// write pages
const pagesDir = path.join(repoRoot, "src", "pages");
fs.mkdirSync(pagesDir, { recursive: true });

let written = 0;
for (const p of withRoutes) {
  // /foo/bar -> src/pages/foo/bar.mdx ; root-ish "home" can stay /home unless you remap manually
  const rel = p.route.replace(/^\//, "");
  const outPath = path.join(pagesDir, `${rel}.mdx`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const body = p.content || `<p>${p.title}</p>`;
  const mdx = `${toMdxFrontmatter(p, p.route)}\n\n${body}\n`;
  fs.writeFileSync(outPath, mdx, "utf8");
  written += 1;
}

// generate simple top-nav: top-level pages sorted by menu_order then title
const top = withRoutes
  .filter((p) => !p.parentId || !byId.has(p.parentId))
  .sort((a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title));

const navTsPath = path.join(repoRoot, "src", "data", "navigation.ts");
fs.mkdirSync(path.dirname(navTsPath), { recursive: true });

const navTs = `export type NavItem = { title: string; href: string };

export const mainNav: NavItem[] = [
${top.map((p) => `  { title: ${JSON.stringify(p.title)}, href: ${JSON.stringify(p.route)} },`).join("\n")}
];
`;

fs.writeFileSync(navTsPath, navTs, "utf8");

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

console.log(`✅ Imported ${written} pages to src/pages`);
console.log(`✅ Wrote navigation: src/data/navigation.ts`);
console.log(`✅ Wrote report: wordpress-import-report.json`);
