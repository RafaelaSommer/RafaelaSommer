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
  fs.readFileSync(
    path.join(ROOT, ".github/settings.json"),
    "utf8"
  )
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

    execSync(
      `git config user.name "${SETTINGS.gitUser}"`,
      { cwd: ROOT }
    );

    execSync(
      `git config user.email "${SETTINGS.gitEmail}"`,
      { cwd: ROOT }
    );

    const repo =
      `https://${TOKEN}@github.com/${USER}/${USER}.git`;

    execSync(
      `git remote set-url origin ${repo}`,
      { cwd: ROOT }
    );

  } catch {

    console.log("git já configurado");

  }

}

// 🔄 Sincroniza repositório
function syncRepo() {

  try {

    execSync(
      "git pull origin main --rebase",
      {
        cwd: ROOT,
        stdio: "inherit"
      }
    );

  } catch {

    console.log(
      "⚠️ erro no pull (ignorado)"
    );

  }

}

// 🌐 Busca dados GitHub
async function fetchGitHub() {

  console.log(
    "🌐 Buscando dados do GitHub..."
  );

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

            primaryLanguage {
              name
            }

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
        Authorization: `Bearer ${TOKEN}`
      }
    }

  );

  return res.data.data.user;

}

// 📝 Atualiza README
function updateReadme() {

  const templatePath =
    path.join(
      ROOT,
      "templates/README.template.md"
    );

  const template =
    fs.readFileSync(
      templatePath,
      "utf8"
    );

  const start =
    "<!--START_SECTION:dynamic-->";

  const end =
    "<!--END_SECTION:dynamic-->";

  const now =
    DateTime.now()
      .setZone(TIMEZONE);

  // ⏭ Próxima atualização
  const nextUpdate =
    now.plus({
      minutes:
        SETTINGS.interval_minutes || 30
    });

  const content = `
🕒 Última atualização: ${now.toFormat("dd/MM/yyyy HH:mm:ss")}

⏭ Próxima atualização: ${nextUpdate.toFormat("dd/MM/yyyy HH:mm:ss")}
`;

  const newBlock =
    `${start}\n${content}\n${end}`;

  const updated =
    template.replace(

      new RegExp(
        `${start}[\\s\\S]*${end}`
      ),

      newBlock

    );

  fs.writeFileSync(
    path.join(ROOT, "README.md"),
    updated
  );

}

// 🚀 Commit automático
function commit() {

  try {

    syncRepo();

    execSync(
      "git add .",
      { cwd: ROOT }
    );

    execSync(
      `git commit --allow-empty -m "🤖 update ${Date.now()}"`,
      {
        cwd: ROOT,
        stdio: "inherit"
      }
    );

    execSync(
      "git push origin main",
      {
        cwd: ROOT,
        stdio: "inherit"
      }
    );

    console.log(
      "🚀 Commit realizado com sucesso!"
    );

  } catch (e) {

    console.error(
      "❌ erro git:",
      e.message
    );

  }

}

// 🧠 MAIN
async function main() {

  configureGit();

  const user =
    await fetchGitHub();

  const repos =
    user.repositories.nodes;

  const followers =
    user.followers.totalCount;

  const stars =
    repos.reduce(
      (a, r) =>
        a + r.stargazerCount,
      0
    );

  // 💻 Linguagens
  const languages = {};

  repos.forEach(r => {

    const lang =
      r.primaryLanguage?.name;

    if (!lang)
      return;

    if (!languages[lang]) {

      languages[lang] = 0;

    }

    languages[lang]++;

  });

  // 📊 Dashboard SVG
  generateDashboard({

    stars,
    followers,
    languages,
    repos

  });

  // 📝 Atualiza README
  updateReadme();

  // 🚀 Push automático
  commit();

  console.log(
    "✅ Finalizado com sucesso!"
  );

}

main();