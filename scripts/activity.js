#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { DateTime } = require("luxon");
const { readCache, writeCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const ACTIVITY_DIR = path.join(ROOT, "activity");

const MESSAGES = [
  "✨ Atualização de projeto",
  "🐛 Correção de bug",
  "🚀 Melhorias de performance",
  "🧠 Refatoração de código",
  "📦 Atualizando dependências",
  "📊 Ajustes no dashboard",
  "⚡ Otimizações internas"
];

function randomMessage() { return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]; }
function createActivityFile() {
  if (!fs.existsSync(ACTIVITY_DIR)) fs.mkdirSync(ACTIVITY_DIR, { recursive: true });
  const file = path.join(ACTIVITY_DIR, `activity-${Date.now()}.md`);
  const now = DateTime.now().toISO();
  fs.writeFileSync(file, `# Activity Log\n\nAtividade automática.\n\nTimestamp: ${now}\n`);
  return file;
}

function commit(file) {
  try {
    execSync(`git add ${file}`, { cwd: ROOT });
    execSync(`git commit -m "${randomMessage()}"`, { cwd: ROOT, stdio: "inherit" });
    execSync("git push origin HEAD", { cwd: ROOT, stdio: "inherit" });
  } catch { console.log("⚠️ Commit não realizado"); }
}

function main() {
  const cache = readCache();
  const now = Date.now();
  if (now - (cache.lastActivity || 0) < 3 * 60 * 1000) return;
  const file = createActivityFile();
  commit(file);
  cache.lastActivity = now;
  writeCache(cache);
}

main();