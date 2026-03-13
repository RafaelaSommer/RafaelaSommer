const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { DateTime } = require("luxon");
const { readCache, writeCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const activityDir = path.join(ROOT, "activity");

// Mensagem aleatória
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

// Cria arquivo de atividade
function createActivityFile() {
  if (!fs.existsSync(activityDir)) fs.mkdirSync(activityDir, { recursive: true });
  const file = path.join(activityDir, `activity-${Date.now()}.md`);
  const now = DateTime.now().toISO();
  fs.writeFileSync(file, `# Activity Log\n\nAtualização automática.\n\nTimestamp: ${now}\n`);
  return file;
}

// Commit e push
function commit(file) {
  try {
    execSync(`git add ${file}`, { cwd: ROOT });
    execSync(`git commit -m "${randomMessage()}"`, { cwd: ROOT, stdio: "inherit" });
    execSync("git push origin HEAD", { cwd: ROOT, stdio: "inherit" });
    console.log("🚀 Commit automático realizado");
  } catch {
    console.log("⚠️ Commit não realizado");
  }
}

// Controla execução respeitando intervalo
function main() {
  const cache = readCache();
  const now = Date.now();
  const lastActivity = cache.lastActivity || 0;

  if (now - lastActivity < 3 * 60 * 1000) {
    console.log("⏳ Intervalo mínimo ainda não atingido para criar atividade");
    return;
  }

  const file = createActivityFile();
  commit(file);

  // Atualiza cache
  cache.lastActivity = now;
  writeCache(cache);
}

main();