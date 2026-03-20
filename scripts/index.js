#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { DateTime } = require("luxon");
const { execSync } = require("child_process");
const generateDashboard = require("./generate-dashboard");

const ROOT = path.join(__dirname, "..");
const SETTINGS = JSON.parse(
  fs.readFileSync(path.join(ROOT, ".github/settings.json"), "utf8")
);

const USER = SETTINGS.github_user;
const TIMEZONE = SETTINGS.timezone;
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("❌ GITHUB_TOKEN não encontrado");
  process.exit(1);
}

// 🔧 Configura git
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

// 🌐 Busca dados do GitHub
async function fetchGitHub() {
  const query = `
    query {
      user(login:"${USER}") {
        followers {
          totalCount
        }
        repositories(first:100) {
          nodes {
            name
            stargazerCount
            primaryLanguage { name }
          }
        }
      }
    }
  `;

  const res = await axios.post(
    "https://api.github.com/graphql",
    { query },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );

  return res.data.data.user;
}

// 💾 Commit + push FORÇADO
function commit() {
  try {
    execSync("git add .", { cwd: ROOT });

    const status = execSync("git status --porcelain", { cwd: ROOT }).toString();

    if (!status.trim()) {
      console.log("ℹ️ Nada mudou.");
      return false;
    }

    const now = DateTime.now().setZone(TIMEZONE);
    const msg = `🤖 README atualizado ${now.toFormat("HH:mm:ss")}`;

    execSync(`git commit -m "${msg}"`, { cwd: ROOT, stdio: "inherit" });

    // 🔥 PUSH SEM ERRO (FORCE + RETRY)
    try {
      execSync("git push origin HEAD --force", { cwd: ROOT, stdio: "inherit" });
    } catch {
      console.log("⚠️ Falha no push, tentando novamente...");
      execSync("git push origin HEAD --force", { cwd: ROOT, stdio: "inherit" });
    }

    return true;

  } catch (e) {
    console.error("❌ erro git:", e.message);
    return false;
  }
}

// 📝 Atualiza README
function updateReadme(stars, followers) {

  const templatePath = path.join(ROOT, "templates/README.template.md");
  const template = fs.readFileSync(templatePath, "utf8");

  const start = "<!--START_SECTION:dynamic-->";
  const end = "<!--END_SECTION:dynamic-->";

  const now = DateTime.now().setZone(TIMEZONE);
  const nextUpdate = now.plus({ minutes: SETTINGS.interval_minutes });

  const dynamicContent = `
⭐ **Total de Estrelas:** ${stars}

👥 **Seguidores:** ${followers}

🕒 **Última atualização:**  
${now.toFormat("dd/MM/yyyy HH:mm:ss")}

⏭ **Próxima atualização:**  
${nextUpdate.toFormat("dd/MM/yyyy HH:mm:ss")}
`;

  const newBlock = `${start}\n${dynamicContent}\n${end}`;

  const updated = template.replace(
    new RegExp(`${start}[\\s\\S]*${end}`),
    newBlock
  );

  fs.writeFileSync(path.join(ROOT, "README.md"), updated);
}

// 🚀 MAIN
async function main() {

  configureGit();

  const user = await fetchGitHub();

  const repos = user.repositories.nodes;
  const followers = user.followers.totalCount;

  const stars = repos.reduce((a, r) => a + r.stargazerCount, 0);

  const languages = {};

  repos.forEach(r => {
    const lang = r.primaryLanguage?.name;
    if (!lang) return;
    if (!languages[lang]) languages[lang] = 0;
    languages[lang]++;
  });

  generateDashboard({
    stars,
    followers,
    totalProjects: repos.length,
    languages,
    repos
  });

  updateReadme(stars, followers);

  const didCommit = commit();

  if (didCommit) {
    console.log("✅ Atualizado com sucesso!");
  } else {
    console.log("ℹ️ Nenhuma alteração.");
  }
}

main();