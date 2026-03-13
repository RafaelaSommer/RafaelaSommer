#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { DateTime } = require("luxon");
const { readCache, writeCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const SETTINGS = JSON.parse(fs.readFileSync(path.join(ROOT, ".github/settings.json"), "utf8"));
const INTERVAL = SETTINGS.interval_minutes * 60000; // intervalo padrão
const ACTIVITY_DIR = path.join(ROOT, "activity");

// Mensagens aleatórias de AI Activity
const MESSAGES = [
  "🤖 IA analisando dados",
  "💡 Sugestão de melhoria automática",
  "⚡ Otimização AI executada",
  "📊 AI atualizou métricas",
  "🧠 Processamento inteligente concluído",
  "✨ Novas ideias geradas pelo AI"
];

// Escolhe mensagem aleatória
function randomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

// Cria arquivo de atividade AI
function createAIActivityFile() {
  if (!fs.existsSync(ACTIVITY_DIR)) fs.mkdirSync(ACTIVITY_DIR, { recursive: true });
  const file = path.join(ACTIVITY_DIR, `ai-activity-${Date.now()}.md`);
  const now = DateTime.now().toISO();
  fs.writeFileSync(file, `# AI Activity Log\n\nAtividade automática gerada pela IA.\n\nTimestamp: ${now}\n`);
  return file;
}

// Commit e push
function commit(file) {
  try {
    execSync(`git add ${file}`, { cwd: ROOT });
    execSync(`git commit -m "${randomMessage()}"`, { cwd: ROOT, stdio: "inherit" });
    execSync("git push origin HEAD", { cwd: ROOT, stdio: "inherit" });
    console.log("🚀 Commit AI Activity realizado");
  } catch {
    console.log("⚠️ Commit AI Activity não realizado");
  }
}

// Controla execução respeitando o intervalo
function main() {
  const cache = readCache();
  const now = Date.now();
  const lastAI = cache.lastAIActivity || 0;

  if (now - lastAI < INTERVAL) {
    console.log("⏳ Intervalo mínimo ainda não atingido para AI Activity");
    return;
  }

  const file = createAIActivityFile();
  commit(file);

  // Atualiza cache
  cache.lastAIActivity = now;
  writeCache(cache);
}

main();