var util = require('util');
var EventEmitter = require('events').EventEmitter;
var crud = require('./crud');
var http = require('http');
var https = require('https');
var url = require('url');
var statusCodes = http.STATUS_CODES;
var myutils = require('../myutils/myutils');
var validUrl = require('valid-url');
var log = require('../svrConfig/logger');

//pass in object versus single values
function Space(data){
    //space ID
    this.spaceId = data.spaceId;
    //Disable space but not delete on bot removal
    this.spaceActive = data.spaceActive;
    //Setup currently not in use
    this.setup = data.setup;
    //setting not in use
    this.dnsServer = null;
    //setting not in use
    this.conversation = data.conversation;
    //website used during monitoring
    this.website = null;
    //uptime count before sending uptime message
    this.upTime = 4;
    //counter for when to send up time message
    this.upTimeCounter = 0;
    //delay between ping website checks
    this.delay = 900000;
    //number of repititions before ending monitor service
    this.repetitions = 96;
    //handle holds interval ID to allow it to be cleared
    this.handle = null;
    //method used by ping
    this.method = 'GET';
    
}

util.inherits(Space,EventEmitter);

//Kick off ping
Space.prototype.init = function(){
    var self =  this;
    var delay = self.delay;
    var reps = self.repetitions;
    log.info("spaceObj.init ... ping started");
    self.pingInterval(delay, reps, function(){
        self.ping();
    });
    return self;
};
//sets interval to start ping
Space.prototype.pingInterval = function(delay, repetitions, cb){
    var self = this;
    var x = 0;
    self.handle = setInterval(function () {
        if (++x === repetitions) {
            cb();
            self.stopPing();
        }else{
            cb();
        }
    }, delay);
 return self;
};
//Ping method for checking website availability
Space.prototype.ping = function(){
    
    var self = this;
    var req;
    var options = url.parse(self.website);
    options.method = this.method;

    if(self.website.indexOf('https:') === 0) {
        req = https.request(options, function (res) {
           
            // Website is up
            if (res.statusCode === 200) {
                self.emit('up', res.statusCode);
                self.pingReport("up", res.statusCode);
                res.setEncoding('utf8');
            }
            // No error but website not ok
            else {
                self.emit('down',res.statusCode);
                self.pingReport("down", res.statusCode);
            }
        });
    }
    else {
        req = http.request(options, function (res) {
            // Website is up
            if (res.statusCode === 200) {
                self.emit('up', res.statusCode);
                self.pingReport("up", res.statusCode);
                res.setEncoding('utf8');
                
            }
            // No error but website not ok
            else {
                self.emit('down',res.statusCode);
                self.pingReport("down", res.statusCode);
            }
        });
    }

    req.on('error', function(err) {
        log.error("spaceObj.pintInterval: "+err);
        var data = self.responseData(404, statusCodes[404 +'']);
        self.emit('error', data);
        self.pingReport("down", data);
        
    });
    req.end();
    return this;
};
    
//generates either up time or down reports
Space.prototype.pingReport = function(status, code){
    var self = this;
    var time = Date.now();
    var websiteUp = ">**"+self.getFormatedDate(time)+" UTC**: Website "+self.website+" is currently up and has been responding for the last hour.<br>"+
                    " Code: "+code;
    var websiteDown = ">**"+self.getFormatedDate(time)+" UTC**: Website "+self.website+" has taken a tumble or is unknown.<br>"+
                    " Code: "+code+"<br>"+
                    "To stop alerts use **/monitor** *halt* command.";
    if(status === "up"){
        ++self.upTimeCounter
        if(self.upTime === self.upTimeCounter){
            self.upTimeCounter = 0;
        return myutils.sparkPost(websiteUp, self.spaceId)
            
        }else{
            return this;
        }
    }
    if(status === "down"){
        self.upTimeCounter = null;
        return myutils.sparkPost(websiteDown, self.spaceId);
    }
    return this;
};

Space.prototype.checkWebsite =  function(urltxt,cb){
    var self = this;
    if(validUrl.isWebUri(urltxt)) {
        log.info("spaceObj.checkweb: I am running as good uri");
        self.updateWebsite(urltxt);
        cb('uriOkay');
    }else{
        
        cb('uriNotOkay');
        log.error("spaceObj.checkWeb : URI broken");
    }
    return this;
};
Space.prototype.startPing =  function(){
    var self = this;
    
    self.init();
    
    return this;
};
Space.prototype.stopPing = function(){
    var self = this;
    clearInterval(self.handle);
    self.handle = null;
    myutils.sparkPost("Monitor is now halted.", self.spaceId);
    self.updateWebsite(null);
    self.upTimeCounter = 0;
    return self;
};
Space.prototype.updatednsServer = function(param){
    var self = this;
    self.dnsServer = param;
    return self;
};

Space.prototype.updateActive = function(param){
    var self = this;
    self.spaceActive = param;
    return self;
};

Space.prototype.updateWebsite = function(param){
    var self = this;
    self.website = param;
    return self;
};
Space.prototype.updateSetup = function(param){
    var self = this;
    self.spaceSetup = param;
    return self;
};
Space.prototype.writeToFile = function(){
    var self = this;
    crud.writeToJSON(function(){
        log.info("spaceObj.Writing to file......");
        self.emit('writeComplete');
    });
    return;
};

Space.prototype.getFormatedDate = function (time) {
    var currentDate = new Date(time);

    currentDate = currentDate.toISOString();
    currentDate = currentDate.replace(/T/, ' ');
    currentDate = currentDate.replace(/\..+/, '');

    return currentDate;
};
module.exports = Space;