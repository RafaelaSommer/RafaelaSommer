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
  } catch {
    console.warn("⚠️ Erro ao ler settings.json, usando padrão.");
  }
}

// =====================
// 🔍 DETECT REPO TYPE
// =====================
function detectType() {
  if (SETTINGS.type) return SETTINGS.type;

  const hasProfile = fs.existsSync(path.join(ROOT, "scripts", "index.js"));
  const hasEngine = fs.existsSync(path.join(ROOT, "src", "index.js"));

  if (hasProfile && !hasEngine) return "profile";
  if (hasEngine && !hasProfile) return "engine";

  if (hasProfile && hasEngine) {
    console.warn("⚠️ Ambos detectados. Usando 'profile'.");
    return "profile";
  }

  const repoName = path.basename(ROOT).toLowerCase();

  if (repoName.includes("profile")) return "profile";
  if (repoName.includes("updater")) return "profile";

  console.warn("⚠️ Não foi possível detectar. Usando 'profile'.");
  return "profile";
}

const TYPE = detectType();

// =====================
// ⏱ INTERVAL
// =====================
let interval = Number(SETTINGS.interval_minutes) || 20;

if (interval < 5) {
  console.warn("⚠️ Intervalo menor que 5. Ajustado para 5.");
  interval = 5;
}

// =====================
// 🛑 VALIDATION
// =====================
if (TYPE === "profile" && !fs.existsSync(path.join(ROOT, "scripts", "index.js"))) {
  console.error("❌ scripts/index.js não encontrado.");
  process.exit(1);
}

// =====================
// 🧠 WORKFLOW
// =====================
function createWorkflow() {
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

jobs:
  update:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: "npm"

      - name: Install deps
        run: npm install

      - name: Run updater
        run: node scripts/index.js
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Commit and push
        run: |
          git config user.name "${SETTINGS.gitUser}"
          git config user.email "${SETTINGS.gitEmail}"

          git add .

          git commit --allow-empty -m "🤖 auto update $(date +'%d/%m %H:%M:%S')"

          git push
`;
}

// =====================
// 📁 WRITE FILE
// =====================
const workflowDir = path.join(ROOT, ".github", "workflows");

fs.mkdirSync(workflowDir, { recursive: true });

fs.writeFileSync(
  path.join(workflowDir, "update-readme.yml"),
  createWorkflow().trim() + "\n"
);

// =====================
// ✅ LOG
// =====================
console.log("✅ Workflow criado!");
console.log(`📦 Tipo: ${TYPE}`);
console.log(`⏱ Intervalo: ${interval} min`);