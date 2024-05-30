/*
https://www.npmjs.com/package/node-schedule
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
*/
const http = require('http');
const fs = require('fs');

const schedule = require('node-schedule');
const cronstrue = require('cronstrue');
let logs = require('./IPlog.json');
const { spawn } = require('child_process');

let test = require('./test');
const mail = require('./mail');
const ownTools = require('./ownTools');

const colorette = require('colorette');

let isWritingJsonLog = true;
let isSendingMails = false;
let isShowingTaskbarIcons = true;
let isShowingTestIcon = false;
let isCheckingIP = true;

let shouldTestWriteMail = false;
let shouldTestSendMail = false;

let IPtestStatus = false;
let firstTestDone = false;

let timeLastConnected4 = ownTools.getTime();
let timeLastConnected6 = ownTools.getTime();
let logJob;
let currentLog = {};

let Tray = require("ctray");
const path = require('path');

process.stdin.setEncoding('utf8');

let settings;
try {
  settings = require('./settings.json');
  setupScheduled()
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    const blankSettings = {
      	"CLIENT_ID": '',
    	"CLIENT_SECRET": '',
    	"REFRESH_TOKEN": '',
    	"REDIRECT_URI": '',
    	"MAIL_FROM": '',
		"MAIL_TO": '',
    	"logSchedule": '*/10 */1 * * * *',
    	"mailSchedule": '0 16 * * 5',
    };
  
    fs.writeFile('./settings.json', JSON.stringify(blankSettings, null, 2), 'utf8', (err) => {
    	console.log('\n\n\n\n!!! Please fill out settings.json !!!');
      	process.exit();
    });
  } else {
    console.log('Error loading settings:', err);
  }

}

/*
fs.writeFile("IPLogTemp.json", "[]", err => {
	if (err) throw err; 
	console.log("cleared temp log");
});
*/

//console.log( 'testing: ' + (ownTools.seconds2time(ownTools.reverseTime('2023-05-07T07:33:00+02:00').unix  % 86400, "HH:MM:SS")))

fs.watchFile('./test.js', () => {
	console.log('Reloading test.js');
	delete require.cache[require.resolve('./test')];
	const updatedModule = require('./test');
	console.log('test.js reloaded.');
	test = updatedModule;
});

function setupScheduled() {
	console.log(
		'IPLog - ready' + '\n' + 'writing logs: ' + isWritingJsonLog + '\n' +
		'IPLog: ' + cronstrue.toString(settings.logSchedule)  
	);
	
	
	
	if (isSendingMails) {
		console.log ('\n' + 'sending Email: ' + isSendingMails + '\n' + 'Mail: ' + cronstrue.toString(settings.mailSchedule))
	}else{console.log('\n' + 'sending Email: ' + isSendingMails)};
	
	//console.log('logging IP at ' + ownTools.getTime());makeLog(); //LOG TEST
	
	if (isCheckingIP) {
		logJob = schedule.scheduleJob(settings.logSchedule, function(){ 
			console.log('logging IP at ' + ownTools.getTime());
			makeLog();
		});
	};
	
	if (isSendingMails) {
		const mailJob = schedule.scheduleJob(settings.mailSchedule, async function(){ 
			console.log('sending email at ' + ownTools.getTime());
			mail.send(settings.MAIL_TO, 'IPLog', await mail.write(await ownTools.findChanges(logs)))
				.then((result) => console.log(result, '\n', 'email sent successfully', '\n'))
				.catch((error) => console.error(error.message, '\n', 'email failed', '\n'));
		});
	};

}



if (isShowingTaskbarIcons) {
	if(isShowingTestIcon) global.trayTest = new Tray(path.join(__dirname, 'images', 'orangev4.ico' ));
	global.trayv4 = new Tray(path.join(__dirname, 'images', 'orangev4.ico' ));
	global.trayv6 = new Tray(path.join(__dirname, 'images', 'orangev6.ico' ));
	trayv4.tooltip = "Waiting for first test...";
	trayv6.tooltip = "Waiting for first test...";

	const countdownJob = schedule.scheduleJob('*/1 * * * * *', function(){
		//console.log(currentLog);
		//console.log("ipify: " + ownTools.isIPv4Address(currentLog.ipifyIPv4))
			if (firstTestDone) {
				setTrayIcon(4,ownTools.isIPv4Address(currentLog.ipifyIPv4) || ownTools.isIPv4Address(currentLog.testIPv4));
				setTrayIcon(6,ownTools.isIPv6Address(currentLog.ipifyIPv6) || ownTools.isIPv6Address(currentLog.testIPv6));
			}
    	}
	);

};


