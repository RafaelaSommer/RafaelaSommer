require("dotenv").config()

const { spawn } = require("child_process")
const { DateTime } = require("luxon")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")

const SETTINGS = JSON.parse(
  fs.readFileSync(path.join(ROOT, ".github/settings.json"), "utf8")
)

const INTERVAL = SETTINGS.interval_minutes * 60000
const TZ = SETTINGS.timezone

let isRunning = false // 🚀 evita execução simultânea

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function run(script) {
  return new Promise(resolve => {

    const scriptPath = path.join(ROOT, "scripts", script)

    if (!fs.existsSync(scriptPath)) {
      console.log(`⚠️ ${script} não encontrado`)
      return resolve()
    }

    console.log(`🚀 Executando ${script}`)

    const child = spawn(
      "node",
      [scriptPath],
      {
        stdio: "inherit",
        env: process.env // 🔥 garante token no script
      }
    )

    child.on("close", (code) => {
      if (code !== 0) {
        console.log(`❌ ${script} finalizou com erro (${code})`)
      }
      resolve()
    })

  })
}

async function runAll() {

  if (isRunning) {
    console.log("⚠️ Já existe um ciclo em execução, pulando...")
    return
  }

  isRunning = true

  console.log("\n🔄 Iniciando ciclo completo...\n")

  try {

    // 🧠 Infra
    await run("generate-cron.js")

    // 🤖 IA (opcional)
    await run("ai-activity.js")

    // 📊 Atividade
    await run("activity.js")

    // 💾 Cache (se aplicável)
    await run("cache.js")

    // 🔥 PRINCIPAL (dashboard + readme + git push)
    await run("index.js")

    console.log("\n✅ Ciclo finalizado com sucesso\n")

  } catch (err) {
    console.error("❌ Erro no ciclo:", err.message)
  }

  isRunning = false
}

async function loop() {

  console.log("🤖 Bot Local Iniciado\n")

  while (true) {

    const now = DateTime.now().setZone(TZ)

    console.log("⏱", now.toFormat("dd/MM/yyyy HH:mm:ss"))

    await runAll()

    console.log(`⏳ Aguardando ${SETTINGS.interval_minutes} minutos...\n`)

    await sleep(INTERVAL)

  }

}

loop()