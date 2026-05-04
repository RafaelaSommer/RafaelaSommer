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

// 🏆 Top repositórios
function generateTopRepos(repos) {
  if (!repos || repos.length === 0) return "Sem repositórios";

  return repos
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 5)
    .map(r => `⭐ ${r.stargazerCount} • ${r.name}`)
    .join("\n");
}

// 📊 Estatísticas extras
function generateExtras(repos) {
  if (!repos || repos.length === 0) {
    return {
      mostStarred: "N/A",
      avgStars: 0
    };
  }

  const mostStarred = repos.reduce((a, b) =>
    a.stargazerCount > b.stargazerCount ? a : b
  );

  const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0);
  const avgStars = (totalStars / repos.length).toFixed(1);

  return {
    mostStarred: `${mostStarred.name} (${mostStarred.stargazerCount}⭐)`,
    avgStars
  };
}

// 🎨 SVG
function generateSVG(data, extras, now) {
  return `
<svg width="600" height="350" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #333 }
    .text { font: 14px sans-serif; fill: #555 }
  </style>

  <text x="20" y="40" class="title">🚀 Dashboard</text>

  <text x="20" y="80" class="text">⭐ Estrelas: ${data.stars}</text>
  <text x="20" y="110" class="text">👥 Seguidores: ${data.followers}</text>
  <text x="20" y="140" class="text">📦 Projetos: ${data.totalProjects}</text>

  <text x="20" y="190" class="text">🏆 Top: ${extras.mostStarred}</text>
  <text x="20" y="220" class="text">📈 Média estrelas: ${extras.avgStars}</text>

  <text x="20" y="280" class="text">🕒 Atualizado: ${now}</text>
</svg>
`;
}

// 🚀 Geração principal
function generateDashboard(data) {
  if (!data) {
    console.log("❌ Sem dados para gerar dashboard");
    return;
  }

  // ❌ NÃO cria pasta automaticamente
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log("❌ Pasta 'assets' não existe. Crie manualmente.");
    return;
  }

  const now = DateTime.now().toFormat("dd/MM/yyyy HH:mm:ss");

  const extras = generateExtras(data.repos);

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

### 🏆 Top Repositórios
${generateTopRepos(data.repos)}

---

### 📊 Insights
- 🚀 Projeto mais popular: **${extras.mostStarred}**
- 📈 Média de estrelas: **${extras.avgStars}**

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

  // 🎨 gerar SVG
  const svgContent = generateSVG(data, extras, now);

  // 💾 salvar SVG
  fs.writeFileSync(OUTPUT_SVG, svgContent.trim());

  console.log("📊 Dashboard completo gerado em /assets!");
}

module.exports = generateDashboard;