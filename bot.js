const Discord = require('discord.js')
const bot = new Discord.Client()

const jsonfile = require('jsonfile');
var playlist = require("./playlist.json")
var history = require("./history.json")
const token = require("./auth.json").token
const gtoken = require("./auth.json").google
const request = require('request');


// https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=YOUR-API-KEY&id=YOUR-VID

function messageHandler(key, value, map){
    if(key){
        console.log(key.content)
        let x = key.content.substring(0,1)
        let keyword = key.content.substring(0,3).toLowerCase()
        if(keyword == "bot" || keyword == "bro" || key.author.bot || x == '!' || x == '*' || x == '>') key.delete()
    }
}

function getPlaylist(m, args){
    let jsonTable = playlist.table.find(el => el.name == args[1].toLowerCase())
    if(!jsonTable) {
        m.reply("le nom que tu m'as donné ne marche pas mon bro ...")
        return
    }
    let textToSend = ""
    let i = 0
    jsonTable.musics.forEach(music => {
        if(music != null) textToSend += "<" + i + "> " + music + "\n"
        i += 1
    })
    m.channel.send("Tiens mon bro !")
    m.channel.send("```\n" + textToSend + "```")
}

function addPlaylist(m, args){
    for(let i = 4; i < args.length ; i += 1){
        args[3] +=  " " + args[i]
    }
    args[1] = args[1].toLowerCase()

    playlist = require("./playlist.json")
    let jsonTable = playlist.table.find(el => el.name == args[1])

    if(!jsonTable) {
        playlist.table.push({name : args[1], musics : [args[3]]})
        m.reply("ta playlist a été créée avec " + args[3] + " dedans !")
    }
    else{
        playlist.table.forEach(el => {
            if(el.name == args[1]) el.musics.push(args[3])
        })
        m.reply(args[3] + " à été ajouté à la playlist " + args[1])
    }
    jsonfile.writeFile('playlist.json', playlist, {spaces:2}/*, function(err){if(err != null)console.log(err);}*/);
}

function removePlayList(m, args){
    args[1] = args[1].toLowerCase()

    playlist = require("./playlist.json")
    let jsonTable = playlist.table.find(el => el.name == args[1])
    let done = false
    if(!jsonTable) m.reply("la playlist n'existe pas")
    else{
        playlist.table.forEach(el => {
            if(el.name == args[1]) done = delete el.musics[args[3]]
        })
        if(done) m.reply(args[3] + " à été supprimé de la playlist " + args[1])
        else m.reply(args[3] + " n'a pas été trouvé dans la playlist " + args[1])
    }
    jsonfile.writeFile('playlist.json', playlist, {spaces:2}/*, function(err){if(err != null)console.log(err);}*/);
}

function downloadPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

async function getVideoName(c) {
    vidId = c.replace("https://www.youtube.com/watch?v=","").substring(0,11)
    const url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&key=" + gtoken + "&id=" + vidId
    const htmlRes = await downloadPage(url)
    const title = JSON.parse(htmlRes).items[0].snippet.title
    return title
}

async function addToHistory(m){
    let content = m.content.replace("!play ","").replace("!p ","")
    if(content.includes("https://www.youtube")) content = await getVideoName(content)
    const customAuthor = {username:m.author.username, avatar:m.author.avatarURL()}
    const item = {author:customAuthor, content:content}
    history.tab.push(item)
    jsonfile.writeFile('history.json', history, {spaces:2});
    console.log("Wrote : " + item)
}

function flushHistory(){
    history = {tab:[]}
    console.log("<> Flushing history !")
    jsonfile.writeFile('history.json', history, {spaces:2});
}

