#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { DateTime } = require("luxon");
const { execSync } = require("child_process");
const generateDashboard = require("./generate-dashboard");
const { readCache, writeCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const SETTINGS = JSON.parse(fs.readFileSync(path.join(ROOT, ".github/settings.json"), "utf8"));
const USER = SETTINGS.github_user;
const TIMEZONE = SETTINGS.timezone;
const INTERVAL = SETTINGS.interval_minutes * 60000;
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("❌ GITHUB_TOKEN não encontrado");
  process.exit(1);
}

// Configura Git local
function configureGit() {
  try {
    execSync(`git config user.name "${SETTINGS.gitUser}"`, { cwd: ROOT });
    execSync(`git config user.email "${SETTINGS.gitEmail}"`, { cwd: ROOT });
    const repo = `https://${TOKEN}@github.com/${USER}/${USER}.git`;
    execSync(`git remote set-url origin ${repo}`, { cwd: ROOT });
  } catch {
    console.log("git já configurado");
  }
}

// Checa se o intervalo mínimo passou
function checkInterval() {
  const cache = readCache();
  const last = cache.lastUpdate || 0;
  if (Date.now() - last < INTERVAL) return false;
  cache.lastUpdate = Date.now();
  writeCache(cache);
  return true;
}

// Busca dados do GitHub
async function fetchGitHub() {
  const query = `
    query {
      user(login:"${USER}") {
        repositories(first:100) {
          nodes { 
            name
            stargazerCount
            primaryLanguage { name }
          }
        }
      }
    }`;
  const res = await axios.post("https://api.github.com/graphql", { query }, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  return res.data.data.user;
}

// Commit e push
function commit() {
  try {
    execSync("git add .", { cwd: ROOT });
    const status = execSync("git status --porcelain", { cwd: ROOT }).toString();
    if (!status) return false;
    const msg = `🤖 README atualizado ${DateTime.now().toFormat("HH:mm:ss")}`;
    execSync(`git commit -m "${msg}"`, { cwd: ROOT, stdio: "inherit" });
    execSync("git push origin HEAD", { cwd: ROOT, stdio: "inherit" });
    return true;
  } catch (e) {
    console.error("erro git:", e.message);
    return false;
  }
}

// Atualiza o bloco dinâmico no README
function updateReadme(dynamicContent) {
  const templatePath = path.join(ROOT, "templates/README.template.md");
  const template = fs.readFileSync(templatePath, "utf8");
  const start = "<!--START_SECTION:dynamic-->";
  const end = "<!--END_SECTION:dynamic-->";
  const newBlock = `${start}\n${dynamicContent}\n${end}`;
  const updated = template.replace(new RegExp(`${start}[\\s\\S]*${end}`), newBlock);
  fs.writeFileSync(path.join(ROOT, "README.md"), updated);
}

// Main
async function main() {
  configureGit();
  if (!checkInterval()) {
    console.log("⏱ Intervalo mínimo ainda não atingido. Atualização ignorada.");
    return;
  }

  const now = DateTime.now().setZone(TIMEZONE);
  const nextUpdate = now.plus({ minutes: SETTINGS.interval_minutes });

  const user = await fetchGitHub();
  const repos = user.repositories.nodes;

  // Calcula total de estrelas e linguagens
  const stars = repos.reduce((a, r) => a + r.stargazerCount, 0);
  const languages = {};
  repos.forEach(r => {
    const lang = r.primaryLanguage?.name;
    if (!lang) return;
    if (!languages[lang]) languages[lang] = 0;
    languages[lang]++;
  });

  // Gera dashboard SVG completo
  generateDashboard({
    stars,
    totalProjects: repos.length,
    languages,
    repos
  });

  // Bloco dinâmico do README
  const dynamicContent = `
⭐ **Total de Estrelas:** ${stars}

🕒 **Última atualização (Horário de Brasília):**  
${now.toFormat("dd/MM/yyyy HH:mm:ss")}

⏭ **Próxima atualização (Horário de Brasília):**  
${nextUpdate.toFormat("dd/MM/yyyy HH:mm:ss")}
`;

  updateReadme(dynamicContent);
  console.log("📝 Bloco dinâmico do README atualizado localmente.");

  const didCommit = commit();
  if (didCommit) console.log("✅ README atualizado com sucesso e enviado ao GitHub! 🎉");
  else console.log("ℹ️ Nenhuma alteração para enviar, mas o bloco local foi atualizado.");
}

main();