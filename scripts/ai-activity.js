#!/usr/bin/env node
// Estrutura igual ao activity.js, mas você pode adicionar mensagens geradas por AI
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { DateTime } = require("luxon");
const { readCache, writeCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const aiDir = path.join(ROOT, "ai-activity");

function randomAIMessage() {
  const msgs = [
    "🤖 Sugestão de melhoria AI",
    "💡 Ideia nova gerada por AI",
    "🧠 Ajuste inteligente aplicado"
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function createAIFile() {
  if (!fs.existsSync(aiDir)) fs.mkdirSync(aiDir, { recursive: true });
  const file = path.join(aiDir, `ai-${Date.now()}.md`);
  const now = DateTime.now().toISO();
  fs.writeFileSync(file, `# AI Activity Log\n\n${randomAIMessage()}\nTimestamp: ${now}\n`);
  return file;
}

function commit(file) {
  try {
    execSync(`git add ${file}`, { cwd: ROOT });
    execSync(`git commit -m "${randomAIMessage()}"`, { cwd: ROOT, stdio: "inherit" });
    execSync("git push origin HEAD", { cwd: ROOT, stdio: "inherit" });
    console.log("✅ AI Activity commit realizado!");
  } catch {
    console.log("⚠️ Commit AI não realizado");
  }
}

function main() {
  const cache = readCache();
  const now = Date.now();
  if (now - (cache.lastAI || 0) < 5 * 60 * 1000) return; // 5 min mínimo
  const file = createAIFile();
  cache.lastAI = now;
  writeCache(cache);
  commit(file);
}

main();