import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";

hljs.registerLanguage("python", python);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
let source = path.resolve(root, "../python/notebooks/math-post.md");
let output = path.join(root, "drafts/math-post.html");
let watch = false;
let publish = false;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--watch") watch = true;
  else if (args[i] === "--publish") publish = true;
  else if (args[i] === "--input" && args[i + 1]) source = path.resolve(args[++i]);
  else if (args[i] === "--output" && args[i + 1]) output = path.resolve(args[++i]);
  else throw new Error(`Unknown or incomplete option: ${args[i]}`);
}
const outputDir = path.dirname(output);
const sourceDir = path.dirname(source);
if (!output.startsWith(root + path.sep)) throw new Error("Output must stay inside the website directory");

const mathOptions = { throwOnError: true, trust: false, strict: "error", output: "htmlAndMathml" };
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(code, language) {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    }
    return "";
  },
}).use(texmath, {
  engine: katex, delimiters: "dollars", katexOptions: mathOptions,
});
markdown.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n';
markdown.renderer.rules.table_close = () => '</table></div>\n';
const escape = markdown.utils.escapeHtml;
const relativeUrl = (target) => path.relative(outputDir, path.join(root, target)).split(path.sep).join("/");
let watchedImages = [];

function visit(tokens, fn) {
  for (const token of tokens) {
    fn(token);
    if (token.children) visit(token.children, fn);
  }
}

function page(title, content) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>${escape(title)} — Tarun Trivedi</title>
    <link rel="stylesheet" href="${relativeUrl("styles.css")}">
    <link rel="stylesheet" href="${relativeUrl("post.css")}">
    <link rel="stylesheet" href="katex/katex.min.css">
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="${relativeUrl("index.html")}">Home</a></li>
        <li><a href="${relativeUrl("writing.html")}" aria-current="page">Blog</a></li>
        <li><a href="${relativeUrl("readings.html")}">Readings</a></li>
        <li><a href="${relativeUrl("photography.html")}">Nature</a></li>
      </ul>
    </nav>
    <main id="main"><article class="post">${content}</article></main>
${publish ? `    <!-- Cloudflare Web Analytics -->
    <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "70282deafee34b30b616d829af0034f5"}'></script>
    <!-- End Cloudflare Web Analytics -->` : ""}
  </body>
</html>
`;
}

function writePage(html) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(output + ".tmp", html);
  fs.renameSync(output + ".tmp", output);
}

function build() {
  try {
    const tokens = markdown.parse(fs.readFileSync(source, "utf8"), {});
    const images = [];
    visit(tokens, (token) => {
      // The plugin catches KaTeX errors; validate explicitly so broken math cannot
      // silently produce a page that looks like it compiled successfully.
      if (token.type.startsWith("math_")) {
        katex.renderToString(token.content, { ...mathOptions, displayMode: token.block });
      }
      if (token.type !== "image") return;
      const src = token.attrGet("src");
      if (/^(https?:)?\/\//i.test(src)) return;
      const filename = decodeURIComponent(src.split(/[?#]/)[0]);
      const original = path.resolve(sourceDir, filename);
      const destination = path.resolve(outputDir, filename);
      if (!original.startsWith(sourceDir + path.sep) || !destination.startsWith(outputDir + path.sep)) {
        throw new Error("Keep local figures in a subfolder beside the Markdown file");
      }
      if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(filename)) throw new Error(`Unsupported figure: ${filename}`);
      images.push({ original, destination });
    });
    const heading = tokens.findIndex((token) => token.type === "heading_open" && token.tag === "h1");
    const title = heading >= 0 ? tokens[heading + 1].content : "Draft post";
    const content = markdown.renderer.render(tokens, markdown.options, {});
    fs.mkdirSync(outputDir, { recursive: true });
    fs.cpSync(path.join(root, "node_modules/katex/dist"), path.join(outputDir, "katex"), {
      recursive: true,
      filter: (entry) => fs.statSync(entry).isDirectory() || /\.(css|woff2?|ttf)$/.test(entry),
    });
    fs.copyFileSync(path.join(root, "node_modules/katex/LICENSE"), path.join(outputDir, "katex/LICENSE"));
    for (const image of images) {
      fs.mkdirSync(path.dirname(image.destination), { recursive: true });
      fs.copyFileSync(image.original, image.destination);
    }
    watchedImages = images.map((image) => image.original);
    writePage(page(title, content));
    console.log(`Built ${path.basename(output)} at ${new Date().toLocaleTimeString()}`);
    return true;
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    writePage(page("Draft needs a correction", `<h1>Draft needs a correction</h1><pre>${escape(error.message)}</pre><p>Fix the Markdown or equation, save, and refresh.</p>`));
    return false;
  }
}

const succeeded = build();
if (!watch && !succeeded) process.exitCode = 1;
if (watch) {
  // Polling also notices editor saves that replace the source file atomically.
  function signature() {
    return [source, ...watchedImages].map((filename) => {
      try {
        const stat = fs.statSync(filename);
        return `${filename}:${stat.mtimeMs}:${stat.size}`;
      } catch { return `${filename}:missing`; }
    }).join("|");
  }
  let previous = signature();
  setInterval(() => {
    const current = signature();
    if (current !== previous) {
      build();
      previous = signature();
    }
  }, 400);
  console.log(`Watching ${source}; save, then refresh the browser.`);
}
