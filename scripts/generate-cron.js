#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SETTINGS_PATH = path.join(ROOT, ".github", "settings.json");

if (!fs.existsSync(SETTINGS_PATH)) {
  console.error("❌ Arquivo .github/settings.json não encontrado.");
  process.exit(1);
}

let SETTINGS;

try {
  SETTINGS = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
} catch (error) {
  console.error("❌ Erro ao ler settings.json:", error.message);
  process.exit(1);
}

let interval = Number(SETTINGS.interval_minutes) || 20;

/*
GitHub Actions permite mínimo de 5 minutos
*/
if (interval < 5) {
  console.warn("⚠️ Intervalo menor que 5 minutos não é permitido. Ajustado para 5.");
  interval = 5;
}

const workflow = `
name: 🤖 Update README

on:
  schedule:
    - cron: "*/${interval} * * * *"
  workflow_dispatch:

# 🚀 evita conflito entre execuções simultâneas
concurrency:
  group: update-readme
  cancel-in-progress: true

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install deps
        run: npm install axios luxon dotenv

      - name: Run updater
        run: node scripts/index.js
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Commit and push
        run: |
          git config user.name "${SETTINGS.gitUser || "RafaelaSommer"}"
          git config user.email "${SETTINGS.gitEmail || "camilaerafaelagoncalves@hotmail.com"}"

          git add .

          if git diff --cached --quiet; then
            echo "No changes"
          else
            git commit -m "🤖 auto update"
            git push origin main --force
          fi
`;

const workflowDir = path.join(ROOT, ".github", "workflows");

fs.mkdirSync(workflowDir, { recursive: true });

fs.writeFileSync(
  path.join(workflowDir, "update-readme.yml"),
  workflow.trim() + "\n"
);

console.log(`✅ Workflow criado com sucesso.`);
console.log(`⏱ Intervalo configurado: ${interval} minutos`);