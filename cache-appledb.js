const https = require('node:https')
const fs = require('node:fs')
const request = require('sync-request')
const url = 'https://api.appledb.dev/main.json'

if (!fs.existsSync('./appledb')) fs.mkdirSync('appledb')

let newHash = request('GET', 'https://api.appledb.dev/hash')
let downloadDb = true

if (newHash) {
    newHash = newHash.getBody('utf8')
    
    if (!fs.existsSync('./appledb/hash')) {
        fs.writeFileSync('./appledb/hash', newHash)
    } else {
        const storedHash = fs.readFileSync('./appledb/hash', 'utf8')
        if (newHash == storedHash) downloadDb = false
        else fs.writeFileSync('./appledb/hash', newHash)
    }
}

if (downloadDb) https.get(url,(res) => {
    const path = './appledb/main.json'; 
    const filePath = fs.createWriteStream(path);
    res.pipe(filePath);
    filePath.on('finish',() => {
        filePath.close();
        console.log('Downloaded latest database'); 
    })
})
else {
    console.log('Database is already up to date')
}