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

let isRunning = false

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

    const child = spawn("node", [scriptPath], {
      stdio: "inherit",
      env: process.env
    })

    child.on("close", (code) => {
      if (code !== 0) {
        console.log(`❌ ${script} erro (${code})`)
      }
      resolve()
    })

  })
}

async function runAll() {

  if (isRunning) {
    console.log("⚠️ Já existe execução em andamento, pulando...")
    return
  }

  isRunning = true

  console.log("\n🔄 Iniciando ciclo...\n")

  try {
    await run("generate-cron.js")
    await run("ai-activity.js")
    await run("activity.js")
    await run("cache.js")
    await run("index.js")

    console.log("\n✅ Ciclo finalizado\n")

  } catch (err) {
    console.error("❌ Erro no ciclo:", err.message)
  }

  isRunning = false
}

async function loop() {

  console.log("🤖 Bot Local Iniciado\n")

  while (true) {

    try {
      const now = DateTime.now().setZone(TZ)
      console.log("⏱", now.toFormat("dd/MM/yyyy HH:mm:ss"))

      await runAll()

    } catch (err) {
      console.error("❌ Erro no loop:", err.message)
    }

    console.log(`⏳ Aguardando ${SETTINGS.interval_minutes} minutos...\n`)
    await sleep(INTERVAL)
  }

}

loop()