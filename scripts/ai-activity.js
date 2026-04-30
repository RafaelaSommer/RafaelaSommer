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

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function syncRepo() {
  try {
    run("git pull origin main --rebase");
  } catch {
    console.log("⚠️ Pull falhou");
  }
}

function commit(file) {
  try {
    syncRepo();

    run(`git add "${file}"`);
    run(`git commit --allow-empty -m "${randomAIMessage()}"`);
    run("git push origin main");

    console.log("✅ AI Activity commit realizado!");
  } catch {
    console.log("⚠️ Commit AI não realizado");
  }
}

function main() {
  const cache = readCache();
  const now = Date.now();

  if (now - (cache.lastAI || 0) < 5 * 60 * 1000) return;

  const file = createAIFile();

  cache.lastAI = now;
  writeCache(cache);

  commit(file);
}

main();