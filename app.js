const { randomInt } = require('crypto');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const fs = require('fs');
const client = new Discord.Client();
const CronJob = require('cron').CronJob;
var JsonConfig;
loadConfig();
var CronTasksChannels = {};
var KickedList = [];
 
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('!fouziAdd [phrase]');
});
 
client.on('message', async msg => {

  /**
   * Check If is !fouzi command
   */
  if(msg.content.length < 6 || msg.content.substring(0,6) != '!fouzi'){
    return;
  }

  /**
   * IS A COMMAND
   */
  var command = null,
      arguments = [];

  if(msg.content.length > 6 && msg.content.substring(7,msg.content.length).length > 1){
    arguments = msg.content.substring(7).split(' ');
  }

  if(arguments.length >= 1){
    command = arguments[0];
    arguments.shift();
  }

  if(command == null && arguments.length == 0){
    sendPhrase(msg);
    return
  }else if(command !== null && command.match(/[0-9]+/g) !== null){
    if(JsonConfig.phrases[parseInt(command)] === undefined){
      msg.channel.send('Monsieur, vous êtes avec nous ? Car faut suivre votre TP ! La phrase n\'existe pas !');
      return;
    }
    var phrase = JsonConfig.phrases[parseInt(command)];
    msg.channel.send(phrase);
  }

  if(command == 'help'){
    msg.channel.send('Monsieur, sortez votre résumé !');
    msg.channel.send('``!fouzi`` => Affiche une phrase aléatoire');
    msg.channel.send('``!fouzi [int]`` => Affiche une phrase spécifique');
    msg.channel.send('``!fouzi add [string]`` => Ajoute une phrase au dictionnaire du FouziBot');
    msg.channel.send('``!fouzi mp [all|@user]`` => Le FouziBot envoie un message aux personnes sélectionnées');
    msg.channel.send('``!fouzi time`` => Le FouziBot vous informe que c\'est l\'heure de la souffrance.');
    msg.channel.send('``!fouzi help`` => Affiche cette page d\'aide');
    return;
  }

  if(command == 'mp'){
    if(arguments.join(' ') == 'all'){

    }else if(arguments.join(' ').match(/<@![0-9]{18}>/g) !== null){
      var matches = arguments.join(' ').match(/<@![0-9]{18}>/g);
      matches.forEach(match => {
        var id = match.substring(3,21);
        sendPhrase(msg.guild.members.resolve(id).user);
      });
    }
    return;
  }

  if(command == 'liste'){
    var result = '';
    i = 0;
    do {
      if(result.length < 2000)
      result += '``' + JsonConfig.phrases[i] + '[' + i + '] ``' + "\r\n";
      i++;
    } while (i < JsonConfig.phrases.length && result.length < 2000);
    if(msg.channel.type == 'text'){
      msg.member.user.send(result);
    }else{
      msg.channel.send(result);
    }
    return;
  }

  if(command == 'time'){
    msg.channel.send(':warning: Monsieur ! C\'est l\'heure :timer: __**FOUZI TIME !!!**__ :timer:  :warning:');
    msg.channel.send('https://tenor.com/view/hitmans-bodyguard-hitmans-bodyguard-gi-fs-samuel-l-jackson-time-tick-tock-gif-8352665');
    return;
  }

  if(command == 'add' && arguments.length >= 1){
    JsonConfig.phrases.push(arguments.join(' '));
    console.log('La phrase : "'+arguments.join(' ')+'" ['+(JsonConfig.phrases.length-1)+'] a été ajouté au dictionnaire.');
    msg.reply('ta phrase a été ajoutée.');
    saveConfig();
    return;
  }

  if(command == 'join'){
    if(msg.member.voice.channel === null){
      msg.reply('monsieur, tu doit être dans un channel vocal !');
      return;
    }
    if(!msg.member.voice.channel.joinable){
      msg.reply('monsieur, la porte est fermée. J\'arrive pas à join !');
      return;
    }
    const connection = await msg.member.voice.channel.join();
    const dispatcher = connection.play(ytdl('https://www.youtube.com/watch?v=qznbecUX3Fc', {filter: 'audioonly'}));
    return;
  }

  msg.reply('La commande n\'existe pas !');
});

client.on('guildMemberAdd', member => {
  if(member.guild.id === '753227524678352986' && KickedList.includes(member.user.id)){
    member.roles.add(member.guild.roles.resolve('753320318449221684'));
  }
});
 
client.login('NzYwNzk0NjQxNDM5NTIyODU2.X3RPOQ.B02xWXzg6_bw0nCzxhl1YG0K6bU');

function saveConfig(debug = false){
  fs.writeFileSync(__dirname + '/config.json', JSON.stringify(JsonConfig, null, '\t'));
  if(debug)
    console.log(JsonConfig);
  return true;
}

function loadConfig(debug = false){
  JsonConfig = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
}

function sendPhrase(msg){
  var index = getRandomInt(JsonConfig.phrases.length);
  index = 5;

  var phrase = JsonConfig.phrases[index] + '  ['+index+']';
  msg.channel.send(phrase).catch(error => {
    console.log('Un message n\'a pas pu être envoyé à '+(msg.channel.id));
  });

  if(msg.channel.type == 'text' && index == 10){
    if(msg.member.kickable){
      sendInviteToUserAfterKick(msg.channel,msg.member);
    }else{
      msg.reply('tu as de la chance ! Je peux pas te kick !');
    }
  }else{
    if(msg.member.voice.channel !== null && JsonConfig.audio[String(index)] !== undefined && JsonConfig.audio[String(index)].file !== undefined){
      msg.member.voice.channel.join().then(connection => {
        const dispatcher = connection.play(JsonConfig.audio[String(index)].file, {volume: 4});
        dispatcher.on('finish', () => {
          setTimeout(()=>{connection.disconnect();},1000);
        });
      });
    }
  }
}

async function sendInviteToUserAfterKick(channel,member) {
  let invite = await channel.createInvite().catch(console.log);

  member.user.send(invite ? `Monsieur, reviens : ${invite}` : "There has been an error during the creation of the invite.").then(() => {
    KickedList.push(member.user.id);
    member.kick();
  });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
