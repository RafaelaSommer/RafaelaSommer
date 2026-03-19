#!/usr/bin/env node

require("dotenv").config()

const fs = require("fs")
const path = require("path")
const axios = require("axios")
const { DateTime } = require("luxon")
const { execSync } = require("child_process")
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

  const query = `
  query {
    user(login:"${USER}") {
      followers { totalCount }
      repositories(first:100) {
        nodes {
          name
          stargazerCount
          primaryLanguage { name }
        }
      }
    }
  }`

  const res = await axios.post(
    "https://api.github.com/graphql",
    { query },
    {
      headers:{
        Authorization:`Bearer ${TOKEN}`
      }
    }
  )

  const user = res.data.data.user
  const repos = user.repositories.nodes

  // 🔥 monta linguagens corretamente
  const languages = {}

  repos.forEach(repo=>{
    if(repo.primaryLanguage?.name){
      const lang = repo.primaryLanguage.name
      languages[lang] = (languages[lang] || 0) + 1
    }
  })

  return {
    followers: user.followers.totalCount,
    totalProjects: repos.length,
    stars: repos.reduce((a,r)=>a+r.stargazerCount,0),
    languages,
    repos // 👈 já no formato correto pro dashboard
  }
}

function updateReadme(dynamicContent){

  const readmePath = path.join(ROOT,"README.md")

  let content = fs.readFileSync(readmePath,"utf8")

  const start = "<!--START_SECTION:dynamic-->"
  const end = "<!--END_SECTION:dynamic-->"

  const regex = /<!--START_SECTION:dynamic-->[\s\S]*<!--END_SECTION:dynamic-->/

  const newBlock = `${start}
${dynamicContent.trim()}
${end}`

  const updated = content.replace(regex,newBlock)

  fs.writeFileSync(readmePath,updated,"utf8")
}

function commitAndPush(){

  const isCI = process.env.GITHUB_ACTIONS === "true"

  try{

    execSync("git add .",{stdio:"inherit"})

    const status =
      execSync("git status --porcelain").toString()

    if(!status){
      console.log("📭 Nenhuma mudança")
      return
    }

    execSync(
      `git commit -m "🤖 auto update ${DateTime.now().toFormat("HH:mm:ss")}"`,
      {stdio:"inherit"}
    )

    if(isCI){
      execSync(
        "git push origin main --force",
        {stdio:"inherit"}
      )
      console.log("🚀 Push via GitHub Actions")
    }else{
      console.log("💻 Local → push ignorado")
    }

  }catch(e){
    console.error("❌ erro git:",e.message)
  }
}

async function main(){

  const now = DateTime.now().setZone(TIMEZONE)
  const next = now.plus({ minutes: INTERVAL })

  const data = await fetchGitHub()

  // 📊 Dashboard SVG
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

  commitAndPush()
}

main()