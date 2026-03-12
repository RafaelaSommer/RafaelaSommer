#!/usr/bin/env node

require("dotenv").config()

const fs = require("fs")
const path = require("path")
const axios = require("axios")
const { DateTime } = require("luxon")
const { execSync } = require("child_process")
const generateDashboard = require("./generate-dashboard")
const { readCache, writeCache } = require("./cache")

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

function configureGit(){

  try{

    execSync(`git config user.name "${SETTINGS.gitUser}"`,{cwd:ROOT})
    execSync(`git config user.email "${SETTINGS.gitEmail}"`,{cwd:ROOT})

    const repo =
      `https://${TOKEN}@github.com/${USER}/GitHub-Profile-Auto-Updater.git`

    execSync(`git remote set-url origin ${repo}`,{cwd:ROOT})

  }catch(e){
    console.log("git já configurado")
  }

}

function checkInterval(){

  const cache = readCache()

  const last = cache.lastUpdate || 0
  const now = Date.now()

  const diff = now - last

  if(diff < INTERVAL * 60000){

    console.log("⏳ Intervalo mínimo ainda não atingido")
    process.exit(0)

  }

  cache.lastUpdate = now
  writeCache(cache)

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
    {query},
    {
      headers:{
        Authorization:`Bearer ${TOKEN}`
      }
    }
  )

  return res.data.data.user

}

function commit(){

  try{

    execSync("git add .",{cwd:ROOT})

    const status =
      execSync("git status --porcelain",{cwd:ROOT}).toString()

    if(!status){
      console.log("📭 Nenhuma mudança")
      return
    }

    const msg =
      `🤖 Auto Update ${DateTime.now().toFormat("HH:mm:ss")}`

    execSync(
      `git commit -m "${msg}"`,
      {cwd:ROOT,stdio:"inherit"}
    )

    execSync(
      "git push origin HEAD",
      {cwd:ROOT,stdio:"inherit"}
    )

    console.log("🚀 Push realizado")

  }catch(e){

    console.error("erro git:",e.message)

  }

}

function updateReadme(dynamicContent){

  const template =
    fs.readFileSync(
      path.join(ROOT,"templates/README.template.md"),
      "utf8"
    )

  const start =
    "<!--START_SECTION:dynamic-->"

  const end =
    "<!--END_SECTION:dynamic-->"

  const newBlock =
`${start}
${dynamicContent}
${end}`

  const updated =
    template.replace(
      new RegExp(`${start}[\\s\\S]*${end}`),
      newBlock
    )

  fs.writeFileSync(
    path.join(ROOT,"README.md"),
    updated
  )

}

async function main(){

  configureGit()

  checkInterval()

  const now =
    DateTime.now().setZone(TIMEZONE)

  const user =
    await fetchGitHub()

  const repos =
    user.repositories.nodes

  const followers =
    user.followers.totalCount

  const stars =
    repos.reduce((a,r)=>a+r.stargazerCount,0)

  generateDashboard({
    followers,
    totalProjects: repos.length,
    stars
  })

  const dynamicContent = `
📊 **Followers:** ${followers}

📦 **Projetos:** ${repos.length}

⭐ **Stars:** ${stars}

🕒 Última atualização:  
${now.toFormat("dd/MM/yyyy HH:mm:ss")}
`

  updateReadme(dynamicContent)

  commit()

}

main()