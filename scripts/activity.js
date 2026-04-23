const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const { DateTime } = require("luxon")

const ROOT = path.resolve(__dirname, "..")
const ACTIVITY_DIR = path.join(ROOT, "activity")

function randomMessage() {
  const msgs = [
    // 🚀 Desenvolvimento
    "🚀 Implementando nova funcionalidade",
    "✨ Adicionando melhorias no sistema",
    "⚡ Ajustes de performance no código",
    "🔥 Melhorando fluxo da aplicação",
    "🧠 Refatorando estrutura do projeto",

    // 🐛 Bugs
    "🐛 Corrigindo bug inesperado",
    "🔧 Ajuste fino em funcionalidade",
    "🩹 Hotfix aplicado",
    "🚑 Correção urgente no sistema",

    // 📦 Dependências
    "📦 Atualizando dependências do projeto",
    "⬆️ Upgrade de bibliotecas",
    "🔄 Sincronizando pacotes",

    // 📊 Dados / logs
    "📊 Atualizando dados internos",
    "📝 Registro automático de atividade",
    "📈 Ajustes em relatórios",
    "📂 Organização de arquivos internos",

    // 🧪 Testes
    "🧪 Adicionando testes",
    "✅ Melhorando cobertura de testes",
    "🔍 Revisando comportamento do sistema",

    // 🎨 UI / UX
    "🎨 Ajustes na interface",
    "🖌️ Melhorias visuais",
    "📱 Responsividade aprimorada",

    // ⚙️ Manutenção
    "⚙️ Manutenção geral do sistema",
    "🔄 Pequenas melhorias internas",
    "🧹 Limpeza de código",
    "📌 Ajustes diversos",

    // 🤖 Automação
    "🤖 Execução automática de rotina",
    "⏱️ Atualização agendada",
    "🔁 Processo automático executado",

    // 🔐 Segurança
    "🔐 Ajustes de segurança",
    "🛡️ Melhorando proteção do sistema",

    // 🌐 Geral
    "🌐 Atualização geral do projeto",
    "📢 Pequenas melhorias aplicadas",
    "🔍 Revisão de código concluída"
  ]

  return msgs[Math.floor(Math.random() * msgs.length)]
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function createActivityFile() {
  ensureDirectoryExists(ACTIVITY_DIR)

  const timestamp = DateTime.now().toFormat("yyyy-MM-dd_HH-mm-ss")
  const filePath = path.join(ACTIVITY_DIR, `activity-${timestamp}.md`)

  const content = `# Activity Log

Atualização automática do repositório.

📅 Data: ${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}
🕒 ISO: ${DateTime.now().toISO()}
`

  fs.writeFileSync(filePath, content, "utf-8")

  console.log(`📄 Arquivo criado: ${filePath}`)
  return filePath
}

function runCommand(command) {
  try {
    execSync(command, { cwd: ROOT, stdio: "inherit" })
  } catch (error) {
    console.error(`❌ Erro ao executar: ${command}`)
    throw error
  }
}

function commit(file) {
  try {
    runCommand(`git add "${file}"`)

    const message = randomMessage()
    runCommand(`git commit -m "${message}"`)

    runCommand("git push origin HEAD")

    console.log("🚀 Commit automático realizado com sucesso!")

  } catch (error) {
    console.log("⚠️ Nenhuma alteração para commit ou erro ocorreu.")
  }
}

function main() {
  try {
    const file = createActivityFile()
    commit(file)
  } catch (error) {
    console.error("❌ Erro geral:", error.message)
  }
}

main()