#!/usr/bin/env node
require("dotenv").config();

const { spawn } = require("child_process");
const { DateTime } = require("luxon");
const path = require("path");
const { readCache } = require("./cache");

const ROOT = path.join(__dirname, "..");
const SETTINGS = JSON.parse(require("fs").readFileSync(path.join(ROOT, ".github/settings.json")));
const INTERVAL = SETTINGS.interval_minutes * 60000;
const ACTIVITY_INTERVAL = 3 * 60 * 1000;
const TZ = SETTINGS.timezone;

function run(script) {
  const scriptPath = path.join(ROOT, "scripts", script);
  if (!require("fs").existsSync(scriptPath)) return;
  const child = spawn("node", [scriptPath], { stdio: "inherit" });
  child.on("error", err => console.log(`⚠️ Erro ao executar ${script}:`, err.message));
}

async function loop() {
  console.log("🤖 Bot Local Iniciado");
  while (true) {
    const now = DateTime.now().setZone(TZ);
    const cache = readCache();
    const nowMs = Date.now();

    if (nowMs - (cache.lastUpdate || 0) >= INTERVAL) run("update_readme.js");
    if (Math.random() > 0.6 && nowMs - (cache.lastActivity || 0) >= ACTIVITY_INTERVAL) run("activity.js");

    await new Promise(r => setTimeout(r, 5000));
  }
}

loop();