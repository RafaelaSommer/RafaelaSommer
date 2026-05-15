#!/usr/bin/env node

require("dotenv").config()

const { spawn } = require("child_process")
const { execSync } = require("child_process")
const { DateTime } = require("luxon")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")

const SETTINGS = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, ".github/settings.json"),
    "utf8"
  )
)

const INTERVAL =
  SETTINGS.interval_minutes * 60000

const TZ =
  SETTINGS.timezone

let isRunning = false

function sleep(ms) {

  return new Promise(resolve =>
    setTimeout(resolve, ms)
  )

}

function run(script) {

  return new Promise(resolve => {

    const scriptPath =
      path.join(
        ROOT,
        "scripts",
        script
      )

    if (!fs.existsSync(scriptPath)) {

      console.log(
        `⚠️ ${script} não encontrado`
      )

      return resolve()

    }

    console.log(
      `🚀 Executando ${script}`
    )

    const child = spawn(

      "node",

      [scriptPath],

      {
        stdio: "inherit",
        env: process.env,
        shell: true
      }

    )

    child.on("close", code => {

      if (code !== 0) {

        console.log(
          `❌ ${script} erro (${code})`
        )

      }

      resolve()

    })

  })

}

function git(command) {

  return execSync(
    `git ${command}`,
    {
      cwd: ROOT,
      stdio: "pipe"
    }
  ).toString()

}

async function pushChanges() {

  try {

    console.log("📦 Verificando alterações...")

    git("add .")

    const status =
      git("status --porcelain")

    if (!status.trim()) {

      console.log(
        "✅ Nenhuma alteração para commit"
      )

      return

    }

    const now =
      DateTime.now()
        .setZone(TZ)
        .toFormat("dd/MM/yyyy HH:mm:ss")

    const message =
      `🤖 Auto Update ${now}`

    console.log("📝 Criando commit...")

    git(`commit -m "${message}"`)

    console.log("🚀 Enviando para GitHub...")

    git("push origin main")

    console.log(
      "✅ Repositório atualizado com sucesso"
    )

  } catch (err) {

    console.error(
      "❌ Erro Git:",
      err.message
    )

  }

}

async function runAll() {

  if (isRunning) {

    console.log(
      "⚠️ Já existe execução em andamento, pulando..."
    )

    return

  }

  isRunning = true

  console.log(
    "\n🔄 Iniciando ciclo...\n"
  )

  try {

    await run("generate-dashboard.js")
    await run("generate-cron.js")
    await run("ai-activity.js")
    await run("activity.js")
    await run("cache.js")
    await run("index.js")

    // NOVO:
    await pushChanges()

    console.log(
      "\n✅ Ciclo finalizado\n"
    )

  } catch (err) {

    console.error(
      "❌ Erro no ciclo:",
      err.message
    )

  }

  isRunning = false

}

async function loop() {

  console.log(
    "🤖 Bot Local Iniciado\n"
  )

  while (true) {

    const start = Date.now()

    try {

      const now =
        DateTime.now()
          .setZone(TZ)

      console.log(
        "⏱",
        now.toFormat(
          "dd/MM/yyyy HH:mm:ss"
        )
      )

      await runAll()

    } catch (err) {

      console.error(
        "❌ Erro no loop:",
        err.message
      )

    }

    const elapsed =
      Date.now() - start

    const remaining =
      INTERVAL - elapsed

    if (remaining > 0) {

      console.log(
        `⏳ Aguardando ${Math.ceil(remaining / 1000)} segundos...\n`
      )

      await sleep(remaining)

    } else {

      console.log(
        "⚠️ Execução demorou mais que o intervalo configurado.\n"
      )

    }

  }

}

loop()