if (isShowingTestIcon) {
	trayTest.tooltip = "Waiting for first test...";
	let icons = ['truev4.ico', 'orangev4.ico', 'falsev4.ico', 'truev6.ico', 'orangev6.ico', 'falsev6.ico']
	let i = 0
	setInterval(() => {
        trayTest.icon = path.join(__dirname, 'images', icons[i]);
        console.log(icons[i]);
        i++;
        if (i === icons.length) {
            i = 0;
        }
    }, 1000);
}

async function sendMailTest(){ 
	console.log('sending email at ' + ownTools.getTime());
	mail.send(settings.MAIL_TO, 'IPLog', await mail.write(await ownTools.findChanges(logs)))
		.then((result) => console.log(result, '\n', 'email sent successfully', '\n'))
		.catch((error) => console.error(error.message, '\n', 'email failed', '\n'));
}
if (shouldTestSendMail) {
	sendMailTest();
};

  async function makeMailTest() {
	const htmlOutput = await mail.write(await ownTools.findChanges(logs));
	logsBeingWritten = true;
	fs.writeFile('mail.html', htmlOutput, (err) => {
	  if (err) {
		console.error(err);
	  } else {
		console.log('File created! \n' + path.resolve("mail.html"));
	  }
	});
  };
  if (shouldTestWriteMail) {
	makeMailTest();
  };

async function makeLog() {
	newLog = {};
	IPtestStatus = true;
	newLog.time = ownTools.getTime();
	[newLog.ipifyIPv4, newLog.ipifyIPv6, newLog.testIPv4, newLog.testIPv6] = await Promise.all([
		getIP('api4.ipify.org'),
		getIP('api6.ipify.org'),
		getIP('v4.ipv6-test.com', '/api/myip.php'),
		getIP('v6.ipv6-test.com', '/api/myip.php')
	])

	currentLog = newLog;
	console.log(currentLog);
	firstTestDone = true;
	IPtestStatus = false;


	if (isWritingJsonLog) {
		/*
		if (isWritingJsonLog) {
			logs.push(currentLog);
			const logData = JSON.stringify(logs);

			const fd = fs.openSync("IPLog.json", openSync.O_RDWR | openSync.O_CREAT | openSync.O_TRUNC | openSync.O_SYNC | openSync.O_DIRECT);
 			fs.writeSync(fd, logData);
  			fs.fsyncSync(fd);
  			fs.closeSync(fd);

  			console.log("done writing last log");*/
		  /*
			fs.writeFile("IPLog.json", logData, err => {
			  	if (err) throw err;
		  
			  	fs.fsync(
					fs.openSync("IPLog.json", "r+"), syncErr => {
						if (syncErr) {
						console.error("Error while syncing file data:", syncErr);
						} else {
						console.log("done writing last log");
						}
			  		});
			});
			
		}
*/
		logs.push(currentLog);
		fs.writeFile("IPLogTemp.json", JSON.stringify(logs), err => {
			if (err) throw err;
			fs.rename("IPLogTemp.json", "IPLog.json", renameErr => {
			  if (renameErr) {
				console.error("Error while renaming the temporary file:", renameErr);
			  } else {
				console.log("done writing last log");
			  }
			});
		});
		/*
		let lastLogs = JSON.parse(fs.readFileSync('./IPLogTemp.json', 'utf8'));

		console.log('writing log...');
		fs.writeFile("IPLogTemp.json", JSON.stringify(currentLog), err => {
			if (err) throw err; 
			console.log("done writing new temp log");
		});

		logs.push(lastLogs);
		fs.writeFile("IPLog.json", JSON.stringify(logs), err => {
			if (err) throw err; 
			console.log("done writing last log");
		});
		*/
	} else {
		console.log('not writing log', '\n')
	};
/*
	if (isShowingTaskbarIcons) {
		setTrayIcon(4,ownTools.isIPv4Address(currentLog.ipifyIPv4) || ownTools.isIPv4Address(currentLog.testIPv4));
		setTrayIcon(6,ownTools.isIPv6Address(currentLog.ipifyIPv6) || ownTools.isIPv6Address(currentLog.testIPv6));
	};
	*/
};


