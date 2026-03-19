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
      { stdio: "inherit" }
    )

    child.on("close", resolve)
  })
}

async function runAll() {

  console.log("🔄 Iniciando ciclo completo...\n")

  // 🔧 Infraestrutura
  await run("generate-cron.js")

  // 🤖 IA (opcional)
  await run("ai-activity.js")

  // 📊 Atividade
  await run("activity.js")

  // 🧠 Cache (se existir como script executável)
  await run("cache.js")

  // 📈 Dados principais + dashboard
  await run("index.js")

  // 🖼️ Caso dashboard seja separado
  await run("generate-dashboard.js")

  // 📝 Atualiza README por último
  await run("update_readme.js")

  console.log("\n✅ Ciclo finalizado\n")

}

async function loop() {

  console.log("🤖 Bot Local Iniciado")

  while (true) {

    const now = DateTime.now().setZone(TZ)

    console.log("⏱", now.toFormat("dd/MM/yyyy HH:mm:ss"))

    await runAll()

    console.log(`⏳ Aguardando ${SETTINGS.interval_minutes} minutos...\n`)

    await sleep(INTERVAL)

  }

}

loop()