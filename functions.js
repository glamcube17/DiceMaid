
// console.log('Functions included');

var functions = exports;

var fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'config.json'),
    config = JSON.parse(fs.readFileSync(filePath));
var prefix = config.prefix;

exports.rollDice = function (expr){
    expr = expr.replace(/\s/g,''); //remove all whitespace characters so we can ignore them in our regexes
    let _dice = expr.match(/(\d+)d/i);
    let _size = expr.match(/d(\d+)/i);
    let _mult = expr.match(/(?!d\d+)[x\*](\d+)/);
    let _modi = expr.match(/(\+\d+\)?|-\d+)\)?/);
    let dice = ( _dice && _dice[1] && !isNaN(parseInt(_dice[1])) ) ? parseInt(_dice[1]) : 1; 
    let size = ( _size && _size[1] && !isNaN(parseInt(_size[1])) ) ? parseInt(_size[1]) : 6; 
    let mult = ( _mult && _mult[1] && !isNaN(parseInt(_mult[1])) ) ? parseInt(_mult[1]) : 1;
    let modi = ( _modi && _modi[1] && !isNaN(parseInt(_modi[1])) ) ? parseInt(_modi[1]) : 0;
    
    let _divi; //it's out here so we can check if it's undefined or not later to decide which way to display it
    if(!_mult){
        _divi = expr.match(/(?!d\d+)\/(\d+)/); //allow for, say, 2d6/3 rather than 2d6x0.33
        mult = ( _divi && _divi[1] && !isNaN(parseInt(_divi[1])) ) ? 1/parseInt(_divi[1]) : mult;
    }
    //special cases
    let minface = 1;
    if(_size && _size[1] && _size[1][0] && _size[1][0] === '0'){ minface = 0; } //dice that start at 0 instead of 1
    // if(size === 6 && _size && size[1] && isNaN(parseInt(_size[1]))){
        // if(_size[1] === '%'){ size = 100; }
    // }else if(size === 66){
        // //@todo
    // }else if(size === 0){ return [0,'Thinkest thou me a fool??']; }
    
    let _keep = expr.match(/k(\d+)(L|H)?/i);
    let high = !/k(\d+)L/i.test(expr); //keep high unless keep low specified
    let keep = ( _keep && _keep[1] && !isNaN(parseInt(_keep[1])) ) ? parseInt(_keep[1]) : 999;
    
    let _drop = expr.match(/\-(L|H)/i);
    if(_drop){
        high = !( _drop[1] && _drop[1].toLowerCase() === 'h' ); //drop low unless drop high specified
        keep = dice - 1;
    }
    
    let exploding = /d(\d+)!/.test(expr);
    if(exploding && size <= 1){ exploding = false; } //that would be bad
    
    let rolls = [];
    let total = 0;
    for(let i = 0; i < dice; i++){
        let roll = Math.floor(minface + Math.random() * size);
        rolls.push(roll);
        total += roll;
        if(exploding && roll === size + minface-1){ dice++; } //increases the number of dice when max value is rolled
    }
    
    let keptrolls; //leave undefined if not dropping any rolls
    if(keep < dice){
        keptrolls = new Array(dice).fill(false); //which rolls are kept, so dropped rolls can be struck through later
        let keeps = new Array(keep).fill( ( high? 0 : size ) );
        let _rolls= rolls.slice(); //clone of rolls array
        for(let k = 0; k < keep; k++){
            let best = 0; //index of most keepable roll 
            for(let r = 0; r < _rolls.length; r++){
                if( high ? _rolls[r] > _rolls[best] : _rolls[r] < _rolls[best] ){ //whichever comparison is appropriate
                    best = r;
                }
            }
            keeps[k] = _rolls[best];
            _rolls[best] = (high? 0 : size); //avoid selecting it twice, but keep the indexes the same
            keptrolls[best] = true;
        }
        total = keeps.reduce( (a,b)=>a+b,0 ); //sum of the array
        // console.log(keeps);
    }
    total = Math.floor(total * mult + modi); //always round down
    //Build the string
    let outstr = 'Rolling ' + expr + ': [ ';
    for(let i = 0; i < rolls.length; i++){
        if(keptrolls && !keptrolls[i]){ outstr += '~~'+rolls[i]+'~~'; } //strikethrough rolls that were dropped
        else{ outstr += rolls[i]; }
        if(i+1 < rolls.length){ outstr += ' + '; }
    }
    outstr += ' ]';
    if(mult != 1){
        if(!_divi){ outstr += ' x '+mult; }
        else{ outstr += ' / ' + Math.round(1/mult); }
    }
    if(modi != 0){ outstr += ( mult>0 ? ' + '+modi : ' - '+(modi*-1) ); } //space between sign and number
    outstr += ' = **'+total+'**';
    return [total, outstr]; //return both the string and the numerical result just in case we want it
}












