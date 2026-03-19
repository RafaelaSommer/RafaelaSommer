#!/usr/bin/env node

require("dotenv").config()

const fs = require("fs")
const path = require("path")
const axios = require("axios")
const { DateTime } = require("luxon")
const generateDashboard = require("./generate-dashboard")

const ROOT = path.join(__dirname,"..")

const SETTINGS = JSON.parse(
  fs.readFileSync(path.join(ROOT,".github/settings.json"),"utf8")
)

const USER = SETTINGS.github_user
const TIMEZONE = SETTINGS.timezone
const INTERVAL = SETTINGS.interval_minutes

const TOKEN = process.env.GITHUB_TOKEN

if(!TOKEN){
  console.error("❌ GITHUB_TOKEN não encontrado")
  process.exit(1)
}

async function fetchGitHub(){

  const resUser = await axios.get(
    `https://api.github.com/users/${USER}`,
    { headers:{ Authorization:`Bearer ${TOKEN}` } }
  )

  const resRepos = await axios.get(
    `https://api.github.com/users/${USER}/repos?per_page=100`,
    { headers:{ Authorization:`Bearer ${TOKEN}` } }
  )

  const repos = resRepos.data

  const languages = {}

  repos.forEach(repo=>{
    if(repo.language){
      languages[repo.language] =
        (languages[repo.language] || 0) + 1
    }
  })

  return {
    followers: resUser.data.followers,
    totalProjects: repos.length,
    stars: repos.reduce((a,r)=>a+r.stargazers_count,0),
    languages,
    repos: repos.map(r=>({
      name: r.name,
      stars: r.stargazers_count,
      language: r.language
    }))
  }
}

function updateReadme(dynamicContent){

  const readmePath = path.join(ROOT,"README.md")

  let content = fs.readFileSync(readmePath,"utf8")

  const start = "<!--START_SECTION:dynamic-->"
  const end = "<!--END_SECTION:dynamic-->"

  const regex = new RegExp(`${start}[\\s\\S]*${end}`)

  const newBlock = `${start}
${dynamicContent}
${end}`

  const updated = content.replace(regex,newBlock)

  fs.writeFileSync(readmePath,updated)

}

async function main(){

  const now = DateTime.now().setZone(TIMEZONE)
  const next = now.plus({ minutes: INTERVAL })

  const data = await fetchGitHub()

  // ✅ GERA DASHBOARD
  generateDashboard(data)

  const dynamicContent = `
## 🔄 Atualização Automática

🕒 Última atualização:  
${now.toFormat("dd/MM/yyyy HH:mm:ss")} (Horário de Brasília)

🔁 Próxima atualização automática:  
${next.toFormat("dd/MM/yyyy HH:mm:ss")} (Horário de Brasília)

📊 **Followers:** ${data.followers}  
📦 **Projetos:** ${data.totalProjects}  
⭐ **Stars:** ${data.stars}
`

  updateReadme(dynamicContent)

  console.log("✅ README atualizado")

}

main()