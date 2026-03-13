#!/usr/bin/env node
require("dotenv").config();

const { spawn } = require("child_process");
const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const { readCache, writeCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const SETTINGS = JSON.parse(fs.readFileSync(path.join(ROOT, ".github/settings.json")));
const INTERVAL = SETTINGS.interval_minutes * 60000; // intervalo do update_readme.js
const ACTIVITY_INTERVAL = 3 * 60 * 1000; // intervalo para activity.js
const TZ = SETTINGS.timezone;

// Função para rodar scripts sem travar
function run(script) {
  const scriptPath = path.join(ROOT, "scripts", script);
  if (!fs.existsSync(scriptPath)) return;
  const child = spawn("node", [scriptPath], { stdio: "inherit" });
  child.on("error", err => console.log(`⚠️ Erro ao executar ${script}:`, err.message));
}

// Loop rápido do bot, sem travar
async function loop() {
  console.log("🤖 Bot Local Iniciado");

  while (true) {
    const now = DateTime.now().setZone(TZ);
    const cache = readCache();
    const nowMs = Date.now();

    // Atualiza README se intervalo passou
    if (nowMs - (cache.lastUpdate || 0) >= INTERVAL) {
      run("update_readme.js"); // não await, roda em background
    }

    // Cria activity.js com chance aleatória e intervalo respeitado
    if (Math.random() > 0.6 && nowMs - (cache.lastActivity || 0) >= ACTIVITY_INTERVAL) {
      run("activity.js"); // não await, roda em background
    }

    // Loop rápido: verifica novamente a cada 5 segundos
    await new Promise(r => setTimeout(r, 5000));
  }
}

loop();