// exports.ms_to_dhmsString = function(duration){ //convert a duration in milliseconds to 'N days, M hours, and L minutes'
    // let days = parseInt(duration / (1000 * 60 * 60 * 24));
    // let hours = parseInt((duration / (1000 * 60 * 60)) % 24);
    // let minutes = parseInt((duration / (1000 * 60)) % 60);
    // let seconds = ( days+hours>0 ? -1 : parseInt((duration / (1000)) % 60) ); //don't show seconds except for short durs
    // let parts = [];
    // if(days>0){ parts.push( days+(days>1 ? ' days' : ' day') ); }
    // if(hours>0){ parts.push( hours+(hours>1 ? ' hours' : ' hour') ); }
    // if(minutes>0){ parts.push( minutes+(minutes>1 ? ' minutes' : ' minute') ); }
    // if(seconds>-1){ parts.push( seconds+(seconds!=1 ? ' seconds' : ' second') ); }
    // let str = '';
    // for(let i = 0; i < parts.length; ++i){
        // if(i > 0){
            // if(i === parts.length-1){ str += (parts.length>2 ? ', and ' : ' and '); } //oxford comma
            // else{ str += ', '; }
        // }
        // str += parts[i];
    // }
    // return str;
// }



// exports.formatBoondollars = function(boondollars){
    // let boonbucks = 0; let booncases = 0; let boonbonds = 0; let boonbanks = 0; let boonmints = 0;
    // if(boondollars > 10**30){ boonmints = Math.round(boondollars/(10**30)); boondollars = boondollars%(10**30); }
    // if(boondollars > 10**24){ boonbanks = Math.round(boondollars/(10**24)); boondollars = boondollars%(10**24); }
    // if(boondollars > 10**18){ boonbonds = Math.round(boondollars/(10**18)); boondollars = boondollars%(10**18); }
    // if(boondollars > 10**12){ booncases = Math.round(boondollars/(10**12)); boondollars = boondollars%(10**12); }
    // if(boondollars > 10** 6){ boonbucks = Math.round(boondollars/(10** 6)); boondollars = boondollars%(10** 6); }
    // let parts = [];
    // if(boonmints > 0){ parts.push( functions.commaSeparate(boonmints) + (boonmints!=1 ? ' boonmints' : ' boonmint') ); }
    // if(boonbanks > 0){ parts.push( functions.commaSeparate(boonbanks) + (boonbanks!=1 ? ' boonbanks' : ' boonbank') ); }
    // if(boonbonds > 0){ parts.push( functions.commaSeparate(boonbonds) + (boonbonds!=1 ? ' boonbonds' : ' boonbond') ); }
    // if(booncases > 0){ parts.push( functions.commaSeparate(booncases) + (booncases!=1 ? ' booncases' : ' booncase') ); }
    // if(boonbucks > 0){ parts.push( functions.commaSeparate(boonbucks) + (boonbucks!=1 ? ' boonbucks' : ' boonbuck') ); }
    // if(boondollars>0){ parts.push( functions.commaSeparate(boondollars)+(boondollars!=1?' boondollars':' boondollar') ); }
    // let str = '';
    // for(let i = 0; i < parts.length; ++i){
        // if(i > 0){
            // if(i === parts.length-1){ str += (parts.length>2 ? ', and ' : ' and '); } //oxford comma
            // else{ str += ', '; }
        // }
        // str += parts[i];
    // }
    // return str;
// }


// exports.commaSeparate = function(num){
    // let str = ''+num;
    // let arr = str.split(/\.(.+)/);
    // str = arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // if(arr.length > 1){ str = str.join(arr[1],'.'); }
    // return str;
// }








//do database things, but with promises.
exports.prototypeDatabase = function(db){
    //i don't know exactly why these seem to be needed (aren't db calls inherently async?) but it makes it work so *shrugs*
    db.getAsync = function (sql) {
        let that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if(err){ reject(err); }else{ resolve(row); }
            });
        });
    };
    db.allAsync = function (sql) {
        let that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, rows) {
                if(err){ reject(err); }else{ resolve(row); }
            });
        });
    };
    db.runAsync = function (sql) {
        let that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function(err) {
                if(err){ reject(err); }else{ resolve(); }
            });
        })
    };
    
    return db;
}









