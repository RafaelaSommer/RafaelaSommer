#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { DateTime } = require("luxon");
const { execSync } = require("child_process");

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

// 🔧 Configura Git
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
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );

  return res.data.data.user;
}

// 📝 Atualiza README
function updateReadme(stars, followers) {
  const templatePath = path.join(ROOT, "templates/README.template.md");
  const template = fs.readFileSync(templatePath, "utf8");

  const start = "<!--START_SECTION:dynamic-->";
  const end = "<!--END_SECTION:dynamic-->";

  const now = DateTime.now().setZone(TIMEZONE);

  const content = `
⭐ **Total de Estrelas:** ${stars}

👥 **Seguidores:** ${followers}

🕒 ${now.toFormat("dd/MM/yyyy HH:mm:ss")}
`;

  const newBlock = `${start}\n${content}\n${end}`;

  const updated = template.replace(
    new RegExp(`${start}[\\s\\S]*${end}`),
    newBlock
  );

  fs.writeFileSync(path.join(ROOT, "README.md"), updated);
}

// 🚀 Commit
function commit() {
  try {
    execSync("git add .", { cwd: ROOT });

    const status = execSync("git status --porcelain", { cwd: ROOT }).toString();

    if (!status.trim()) {
      console.log("ℹ️ Nada mudou.");
      return;
    }

    execSync(`git commit -m "🤖 update"`, { cwd: ROOT });
    execSync("git push", { cwd: ROOT });

  } catch (e) {
    console.error("❌ erro git:", e.message);
  }
}

// 🧠 MAIN
async function main() {
  configureGit();

  const user = await fetchGitHub();

  const repos = user.repositories.nodes;
  const followers = user.followers.totalCount;

  const stars = repos.reduce((a, r) => a + r.stargazerCount, 0);

  updateReadme(stars, followers);
  commit();

  console.log("✅ Finalizado com sucesso!");
}

main();