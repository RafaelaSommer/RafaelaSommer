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

  console.error(
    "❌ GITHUB_TOKEN não encontrado"
  );

  process.exit(1);

}

// ⏱ Controle de intervalo
function shouldRun() {

  const file =
    path.join(
      ROOT,
      ".github/last-update.json"
    );

  const now = Date.now();

  // minutos -> ms
  const interval =
    (SETTINGS.interval_minutes || 30)
    * 60
    * 1000;

  // arquivo não existe
  if (!fs.existsSync(file)) {

    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          lastUpdate: now
        },
        null,
        2
      )
    );

    return true;

  }

  const data = JSON.parse(
    fs.readFileSync(file, "utf8")
  );

  const diff =
    now - data.lastUpdate;

  // ainda não chegou no intervalo
  if (diff < interval) {

    const remaining =
      Math.ceil(
        (interval - diff) / 60000
      );

    console.log(
      `⏳ Aguarde ${remaining} minuto(s)`
    );

    return false;

  }

  // atualiza timestamp
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        lastUpdate: now
      },
      null,
      2
    )
  );

  return true;

}

// 🔧 Configura Git
function configureGit() {

  try {

    execSync(
      `git config user.name "${SETTINGS.gitUser}"`,
      {
        cwd: ROOT
      }
    );

    execSync(
      `git config user.email "${SETTINGS.gitEmail}"`,
      {
        cwd: ROOT
      }
    );

    // ✅ sem token na URL
    const repo =
      `https://github.com/${USER}/${USER}.git`;

    execSync(
      `git remote set-url origin ${repo}`,
      {
        cwd: ROOT
      }
    );

  } catch (err) {

    console.error(
      "❌ erro ao configurar git:",
      err.message
    );

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

  } catch (err) {

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

  // ✅ valida erros da API
  if (res.data.errors) {

    throw new Error(
      JSON.stringify(
        res.data.errors,
        null,
        2
      )
    );

  }

  return res.data.data.user;

}

// 🔐 Escapa regex
function escapeRegex(str) {

  return str.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

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

  // ⏭ próxima atualização
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
        `${escapeRegex(start)}[\\s\\S]*${escapeRegex(end)}`
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
      {
        cwd: ROOT
      }
    );

    // ✅ verifica alterações
    const status =
      execSync(
        "git status --porcelain",
        {
          cwd: ROOT
        }
      )
      .toString();

    if (!status.trim()) {

      console.log(
        "🟡 Nenhuma alteração"
      );

      return;

    }

    execSync(
      `git commit -m "🤖 update ${Date.now()}"`,
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

  // ⏱ respeita interval_minutes
  if (!shouldRun()) {
    return;
  }

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

main().catch(err => {

  console.error(
    "❌ erro fatal:",
    err.message
  );

});