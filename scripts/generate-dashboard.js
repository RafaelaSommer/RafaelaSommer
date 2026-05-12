const fs = require("fs");
const path = require("path");

const linguistColors =
  require("github-lang-colors");

function getLanguageColor(language) {

  const langData =
    linguistColors[language];

  if (langData?.color) {
    return langData.color;
  }

  return generateColorFromString(language);

}

// Gera cor automática caso a linguagem não exista
function generateColorFromString(str) {

  let hash = 0;

  for (let i = 0; i < str.length; i++) {

    hash =
      str.charCodeAt(i) +
      ((hash << 5) - hash);

  }

  let color = "#";

  for (let i = 0; i < 3; i++) {

    const value =
      (hash >> (i * 8)) & 255;

    color +=
      ("00" + value.toString(16))
        .slice(-2);

  }

  return color;

}

function generateDashboard(data) {

  const {
    stars = 0,
    followers = 0,
    languages = {},
    repos = []
  } = data;

  const width = 1000;

  // ALTURA DINÂMICA
  const height =
    450 + (Object.keys(languages).length * 50);

  const totalRepos = repos.length;

  const totalLang =
    Object.values(languages)
      .reduce((a, b) => a + b, 0);

  // TODAS AS LINGUAGENS
  const sortedLang =
    Object.entries(languages)
      .sort((a, b) => b[1] - a[1]);

  let progressBars = "";
  let legend = "";

  let y = 340;
  let legendY = 340;

  sortedLang.forEach(([lang, value]) => {

    const percent =
      totalLang
        ? ((value / totalLang) * 100).toFixed(1)
        : 0;

    const color =
      getLanguageColor(lang);

    const barWidth =
      (percent / 100) * 520;

    progressBars += `

      <text
        x="80"
        y="${y}"
        fill="#E6EDF3"
        font-size="15"
        font-weight="600">
        ${lang}
      </text>

      <rect
        x="220"
        y="${y - 14}"
        width="520"
        height="18"
        rx="10"
        fill="#21262D"
      />

      <rect
        x="220"
        y="${y - 14}"
        width="0"
        height="18"
        rx="10"
        fill="${color}">

        <animate
          attributeName="width"
          from="0"
          to="${barWidth}"
          dur="1.5s"
          fill="freeze"/>

      </rect>

      <text
        x="760"
        y="${y}"
        fill="#8B949E"
        font-size="13">
        ${percent}%
      </text>

    `;

    legend += `

      <circle
        cx="820"
        cy="${legendY - 5}"
        r="7"
        fill="${color}"
      />

      <text
        x="840"
        y="${legendY}"
        fill="#C9D1D9"
        font-size="14">
        ${lang}
      </text>

    `;

    y += 45;
    legendY += 35;

  });

  const svg = `
<svg
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  preserveAspectRatio="xMidYMid meet"
  xmlns="http://www.w3.org/2000/svg">

  <defs>

    <linearGradient
      id="bg"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%">

      <stop offset="0%" stop-color="#0D1117"/>
      <stop offset="100%" stop-color="#161B22"/>

    </linearGradient>

    <filter id="shadow">

      <feDropShadow
        dx="0"
        dy="0"
        stdDeviation="12"
        flood-color="#00000055"/>

    </filter>

  </defs>

  <!-- Background -->

  <rect
    width="100%"
    height="100%"
    rx="30"
    fill="url(#bg)"
  />

  <!-- Main Card -->

  <rect
    x="20"
    y="20"
    width="960"
    height="${height - 40}"
    rx="28"
    fill="#161B22"
    stroke="#30363D"
  />

  <!-- Header -->

  <text
    x="60"
    y="90"
    fill="#58A6FF"
    font-size="34"
    font-weight="bold">

    🚀 GitHub Dashboard

  </text>

  <text
    x="60"
    y="125"
    fill="#8B949E"
    font-size="16">

    Estatísticas e Linguagens Mais Utilizadas

  </text>

  <!-- Stats Cards -->

  <rect
    x="60"
    y="170"
    width="240"
    height="110"
    rx="22"
    fill="#0D1117"
    stroke="#30363D"
    filter="url(#shadow)"
  />

  <text
    x="90"
    y="215"
    fill="#F2CC60"
    font-size="18">

    ⭐ Stars

  </text>

  <text
    x="90"
    y="255"
    fill="#FFFFFF"
    font-size="34"
    font-weight="bold">

    ${stars}

  </text>

  <rect
    x="380"
    y="170"
    width="240"
    height="110"
    rx="22"
    fill="#0D1117"
    stroke="#30363D"
    filter="url(#shadow)"
  />

  <text
    x="410"
    y="215"
    fill="#D2A8FF"
    font-size="18">

    👥 Seguidores

  </text>

  <text
    x="410"
    y="255"
    fill="#FFFFFF"
    font-size="34"
    font-weight="bold">

    ${followers}

  </text>

  <rect
    x="700"
    y="170"
    width="220"
    height="110"
    rx="22"
    fill="#0D1117"
    stroke="#30363D"
    filter="url(#shadow)"
  />

  <text
    x="730"
    y="215"
    fill="#7EE787"
    font-size="18">

    📦 Repositórios

  </text>

  <text
    x="730"
    y="255"
    fill="#FFFFFF"
    font-size="34"
    font-weight="bold">

    ${totalRepos}

  </text>

  <!-- Languages Title -->

  <text
    x="60"
    y="315"
    fill="#C9D1D9"
    font-size="22"
    font-weight="bold">

    💻 Linguagens Mais Utilizadas

  </text>

  ${progressBars}

  <!-- Legend -->

  ${legend}

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

  console.log("✅ Dashboard gerado com sucesso.");

}

module.exports = generateDashboard;