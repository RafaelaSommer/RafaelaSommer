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
    console.log("⏱", now.toFormat("HH:mm:ss"));

    // Respeita intervalo
    const cache = readCache();
    const lastUpdate = cache.lastUpdate || 0;
    const diff = Date.now() - lastUpdate;

    if (diff >= INTERVAL) {
      await run("update_readme.js");
    } else {
      console.log("⏳ Intervalo mínimo ainda não atingido para update_readme.js");
    }

    const random = Math.random();
    if (random > 0.6) {
      const activityCache = readCache();
      const lastActivity = activityCache.lastActivity || 0;
      if (Date.now() - lastActivity >= 3 * 60 * 1000) {
        await run("activity.js");
      } else {
        console.log("⏳ Intervalo mínimo ainda não atingido para activity.js");
      }
    }

    await sleep(INTERVAL);
  }
}

loop();