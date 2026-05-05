const fs = require("fs");
const path = require("path");

const COLORS = [
  "#FF6B6B","#6BCB77","#4D96FF","#FFD93D",
  "#845EC2","#FF9671","#00C9A7","#C34A36"
];

function generateDashboard(data) {

  const {
    stars = 0,
    followers = 0,
    totalProjects = 0,
    languages = {},
    repos = []
  } = data;

  const width = 1000;
  const cardPadding = 60;

  let y = 220;

  let langBars = "";
  let i = 0;

  const totalLang = Object.values(languages).reduce((a,b)=>a+b,0);

  const sortedLang =
    Object.entries(languages)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,6);

  sortedLang.forEach(([lang,val])=>{

    const percent =
      totalLang ? ((val/totalLang)*100).toFixed(1) : 0;

    const barWidth = percent * 5;

    const color = COLORS[i % COLORS.length];

    langBars += `
      <text x="${cardPadding}" y="${y}" fill="#E6EDF3" font-size="14">${lang}</text>
      <rect x="260" y="${y-14}" rx="10" width="450" height="16" fill="#21262D"/>
      <rect x="260" y="${y-14}" rx="10" width="0" height="16" fill="${color}">
        <animate attributeName="width" from="0" to="${barWidth}" dur="1.2s" fill="freeze"/>
      </rect>
      <text x="730" y="${y}" fill="#8B949E" font-size="12">${percent}%</text>
    `;

    y += 40;
    i++;

  });

  const reposTitleY = y + 40;

  let repoList = "";
  let repoY = reposTitleY + 30;

  repos
    .sort((a,b)=>(b.stargazerCount || 0) - (a.stargazerCount || 0))
    .forEach(r=>{

      const repoLang = r.primaryLanguage?.name || "—";

      repoList += `
        <text x="${cardPadding}" y="${repoY}" fill="#58A6FF" font-size="14">
          📦 ${r.name}
        </text>

        <text x="${cardPadding + 350}" y="${repoY}" fill="#FFD93D" font-size="14">
          ⭐ ${r.stargazerCount}
        </text>

        <text x="${cardPadding + 450}" y="${repoY}" fill="#8B949E" font-size="12">
          ${repoLang}
        </text>
      `;

      repoY += 28;

    });

  const height = repoY + 80;

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">

  <rect width="100%" height="100%" fill="#0D1117"/>

  <rect x="20" y="20" width="${width-40}" height="${height-40}" rx="25"
  fill="#161B22" stroke="#30363D"/>

  <text x="${cardPadding}" y="80"
  fill="#58A6FF"
  font-size="28"
  font-weight="bold">
  📊 Dashboard de Repositórios
  </text>

  <text x="${cardPadding}" y="130"
  fill="#E6EDF3"
  font-size="16">
  📦 ${totalProjects} Repositórios
  </text>

  <text x="${cardPadding+250}" y="130"
  fill="#FFD93D"
  font-size="16">
  ⭐ ${stars} Stars
  </text>

  <text x="${cardPadding+420}" y="130"
  fill="#DA70D6"
  font-size="16">
  👥 ${followers} Seguidores
  </text>

  <text x="${cardPadding}" y="180"
  fill="#8B949E"
  font-size="16">
  Linguagens Mais Utilizadas
  </text>

  ${langBars}

  <line
    x1="${cardPadding}"
    y1="${reposTitleY-20}"
    x2="${width-cardPadding}"
    y2="${reposTitleY-20}"
    stroke="#30363D"
  />

  <text
    x="${cardPadding}"
    y="${reposTitleY}"
    fill="#8B949E"
    font-size="18"
    font-weight="bold">
    📂 Todos os Repositórios (${repos.length})
  </text>

  ${repoList}

</svg>
`;

  const outputPath =
    path.join(__dirname,"..","assets","dashboard.svg");

  fs.mkdirSync(path.dirname(outputPath), {recursive:true});
  fs.writeFileSync(outputPath,svg);

  console.log("✅ Dashboard gerado com sucesso.");

}

module.exports = generateDashboard;