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

  // LIMITA ALTURA PARA O GITHUB NÃO QUEBRAR
  const maxLanguages = 12;

  const sortedLang =
    Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxLanguages);

  const height =
    420 + (sortedLang.length * 38);

  const totalRepos = repos.length;

  const totalLang =
    Object.values(languages)
      .reduce((a, b) => a + b, 0);

  let progressBars = "";

  let y = 310;

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
        x="60"
        y="${y}"
        fill="#E6EDF3"
        font-size="14"
        font-family="Arial"
        font-weight="600">

        ${lang}

      </text>

      <rect
        x="200"
        y="${y - 12}"
        width="520"
        height="14"
        rx="7"
        fill="#21262D"
      />

      <rect
        x="200"
        y="${y - 12}"
        width="${barWidth}"
        height="14"
        rx="7"
        fill="${color}"
      />

      <text
        x="740"
        y="${y}"
        fill="#8B949E"
        font-size="12"
        font-family="Arial">

        ${percent}%

      </text>

    `;

    y += 35;

  });

  const svg = `
<svg
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
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

  </defs>

  <!-- Background -->

  <rect
    width="100%"
    height="100%"
    rx="24"
    fill="url(#bg)"
  />

  <!-- Card -->

  <rect
    x="20"
    y="20"
    width="960"
    height="${height - 40}"
    rx="24"
    fill="#161B22"
    stroke="#30363D"
  />

  <!-- Header -->

  <text
    x="50"
    y="70"
    fill="#58A6FF"
    font-size="30"
    font-family="Arial"
    font-weight="bold">

    GitHub Dashboard

  </text>

  <text
    x="50"
    y="105"
    fill="#8B949E"
    font-size="15"
    font-family="Arial">

    Estatísticas e Linguagens Mais Utilizadas

  </text>

  <!-- Stats -->

  <rect
    x="50"
    y="140"
    width="250"
    height="90"
    rx="18"
    fill="#0D1117"
    stroke="#30363D"
  />

  <text
    x="75"
    y="178"
    fill="#F2CC60"
    font-size="16"
    font-family="Arial">

    Stars

  </text>

  <text
    x="75"
    y="210"
    fill="#FFFFFF"
    font-size="28"
    font-family="Arial"
    font-weight="bold">

    ${stars}

  </text>

  <rect
    x="370"
    y="140"
    width="250"
    height="90"
    rx="18"
    fill="#0D1117"
    stroke="#30363D"
  />

  <text
    x="395"
    y="178"
    fill="#D2A8FF"
    font-size="16"
    font-family="Arial">

    Seguidores

  </text>

  <text
    x="395"
    y="210"
    fill="#FFFFFF"
    font-size="28"
    font-family="Arial"
    font-weight="bold">

    ${followers}

  </text>

  <rect
    x="690"
    y="140"
    width="250"
    height="90"
    rx="18"
    fill="#0D1117"
    stroke="#30363D"
  />

  <text
    x="715"
    y="178"
    fill="#7EE787"
    font-size="16"
    font-family="Arial">

    Repositórios

  </text>

  <text
    x="715"
    y="210"
    fill="#FFFFFF"
    font-size="28"
    font-family="Arial"
    font-weight="bold">

    ${totalRepos}

  </text>

  <!-- Languages -->

  <text
    x="50"
    y="275"
    fill="#C9D1D9"
    font-size="22"
    font-family="Arial"
    font-weight="bold">

    Linguagens Utilizadas

  </text>

  ${progressBars}

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