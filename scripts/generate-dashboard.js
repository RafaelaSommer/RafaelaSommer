#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");

const ROOT = path.join(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "assets");

const OUTPUT_MD = path.join(ASSETS_DIR, "dashboard.md");
const OUTPUT_JSON = path.join(ASSETS_DIR, "dashboard.json");
const OUTPUT_SVG = path.join(ASSETS_DIR, "dashboard.svg");

// 🎨 Barra visual
function bar(percent) {
  const total = 20;
  const filled = Math.round((percent / 100) * total);
  return "█".repeat(filled) + "░".repeat(total - filled);
}

// 🧠 Linguagens
function generateLanguages(languages) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);

  if (total === 0) return "Sem dados";

  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => {
      const percent = ((count / total) * 100).toFixed(1);
      return `- **${lang}** ${bar(percent)} ${percent}%`;
    })
    .join("\n");
}

// 📊 Insights simples (sem repos)
function generateInsights(data) {
  return {
    engagement: data.followers > 0
      ? (data.stars / data.followers).toFixed(2)
      : 0
  };
}

// 🎨 SVG
function generateSVG(data, insights, now) {
  return `
<svg width="600" height="320" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #58A6FF }
    .text { font: 14px sans-serif; fill: #C9D1D9 }
  </style>

  <rect width="100%" height="100%" fill="#0D1117"/>

  <text x="20" y="40" class="title">🚀 Dashboard</text>

  <text x="20" y="80" class="text">⭐ Estrelas: ${data.stars}</text>
  <text x="20" y="110" class="text">👥 Seguidores: ${data.followers}</text>
  <text x="20" y="140" class="text">📦 Projetos: ${data.totalProjects}</text>

  <text x="20" y="190" class="text">📊 Engajamento: ${insights.engagement}</text>

  <text x="20" y="260" class="text">🕒 Atualizado: ${now}</text>
</svg>
`;
}

// 🚀 Geração principal
function generateDashboard(data) {
  if (!data) {
    console.log("❌ Sem dados para gerar dashboard");
    return;
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    console.log("❌ Pasta 'assets' não existe. Crie manualmente.");
    return;
  }

  const now = DateTime.now().toFormat("dd/MM/yyyy HH:mm:ss");

  const insights = generateInsights(data);

  const content = `
## 🚀 Dashboard Automático

### ⭐ Estatísticas
- ⭐ **Estrelas totais:** ${data.stars}
- 👥 **Seguidores:** ${data.followers}
- 📦 **Projetos:** ${data.totalProjects}

---

### 🧠 Linguagens mais usadas
${generateLanguages(data.languages)}

---

### 📊 Insights
- 📈 Engajamento (stars/seguidores): **${insights.engagement}**

---

🕒 Atualizado em: ${now}
`;

  // 💾 salvar markdown
  fs.writeFileSync(OUTPUT_MD, content.trim());

  // 💾 salvar JSON
  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      {
        ...data,
        generatedAt: now
      },
      null,
      2
    )
  );

  // 🎨 SVG
  const svgContent = generateSVG(data, insights, now);

  // 💾 salvar SVG
  fs.writeFileSync(OUTPUT_SVG, svgContent.trim());

  console.log("📊 Dashboard sem repositórios gerado com sucesso!");
}

module.exports = generateDashboard;