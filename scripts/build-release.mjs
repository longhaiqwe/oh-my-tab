import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const newtabHtml = readFileSync("newtab.html", "utf8");
const backgroundSource = readFileSync("background.js", "utf8");
const version = manifest.version;
const zipPath = join("dist", `ohmytab-${version}.zip`);

const packageFiles = [
  "manifest.json",
  "newtab.html",
  "newtab.css",
  "newtab.js",
  "background.js",
  "provider-autosubmit.js",
  "chatgpt-autosubmit.js",
  "doubao-autosubmit.js",
  "kimi-autosubmit.js",
  "weread-scan-connect.js",
  "_locales",
  "src",
  "assets"
];

validateManifest(manifest);
mkdirSync("dist", { recursive: true });
rmSync(zipPath, { force: true });
execFileSync("zip", [
  "-r",
  zipPath,
  ...packageFiles,
  "-x",
  "*/.DS_Store",
  "*.DS_Store",
  "*.bak",
  "*.bak.*"
], { stdio: "inherit" });
execFileSync("unzip", ["-t", zipPath], { stdio: "inherit" });
console.log(`Release package ready: ${zipPath}`);

function validateManifest(data) {
  if (data.manifest_version !== 3) {
    throw new Error("Chrome Web Store release must use Manifest V3.");
  }
  if ((data.host_permissions || []).includes("<all_urls>")) {
    throw new Error("Release package must not request <all_urls>.");
  }

  const referencedFiles = [
    data.chrome_url_overrides?.newtab,
    data.background?.service_worker,
    ...Object.values(data.icons || {}),
    ...Object.values(data.action?.default_icon || {}),
    ...(data.content_scripts || []).flatMap((script) => script.js || []),
    ...(data.content_scripts || []).flatMap((script) => script.css || []),
    ...getHtmlScriptSources(newtabHtml),
    ...getImportScripts(backgroundSource)
  ].filter(Boolean);

  for (const file of referencedFiles) {
    if (!existsSync(file)) {
      throw new Error(`Manifest references a missing file: ${file}`);
    }
  }

  if (!existsSync(join("_locales", data.default_locale || "", "messages.json"))) {
    throw new Error(`Missing default locale messages for ${data.default_locale}.`);
  }

  for (const file of packageFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing package input: ${file}`);
    }
  }

  if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(data.version || "")) {
    throw new Error(`Invalid Chrome extension version: ${data.version}`);
  }

  if (basename(zipPath).includes(" ")) {
    throw new Error("Release package filename must not contain spaces.");
  }
}

function getHtmlScriptSources(html) {
  return Array.from(html.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/gi), (match) => {
    return match[1].split("?")[0];
  });
}

function getImportScripts(source) {
  return Array.from(source.matchAll(/importScripts\(([^)]+)\)/g)).flatMap((match) => {
    return Array.from(match[1].matchAll(/["']([^"']+)["']/g), (pathMatch) => pathMatch[1]);
  });
}
