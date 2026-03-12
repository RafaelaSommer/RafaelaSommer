const fs = require("fs")
const path = require("path")

const cacheFile =
  path.join(__dirname,"..",".github","cache.json")

function readCache(){

  try{

    if(!fs.existsSync(cacheFile)){
      return {}
    }

    return JSON.parse(
      fs.readFileSync(cacheFile,"utf8")
    )

  }catch{

    return {}

  }

}

function writeCache(data){

  const dir = path.dirname(cacheFile)

  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir,{recursive:true})
  }

  fs.writeFileSync(
    cacheFile,
    JSON.stringify(data,null,2)
  )

}

module.exports = { readCache, writeCache }