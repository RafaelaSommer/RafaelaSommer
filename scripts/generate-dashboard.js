const fs = require("fs");
const path = require("path");

const COLORS = [
  "#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D",
  "#845EC2", "#FF9671", "#00C9A7", "#C34A36"
];

function generateDashboard(data) {

  const {
    stars = 0,
    followers = 0,
    languages = {},
    repos = []
  } = data;

  const width = 1100;
  const cardPadding = 60;

  let y = 240;

  let langBars = "";
  let i = 0;

  const totalLang =
    Object.values(languages).reduce((a, b) => a + b, 0);

  const sortedLang =
    Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

  sortedLang.forEach(([lang, val]) => {

    const percent =
      totalLang
        ? ((val / totalLang) * 100).toFixed(1)
        : 0;

    const barWidth = percent * 5;

    const color = COLORS[i % COLORS.length];

    langBars += `
      <text x="${cardPadding}" y="${y}"
        fill="#E6EDF3"
        font-size="14">
        ${lang}
      </text>

      <rect
        x="260"
        y="${y - 14}"
        rx="10"
        width="500"
        height="16"
        fill="#21262D"
      />

      <rect
        x="260"
        y="${y - 14}"
        rx="10"
        width="0"
        height="16"
        fill="${color}">
        <animate
          attributeName="width"
          from="0"
          to="${barWidth}"
          dur="1.2s"
          fill="freeze"/>
      </rect>

      <text
        x="780"
        y="${y}"
        fill="#8B949E"
        font-size="12">
        ${percent}%
      </text>
    `;

    y += 42;
    i++;

  });

  const reposTitleY = y + 50;

  let repoList = "";
  let repoY = reposTitleY + 40;

  repos
    .sort(
      (a, b) =>
        (b.stargazerCount || 0) -
        (a.stargazerCount || 0)
    )
    .forEach((r, index) => {

      const repoLang =
        r.primaryLanguage?.name || "—";

      const color =
        COLORS[index % COLORS.length];

      repoList += `
        <rect
          x="${cardPadding}"
          y="${repoY - 20}"
          rx="12"
          width="930"
          height="38"
          fill="#1C2128"
          stroke="#30363D"
        />

        <circle
          cx="${cardPadding + 18}"
          cy="${repoY - 3}"
          r="6"
          fill="${color}"
        />

        <text
          x="${cardPadding + 35}"
          y="${repoY}"
          fill="#58A6FF"
          font-size="14"
          font-weight="bold">
          ${r.name}
        </text>

        <text
          x="${cardPadding + 520}"
          y="${repoY}"
          fill="#FFD93D"
          font-size="13">
          ⭐ ${r.stargazerCount || 0}
        </text>

        <text
          x="${cardPadding + 650}"
          y="${repoY}"
          fill="#8B949E"
          font-size="13">
          ${repoLang}
        </text>
      `;

      repoY += 50;

    });

  const height = repoY + 80;

  const svg = `
<svg
  width="${width}"
  height="${height}"
  xmlns="http://www.w3.org/2000/svg">

  <defs>

    <linearGradient
      id="bgGradient"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%">

      <stop offset="0%" stop-color="#0D1117"/>
      <stop offset="100%" stop-color="#111827"/>

    </linearGradient>

  </defs>

  <rect
    width="100%"
    height="100%"
    fill="url(#bgGradient)"
  />

  <rect
    x="20"
    y="20"
    width="${width - 40}"
    height="${height - 40}"
    rx="25"
    fill="#161B22"
    stroke="#30363D"
  />

  <!-- TÍTULO -->

  <text
    x="${cardPadding}"
    y="85"
    fill="#58A6FF"
    font-size="30"
    font-weight="bold">

    🚀 GitHub Dashboard

  </text>

  <!-- STATS -->

  <rect
    x="${cardPadding}"
    y="120"
    rx="18"
    width="220"
    height="70"
    fill="#1C2128"
    stroke="#30363D"
  />

  <text
    x="${cardPadding + 20}"
    y="150"
    fill="#FFD93D"
    font-size="16">

    ⭐ Stars

  </text>

  <text
    x="${cardPadding + 20}"
    y="178"
    fill="#FFFFFF"
    font-size="26"
    font-weight="bold">

    ${stars}

  </text>

  <rect
    x="${cardPadding + 260}"
    y="120"
    rx="18"
    width="220"
    height="70"
    fill="#1C2128"
    stroke="#30363D"
  />

  <text
    x="${cardPadding + 280}"
    y="150"
    fill="#DA70D6"
    font-size="16">

    👥 Seguidores

  </text>

  <text
    x="${cardPadding + 280}"
    y="178"
    fill="#FFFFFF"
    font-size="26"
    font-weight="bold">

    ${followers}

  </text>

  <rect
    x="${cardPadding + 520}"
    y="120"
    rx="18"
    width="220"
    height="70"
    fill="#1C2128"
    stroke="#30363D"
  />

  <text
    x="${cardPadding + 540}"
    y="150"
    fill="#00C9A7"
    font-size="16">

    📂 Repositórios

  </text>

  <text
    x="${cardPadding + 540}"
    y="178"
    fill="#FFFFFF"
    font-size="26"
    font-weight="bold">

    ${repos.length}

  </text>

  <!-- LINGUAGENS -->

  <text
    x="${cardPadding}"
    y="220"
    fill="#8B949E"
    font-size="18"
    font-weight="bold">

    💻 Linguagens Mais Utilizadas

  </text>

  ${langBars}

  <!-- DIVISÃO -->

  <line
    x1="${cardPadding}"
    y1="${reposTitleY - 25}"
    x2="${width - cardPadding}"
    y2="${reposTitleY - 25}"
    stroke="#30363D"
  />

  <!-- REPOSITÓRIOS -->

  <text
    x="${cardPadding}"
    y="${reposTitleY}"
    fill="#8B949E"
    font-size="20"
    font-weight="bold">

    📦 Repositórios Populares

  </text>

  ${repoList}

</svg>
`;

  const outputPath =
    path.join(
      __dirname,
      "..",
      "assets",
      "dashboard.svg"
    );

  fs.mkdirSync(
    path.dirname(outputPath),
    { recursive: true }
  );

  fs.writeFileSync(outputPath, svg);

  console.log("✅ Dashboard gerado com sucesso!");

}

module.exports = generateDashboard;