function strHistory(m, numberToDisplay){
    numberToDisplay = numberToDisplay || 10
    const embed = new Discord.MessageEmbed()
        .setColor("#55ff55")
        .setTitle('Historique de Rythm')
	    .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
	    .setAuthor(m.author.username, m.author.avatarURL(), m.author.avatarURL())
	    .setThumbnail("https://cdn.discordapp.com/app-icons/715320318889033820/9aa53543f4424dbe283c8a6a304bbb7e.png?size=256&quot")

    const generateFields = function(embed){
        let start = history.tab.length - numberToDisplay
        if(start < 0) start = 0
        for(let x = start; x < history.tab.length; x++){
            embed.addField(history.tab[x].author.username, history.tab[x].content)
        }
    }
    generateFields(embed)
    return embed
}

bot.on('ready', () => {
    console.log('Bot is ready')
})

bot.on('message', (m) => {
    if (m.author == bot.user) return
    
    let rythmPrefix = m.content.substring(0,1)
    let broPrefix = m.content.substring(0,3)

    if(broPrefix == "bro" || broPrefix == "bot"){
        let args = m.content.substring(4).split(" ")
        console.log(args)
        switch(args[0].toLowerCase()){
            case 'clear': case 'c':
                m.channel.send("En train de nettoyer mon bro !").then(m => m.delete())
                m.channel.fetch().then(c => {
                    c.messages.fetch().then(m => {
                        m.forEach(messageHandler);
                    })
                })
                break;
            
            case 'coucou': case 'plop': case 'bonjour':
                m.reply("salut mon bro !")
                break;

            case 'playlist': case 'pl': case 'p':
                if(!args[1]) {
                    m.reply("Utilisation de la commande playlist (aliases pl et p) :```> bro playlist <nom de la playlist> (add|delete) (nom|id) ```");
                    return
                }
                else{
                    if(!args[2]) getPlaylist(m, args)
                    else if(!args[3]) {m.reply("Il me faut un nom ou un id pour continuer bro !```> bro playlist <nom de la playlist> (add|delete) (nom|id) ```"); return}
                    else{
                        args[2] = args[2].toLowerCase()
                        if(args[2] == "add" || args[2] == 'a') addPlaylist(m, args)
                        else if(args[2] == "remove" || args[2] == "rem" || args[2] == "r" || args[2] == "delete" || args[2] == "del" || args[2] == "d") removePlayList(m, args)
                        else m.reply("Utilisation de la commande playlist (aliases pl et p) :```> bro playlist <nom de la playlist> (add|delete) (nom|id) ```");
                    }
                }
                break;
            
            case 'help':
                m.reply("Voici comment je marche mon bro !")
                m.channel.send("```Mes allias sont bro et bot\n\n \
                bro h|historique > Envoie l'historique des sons qui ont été envoyés à Rythm \n \
                bro clear|c > Clear les messages des bots vieux de moins de deux semaines \n \
                bro playlist|pl|p > Aficher ou gerer une playlist \n \
                bro coucou|plop|bonjour > Pour me dire bonjour !```")
                break;

            case 'flush':
                if(m.author.id == "229700193409302528") flushHistory()
                else console.log("Unauthorized User")
                m.delete()
                break;
            
            case 'h' : case "history":
                let mess = m.channel.send(strHistory(m, args[1]))
                mess.then((msg) => {
                    setTimeout(() => { 
                        try{
                            m.delete()
                            msg.delete()
                        }
                        catch{}
                    }, 30000);
                })
                break;

            default:
                m.reply("j'ai pas compris bro ...")
                break;
        }
    }
    else if(rythmPrefix == '!' || rythmPrefix == '*' || rythmPrefix == '>'){
        let splitted = m.content.substring(1).split(" ")
        let functionCalled = splitted[0]
        switch(functionCalled){
            case 'p' : case 'play':
                if(splitted.length < 2) return;
                addToHistory(m)
                setTimeout(() => { 
                    try{m.delete()}
                    catch{}
                }, 30000);
                break;
            
            case "*Playing**":
                break;

            default:
                console.log("User called Rythm for : " + functionCalled)
                break;
        }
    }
    else if(m.author.id == "235088799074484224" || m.author.id == "415062217596076033" || m.author.id == "252128902418268161"){
        setTimeout(() => {
            try{m.delete()}
            catch{}
        }, 30000);
    }
})

bot.login(token)
