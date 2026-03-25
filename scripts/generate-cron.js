#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SETTINGS_PATH = path.join(ROOT, ".github", "settings.json");

// =====================
// 🔧 DEFAULT SETTINGS
// =====================
let SETTINGS = {
  gitUser: "RafaelaSommer",
  gitEmail: "camilaerafaelagoncalves@hotmail.com",
  interval_minutes: 20,
  type: null // "profile" | "engine"
};

// =====================
// 📥 LOAD SETTINGS
// =====================
if (fs.existsSync(SETTINGS_PATH)) {
  try {
    SETTINGS = {
      ...SETTINGS,
      ...JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"))
    };
  } catch (e) {
    console.warn("⚠️ Erro ao ler settings.json, usando padrão.");
  }
}

// =====================
// 🔍 DETECT REPO TYPE
// =====================
function detectType() {
  if (SETTINGS.type) return SETTINGS.type;

  if (fs.existsSync(path.join(ROOT, "scripts", "index.js"))) {
    return "profile";
  }

  if (fs.existsSync(path.join(ROOT, "src", "index.js"))) {
    return "engine";
  }

  // fallback: nome da pasta
  const repoName = path.basename(ROOT).toLowerCase();

  if (repoName.includes("profile")) return "profile";
  if (repoName.includes("updater")) return "engine";

  console.warn("⚠️ Não foi possível detectar o tipo. Usando 'profile' por padrão.");
  return "profile";
}

const TYPE = detectType();

// =====================
// ⏱ INTERVAL
// =====================
let interval = Number(SETTINGS.interval_minutes) || 20;

if (interval < 5) {
  console.warn("⚠️ Intervalo menor que 5 minutos. Ajustado para 5.");
  interval = 5;
}

// =====================
// 🧠 WORKFLOW FACTORY
// =====================
function createWorkflow() {
  if (TYPE === "engine") {
    return `
name: ⚙️ Auto Updater Engine

on:
  schedule:
    - cron: "*/${interval} * * * *"
  workflow_dispatch:

concurrency:
  group: engine-update
  cancel-in-progress: true

permissions:
  contents: write

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  update:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v5

      - name: Setup Node
        uses: actions/setup-node@v5
        with:
          node-version: 22

      - name: Install deps
        run: npm install

      - name: Run engine
        run: node src/index.js

      - name: Commit changes
        run: |
          git config user.name "${SETTINGS.gitUser}"
          git config user.email "${SETTINGS.gitEmail}"

          git add .

          if git diff --cached --quiet; then
            echo "No changes"
          else
            git commit -m "⚙️ auto update engine"
            git push
          fi
`;
  }

  // PROFILE
  return `
name: 🤖 Update Profile

on:
  schedule:
    - cron: "*/${interval} * * * *"
  workflow_dispatch:

concurrency:
  group: profile-update
  cancel-in-progress: true

permissions:
  contents: write

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  update:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout profile repo
        uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v5
        with:
          node-version: 22

      - name: Install deps
        run: npm install axios luxon dotenv

      - name: Run updater
        run: node scripts/index.js
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Commit and push
        run: |
          git config user.name "${SETTINGS.gitUser}"
          git config user.email "${SETTINGS.gitEmail}"

          git add .

          if git diff --cached --quiet; then
            echo "No changes"
          else
            git commit -m "🤖 profile auto update"
            git push
          fi
`;
}

// =====================
// 📁 WRITE FILE
// =====================
const workflowDir = path.join(ROOT, ".github", "workflows");

fs.mkdirSync(workflowDir, { recursive: true });

const fileName =
  TYPE === "engine" ? "engine.yml" : "update-readme.yml";

fs.writeFileSync(
  path.join(workflowDir, fileName),
  createWorkflow().trim() + "\n"
);

// =====================
// ✅ LOG
// =====================
console.log("✅ Workflow criado com sucesso!");
console.log(`📦 Tipo detectado: ${TYPE}`);
console.log(`⏱ Intervalo: ${interval} minutos`);