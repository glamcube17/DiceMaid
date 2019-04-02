/* ********************************************************************** *
 * Copyright 2018 The ED Bot contributors                                 *
 *                                                                        *
 * Permission is hereby granted, free of charge, to any person obtaining  *
 * a copy of this software and associated documentation files             *
 * (the "Software"), to deal in the Software without restriction,         *
 * including without limitation the rights to use, copy, modify, merge,   *
 * publish, distribute, sublicense, and/or sell copies of the Software,   *
 * and to permit persons to whom the Software is furnished to do so,      *
 * subject to the following conditions:                                   *
 *                                                                        *
 * The above copyright notice and this permission notice shall be         *
 * included in all copies or substantial portions of the Software.        *
 *                                                                        *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,        *
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF     *
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. *
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY   *
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,   *
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE      *
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.                 *
 * ********************************************************************** */

'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();

var fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'config.json'),
    config = JSON.parse(fs.readFileSync(filePath));
var prefix = config.prefix;

var functions = require(path.join(__dirname,'functions.js'));

const sqlite = require('sqlite3');//.verbose();
var db = new sqlite.Database(__dirname+'/dmdbase.db',
    (e)=>{if(e){return console.error(e.message);}console.log('Opened database');});
db = functions.prototypeDatabase(db); //give it some functions from SO so it works - @todo this is probably bad??
functions.db = db;

const helpstring = "Commands:\n"
                  +"`!help [command]` - print this message or more information about specific command\n"
                  +"`!roll AdBxC+D` - roll dice as specified in dice notation\n"
const helpdict = {
    "help": "Yes, you're very clever",
    "roll": "Evaluates and rolls an expression in dice notation, AdBxC+D.\n"
           +"Supports multiple rolls in one message without additional invokations,\n"
           +" e.g. `!roll 1d6x2, 1d6x3, d4, 2d8 + 3`.\n"
           +"`!roll` can be anywhere in the message, and each roll can be separated by arbitrary text.\n"
           +"\nAdditional options:\n"
           +"Division: Use / in place of x. The result will be rounded down.\n"
           +"- Example: `!roll 2d6/3`\n"
           +"Zero-Indexed Dice: Add a 0 before the size of the die and it will go from 0..N-1 rather than 1..N.\n"
           +"- Example: `!roll 1d02` will roll 0 or 1; `!roll 1d010` will roll a digit from 0..9; etc.\n"
           +"Exploding dice: Roll an additional die for each die that rolls the maximum value.\n"
           +"- Syntax: `!roll AdB!`\n"
           +"- Example: `!roll 2d4! x 2`\n"
           +"Drop Lowest/Highest: Don't include the lowest/highest roll in the total.\n"
           +"- Syntax: `!roll AdB-L`, `!roll AdB-H`\n"
           +"- Example: `!roll 4d6-L`, `!roll 2d20-L`\n"
           +"Keep N: Only include the N highest/lowest rolls in the total.\n"
           +"- Syntax: `!roll AdB(kNH)`, `!roll AdB(kNL)` (defaults to H)\n"
           +"- Example: `!roll 4d6(k3)` (equivalent to `!roll 4d6-L`)",
    "me": "I don't know how to help you. Maybe you should ask a human for that.",
    "help i'm being repressed": "Bloody peasants.",
    "default": "I don't know what that means. Try `!help` for a list of topics you can ask me about."
}

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', async message => {
    if( message.author.bot ){ return; } //never reply to itself or other bots
    else if (message.content.toLowerCase() === 'ping') {
        message.reply('Pong');
    }else if (message.content.toLowerCase() === 'pingu') {
        message.reply('Noot noot!');
    }
    // if( (config.isTestInstance) != (message.channel.id == config.testChannel) ){ return; }
	
	if (message.content.toLowerCase().includes(`${prefix}roll`)){
        //get an array of each valid dice notation expression in the message, as discerned by this MONSTER REGEX
        // legends say this is the regex with which the Norse gods will shatter the Bifrost and bring about the end of the world
        // if you're trying to make sense of it, I'm so sorry
        let exprarr = message.content.match(
                /(\d+\s*)?d\s*(\d+)(!)?(?:(\(?k\d+\-?[LH]?\)?)|\-(L|H))?(\s*[x\*\/]\s*\d+)?(\s*[\+\-]\s*\d+(?!\s*d\s*\d))?/gi
            );
        console.log(exprarr);
        if(!exprarr){ message.reply("Roll what? (Try `!help roll` if you're confused)"); }
        else{
            let results = '';
            for(let i = 0; i < exprarr.length; i++){
                let expr = exprarr[i].trim();
                results += '\n' + functions.rollDice(expr)[1];
            }
            message.reply(results);
        }
    }
    else if(message.content.split(' ')[0].toLowerCase() === `${prefix}help`){
        let topic = message.content.split(/ (.+)/)[1]; //get everything after the first space
        if(topic){
            message.reply(helpdict[topic.toLowerCase()] || helpdict['default']);
        }else{
            message.reply(helpstring);
        }
    }
    else if (message.content.split(' ')[0].toLowerCase().charAt(0) === `${prefix}`
                //make sure it's not just like !?! or something
             && message.content.match(/^![^!?].*[a-zA-Z]+/) ) { //@todo not ideal but i doubt we're changing the prefix
        message.reply('What\'s that supposed to mean? Idiot...');
    }
    else if (message.mentions.users.array().length != 0) {
        var mentions = message.mentions.users.array();
        for (var user in mentions) {
            if (mentions[user].id === config.id) {
                let content = message.content.split(' ').splice(1).join(' ');
                if(content.toLowerCase.includes('uwu')) {
                    message.reply('uwu'); //uwu
                }else{
                    message.reply('W-what\'s that supposed to mean? Idiot...');
                }
            }
        }
    }
    
    //                                   //separate out accents/etc  //strip accents  //common words       //uwu umu nwn owo ono
    else if( message.content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]|own|now|nnn|ooo/g, '').match(/\b[uno][wmn][uno]\b/)){ //strip accents
        (async function(message){ //hack so I can use await instead of callback hell
            let uwu = client.emojis.find(emoji => emoji.name === 'uwu');
            message.react(`${uwu ? uwu.id : '⛎'}`);
            let user = message.author.id;
            let q1 = await db.getAsync(`SELECT uwus FROM Uwu WHERE uid == ${user}`);
            let uwus = ( q1 ? q1.uwus : 0 ) + 1;
            await db.runAsync(`INSERT OR REPLACE INTO Uwu(uid, uwus) VALUES (${user},${uwus})`); //I wanted to use upsert but nooo
            let q2 = await db.getAsync(`SELECT SUM(uwus) AS sum FROM Uwu`); //should never be undefined since we just inserted a row
            let total = ( q2 ? q2.sum : -1 );
            let override = ( /.*(69|420).*/.test( uwus+' '+total ) ); //check for funny numbers
            if( (Math.random() < 0.1) || override ){
                let msg = `uwu detected. You have uwu'd ${uwus} times so far. Total uwus logged: ${total}.`;
                if(override){ msg += "\nowo it's the "+( (uwus+' '+total).includes('69') ? 'sex' : 'weed' )+" number!!" }
                message.reply(msg);
            }
            await message.react(`${uwu ? uwu.id : '⛎'}`); //make sure it's resolved by now
            message.reactions.first().remove(client.user);
        })(message);
    }
    else if (message.content.toLowerCase() === 'does the black moon howl?') {
        message.reply('Only when day breaks');
    }
});

client.login(config.token);





