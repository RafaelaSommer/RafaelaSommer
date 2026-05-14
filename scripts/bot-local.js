#!/usr/bin/env node

require("dotenv").config()

const { spawn } = require("child_process")
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
        env: process.env
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
    await run ("generate-dashboard.js")
    await run("generate-cron.js")
    await run("ai-activity.js")
    await run("activity.js")
    await run("cache.js")
    await run("index.js")

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

    // início do ciclo
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

    // tempo gasto
    const elapsed =
      Date.now() - start

    // restante até completar intervalo
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