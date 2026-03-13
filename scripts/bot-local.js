#!/usr/bin/env node
require("dotenv").config();

const { spawn } = require("child_process");
const { DateTime } = require("luxon");
const { readCache } = require("./cache");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SETTINGS = JSON.parse(fs.readFileSync(path.join(ROOT, ".github/settings.json")));
const INTERVAL = SETTINGS.interval_minutes * 60000;
const TZ = SETTINGS.timezone;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function run(script) {
  return new Promise(resolve => {
    const scriptPath = path.join(ROOT, "scripts", script);
    if (!fs.existsSync(scriptPath)) {
      console.log(`⚠️ ${script} não encontrado`);
      return resolve();
    }
    console.log(`🚀 Executando ${script}`);
    const child = spawn("node", [scriptPath], { stdio: "inherit" });
    child.on("close", resolve);
  });
}

async function loop() {
  console.log("🤖 Bot Local Iniciado ✅");

  while (true) {
    const now = DateTime.now().setZone(TZ);
    console.log(`⏱ ${now.toFormat("dd/MM/yyyy HH:mm:ss")} - Checando atualizações...`);

    // update_readme.js respeitando intervalo
    const cache = readCache();
    if (Date.now() - (cache.lastUpdate || 0) >= INTERVAL) {
      await run("update_readme.js");
    } else {
      console.log(`🕒 Intervalo mínimo ainda não atingido para update_readme.js`);
    }

    // activity.js aleatório respeitando intervalo de 3 min
    const activityCache = readCache();
    if (Math.random() > 0.6 && Date.now() - (activityCache.lastActivity || 0) >= 3 * 60 * 1000) {
      await run("activity.js");
    } else {
      console.log("⚡ Nenhuma atividade gerada neste ciclo.");
    }

    console.log(`💤 Aguardando ${SETTINGS.interval_minutes} minutos até a próxima checagem...\n`);
    await sleep(INTERVAL);
  }
}

loop();