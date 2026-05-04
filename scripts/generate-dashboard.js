#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUTPUT_MD = path.join(DATA_DIR, "dashboard.md");
const OUTPUT_JSON = path.join(DATA_DIR, "dashboard.json");

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

// 🚀 Geração principal
function generateDashboard(data) {
  if (!data) {
    console.log("❌ Sem dados para gerar dashboard");
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

  // 📁 garante pasta
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  // 💾 salva markdown
  fs.writeFileSync(OUTPUT_MD, content.trim());

  // 💾 salva JSON (útil pra outros scripts)
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

  console.log("📊 Dashboard avançado gerado!");
}

module.exports = generateDashboard;