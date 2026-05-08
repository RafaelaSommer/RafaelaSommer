#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { DateTime } = require("luxon");
const { execSync } = require("child_process");
const generateDashboard = require("./generate-dashboard");

const ROOT = path.join(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "github.json");

const SETTINGS = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, ".github/settings.json"),
    "utf8"
  )
);

const USER = SETTINGS.github_user;
const TIMEZONE = SETTINGS.timezone;
const TOKEN = process.env.GITHUB_TOKEN;
const CACHE_MINUTES = SETTINGS.cache_minutes || 10;

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

// 📦 Lê cache
function readCache() {

  try {

    if (!fs.existsSync(CACHE_FILE))
      return null;

    const raw =
      fs.readFileSync(CACHE_FILE, "utf8");

    const data = JSON.parse(raw);

    const now = DateTime.now();

    const saved =
      DateTime.fromISO(data.timestamp);

    const diff =
      now.diff(saved, "minutes").minutes;

    if (diff < CACHE_MINUTES) {

      console.log("⚡ Usando cache...");
      return data.payload;

    }

    return null;

  } catch {

    return null;

  }

}

// 💾 Salva cache
function writeCache(payload) {

  try {

    if (!fs.existsSync(CACHE_DIR)) {

      fs.mkdirSync(CACHE_DIR);

    }

    const data = {

      timestamp: DateTime.now().toISO(),
      payload

    };

    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify(data, null, 2)
    );

  } catch (e) {

    console.log(
      "erro ao salvar cache:",
      e.message
    );

  }

}

// 🌐 Busca dados do GitHub
async function fetchGitHub() {

  const cached = readCache();

  if (cached)
    return cached;

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
        Authorization:
          `Bearer ${TOKEN}`
      }
    }
  );

  const data =
    res.data.data.user;

  writeCache(data);

  return data;

}

// 📝 Atualiza README
function updateReadme() {

  const templatePath =
    path.join(
      ROOT,
      "templates/README.template.md"
    );

  const template =
    fs.readFileSync(templatePath, "utf8");

  const start =
    "<!--START_SECTION:dynamic-->";

  const end =
    "<!--END_SECTION:dynamic-->";

  const now =
    DateTime.now()
      .setZone(TIMEZONE);

  const dynamicContent = `
🕒 Última atualização: ${now.toFormat("dd/MM/yyyy HH:mm:ss")}
`;

  const newBlock =
    `${start}\n${dynamicContent}\n${end}`;

  const updated = template.replace(

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

    execSync(
      "git add .",
      { cwd: ROOT }
    );

    const now =
      DateTime.now()
        .setZone(TIMEZONE);

    const msg =
      `🤖 README atualizado ${now.toFormat("HH:mm:ss")}`;

    execSync(

      `git commit --allow-empty -m "${msg}"`,

      {
        cwd: ROOT,
        stdio: "inherit"
      }

    );

    execSync(
      "git push origin HEAD",
      {
        cwd: ROOT,
        stdio: "inherit"
      }
    );

    return true;

  } catch (e) {

    console.error(
      "erro git:",
      e.message
    );

    return false;

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

  generateDashboard({

    stars,
    followers,
    languages,
    repos

  });

  updateReadme();

  const didCommit =
    commit();

  if (didCommit)

    console.log(
      "✅ README atualizado com sucesso!"
    );

  else

    console.log(
      "ℹ️ Falha ao atualizar."
    );

}

main();