function getIP(host, path) {
	return new Promise(resolve => {
		http.get({'host': host/*, 'port': 80*/, 'path': path, timeout: 5000}, function(resp) {
			resp.on('data', function(ip) {
				ip = ip.toString();
				if (ip == undefined) {
					resolve(null)}
				else if (!ownTools.isIPv4Address(ip) && !ownTools.isIPv6Address(ip)) {
					console.error('unexpected response from' + host + (path ? path : '') + ': ' + ip);
					resolve('err')
				} else {
					resolve(ip)
				};
			});
			resp.on('end', () => {
				resolve(null)
			});
		}).on('error', function (e) {
			if (path == undefined){
				url = host
			} else {
				url = host + path
			}
			console.error ("COULDN'T REACH: " + url + ' error:' + e.errno + ' ' + e.code);
			resolve(null);
		});
	});
}

async function setTrayIcon(version,status) {
	//console.log(version);
	//console.log(status);
	let v4tooltip
	let v6tooltip
	currentTime = ownTools.getTime();

	if (version == 4) {
		trayv4.icon = path.join(__dirname, 'images', status + 'v4.ico' );
		if (status) {
			v4tooltip = "IPv4 connected";
			timeLastConnected4 = currentTime;
		  } else {
			v4tooltip = "IPv4 disconnected for: ";
			v4tooltip += ownTools.seconds2time(ownTools.reverseTime(currentTime).unix - ownTools.reverseTime(timeLastConnected4).unix,'hh mm ss');
		  }
	} else if (version == 6) {
		trayv6.icon = path.join(__dirname, 'images', status + 'v6.ico' );
		if (status) {
			v6tooltip = "IPv6 connected";
			timeLastConnected6 = currentTime;
		  } else {
			v6tooltip = "IPv6 disconnected for: ";
			v6tooltip += ownTools.seconds2time(ownTools.reverseTime(currentTime).unix - ownTools.reverseTime(timeLastConnected6).unix,'hh mm ss');
		  }
  	};
	//console.log(v6tooltip);
	if (version == 4) {
		if (IPtestStatus) {
			v4tooltip =  v4tooltip + " testing...";
		  } else {
			v4tooltip = v4tooltip + ", Test in: " + timeUntilNextTest() + "s";
		  }
	} else if (version == 6) {
		if (IPtestStatus) {
			v6tooltip = v6tooltip + " testing...";
		  } else {
			v6tooltip = v6tooltip + ", Test in: " + timeUntilNextTest() + "s";
		  }
  	};
	//console.log(version);
	switch (version) {
		case 4:
			//console.log(v4tooltip);
			trayv4.tooltip = v4tooltip;
			break;
		case 6:
			//console.log(v6tooltip);
			trayv6.tooltip = v6tooltip;
			break;
	}
	
};


function timeUntilNextTest() {
	const nextRun = logJob.nextInvocation();
	const now = new Date();
	const timeUntilNextRunMS = nextRun.getTime() - now.getTime();
	const timeUntilNextRunS = Math.round(timeUntilNextRunMS/1000);
	return timeUntilNextRunS;
}






process.on('SIGINT', () => {
	console.log('closing tray icons');
	if(isShowingTaskbarIcons) {
		trayv4.close();
		trayv6.close();
	}
	if(isShowingTestIcon) trayTest.close();
	process.exit();
  });


process.stdin.on('data', (data) => {
	const command = data.trim();
	let scripts = ['test', 'sendMail', 'makeMail', 'restart'] ;
	switch(command) {
		default:
			console.error(colorette.red(`Unknown command: ${command} \n`) + colorette.green(`Valid commands: ${scripts}`));
			break;
		case scripts[0]:
			test.test();
			break;
		case scripts[1]:
			sendMailTest();
			break;
		case scripts[2]:
			makeMailTest();
			break;
		case scripts[3]:
		if(isShowingTaskbarIcons) {
			trayv4.close();
			trayv6.close();
		}
		if(isShowingTestIcon) trayTest.close();

		const child = spawn('start', ['powershell.exe', '-File', '.\\restart.ps1'], { shell: true });
		child.on('message', (message) => {
			if (message === 'STARTED') {
			  process.exit();
			}
		  });
		setTimeout(() => {
			process.exit();
		  }, 1000);
      break;
			
	}
});