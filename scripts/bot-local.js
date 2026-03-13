#!/usr/bin/env node
require("dotenv").config();

const { spawn } = require("child_process");
const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const { readCache, writeCache } = require("./cache");

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
  console.log("🤖 Bot Local Iniciado");

  while (true) {
    const now = DateTime.now().setZone(TZ);

    // Executa update_readme.js apenas se o intervalo passou
    const cache = readCache();
    if (Date.now() - (cache.lastUpdate || 0) >= INTERVAL) {
      await run("update_readme.js");
    }

    // Executa activity.js com chance aleatória, respeitando intervalo
    if (Math.random() > 0.6) {
      const activityCache = readCache();
      if (Date.now() - (activityCache.lastActivity || 0) >= 3 * 60 * 1000) {
        await run("activity.js");
      }
    }

    await sleep(INTERVAL);
  }
}

loop();