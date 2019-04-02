'use strict';
var fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'config.json'),
    config = JSON.parse(fs.readFileSync(filePath));
var prefix = config.prefix;
var functions = require(path.join(__dirname,'functions.js'));

const sqlite = require('sqlite3').verbose();
var db = new sqlite.Database(__dirname+'/dmdbase.db',
    (e)=>{if(e){return console.error(e.message);}console.log('Opened DM database');});
db = functions.prototypeDatabase(db); //give it some functions from SO so it works - @todo this is probably bad??

// Set up the database (run manually when setting things up)
// Also serves as a reference for the database schema
// might either deprecate or move to a thing that's automatically run on startup

(async function(){
    await db.runAsync('CREATE TABLE IF NOT EXISTS Uwu(uid PRIMARY KEY, uwus NOT NULL DEFAULT 0)');
    // await db.runAsync('CREATE TABLE IF NOT EXISTS Stats(uid PRIMARY KEY, favor, stress');
    
    console.log( await db.allAsync(`SELECT * FROM Uwu`) );
    db.close((e)=>{if(e){return console.error(e.message);}console.log('Closed DM database');});
})();

