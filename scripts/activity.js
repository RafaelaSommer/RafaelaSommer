#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { DateTime } = require("luxon");
const { readCache, writeCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const activityDir = path.join(ROOT, "activity");

function randomMessage() {
  const msgs = [
    "✨ Atualização de projeto",
    "🐛 Correção de bug",
    "🚀 Melhorias de performance",
    "🧠 Refatoração de código",
    "📦 Atualizando dependências",
    "📊 Ajustes no dashboard",
    "⚡ Otimizações internas"
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function createActivityFile() {
  if (!fs.existsSync(activityDir)) fs.mkdirSync(activityDir, { recursive: true });
  const file = path.join(activityDir, `activity-${Date.now()}.md`);
  const now = DateTime.now().toISO();
  fs.writeFileSync(file, `# Activity Log\n\nAtualização automática.\n\nTimestamp: ${now}\n`);
  return file;
}

function commit(file) {
  try {
    execSync(`git add ${file}`, { cwd: ROOT });
    execSync(`git commit -m "${randomMessage()}"`, { cwd: ROOT, stdio: "inherit" });
    execSync("git push origin HEAD", { cwd: ROOT, stdio: "inherit" });
    console.log("✅ Activity commit realizado com sucesso!");
  } catch (e) {
    console.log("⚠️ Commit de activity não realizado");
  }
}

function main() {
  const cache = readCache();
  const now = Date.now();
  if (now - (cache.lastActivity || 0) < 3 * 60 * 1000) return; // 3 min mínimo
  const file = createActivityFile();
  cache.lastActivity = now;
  writeCache(cache);
  commit(file);
}

main();