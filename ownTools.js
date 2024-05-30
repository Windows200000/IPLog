module.exports = {
    isIPv4Address,
    isIPv6Address,
    findChanges,
    getTime,
	reverseTime,
	seconds2time,
	sortLogsByTime
};


const ownTools = require('./ownTools');

function sortLogsByTime(logs) {
	return logs.slice().sort((a, b) => {
	  const timeA = new Date(Date.parse(a.time));
	  const timeB = new Date(Date.parse(b.time));
	  return timeA - timeB;
	});
  }

  function isIPv4Address(input) {
	const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
	if (!ipv4Regex.test(input)) {
	  return false;
	}
  
	const parts = input.split(".");
	for (let i = 0; i < 4; i++) {
	  const part = parseInt(parts[i], 10);
	  if (isNaN(part) || part < 0 || part > 255) {
		return false;
	  }
	}
  
	return true;
  }
  
  function isIPv6Address(input) {
	const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
	if (ipv6Regex.test(input)) {
	  return true;
	}
  
	const compactIPv6Regex = /^([\da-fA-F]{1,4}(:|::)){2,6}([\da-fA-F]{1,4}(:|$)){0,1}$/;
	if (compactIPv6Regex.test(input)) {
	  return true;
	}
  
	return false;
  }

  async function findChanges(logs) {
	return new Promise((resolve) => {
		let input = ownTools.sortLogsByTime(logs);
		const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  		const pastWeekLogs = input.filter(log => new Date(log.time) >= weekAgo);
  		let lastIPv4
  		let lastIPv6
  		let changes = [];
  		for (let i = 0;i < pastWeekLogs.length - 1;i++) {
			let IPv4Connectivity;
			let IPv6Connectivity;
			if (isIPv4Address(pastWeekLogs[i].ipifyIPv4) || isIPv4Address(pastWeekLogs[i].testIPv4)) {
				IPv4Connectivity = true
			} else {
				IPv4Connectivity = false
			};
			if (isIPv6Address(pastWeekLogs[i].ipifyIPv6) || isIPv6Address(pastWeekLogs[i].testIPv6)) {
				IPv6Connectivity = true
			} else {
				IPv6Connectivity = false
			}
			
			if (changes.length == 0 || (lastIPv4 !== IPv4Connectivity)  || (lastIPv6 !== IPv6Connectivity)) {
				let change =  {};
				change.time = pastWeekLogs[i].time;
				change.IPv4 = IPv4Connectivity;
				change.IPv6 = IPv6Connectivity;
				changes.push(change);
				lastIPv4 = IPv4Connectivity;
				lastIPv6 = IPv6Connectivity;
			}
		};
  		resolve(changes);
	  });
};

function reverseTime(dateString) {
	var year = parseInt(dateString.substr(0, 4));
	var month = parseInt(dateString.substr(5, 2));
	var day = parseInt(dateString.substr(8, 2));
	var hour = parseInt(dateString.substr(11, 2));
	var minute = parseInt(dateString.substr(14, 2));
	var second = parseInt(dateString.substr(17, 2));
	var offsetSign = dateString.substr(19, 1);
	var offsetHour = parseInt(dateString.substr(20, 2));
	var offsetMinute = parseInt(dateString.substr(23, 2));
	var offset = (offsetHour * 60 + offsetMinute) * (offsetSign == '+' ? 1 : -1);
  
	var weekday = new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offset * 60 * 1000).getUTCDay();
	var dt = new Date(Date.UTC(year, month - 1, day, hour, minute, second)/* - offset * 60 * 1000*/); // subtract offset from UTC time
  
	return {
	  year: dt.getUTCFullYear(),
	  month: dt.getUTCMonth() + 1,
	  day: dt.getUTCDate(),
	  hour: dt.getUTCHours(),
	  minute: dt.getUTCMinutes(),
	  second: dt.getUTCSeconds(),
	  offset: offset,
	  unix: Math.floor(dt.getTime() / 1000),
	  weekday: weekday,
	  offsetHour: offsetHour,
	  offsetMinute: offsetMinute,
	};
  }

function getTime() { 
	function toIsoString(date) {
		var tzo = -date.getTimezoneOffset(),
			dif = tzo >= 0 ? '+' : '-',
			pad = function(num) {
				return (num < 10 ? '0' : '') + num;
      };

		return date.getFullYear() +
			'-' + pad(date.getMonth() + 1) +
			'-' + pad(date.getDate()) +
			'T' + pad(date.getHours()) +
			':' + pad(date.getMinutes()) +
			':' + pad(date.getSeconds()) +
			dif + pad(Math.floor(Math.abs(tzo) / 60)) +
			':' + pad(Math.abs(tzo) % 60);
	}

	var dt = new Date();
	return toIsoString(dt);
}

function seconds2time(seconds, format) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var seconds = seconds % 60;
 	if (format == 'hh mm ss') {
	    var parts = [];
	    if (hours > 0) {
	      parts.push(hours + 'h');
	    }
	    if (minutes > 0) {
	      parts.push(minutes + 'm');
	    }
	    if (seconds > 0 || parts.length == 0) {
	      parts.push(seconds + 's');
	    }
	    return parts.join(' ');
	} else if (format == 'HH:MM:SS') {
	    var parts = [];
		parts.push(hours.toString().padStart(2, '0') + ':');
		parts.push(minutes.toString().padStart(2, '0') + ':');
		parts.push(seconds.toString().padStart(2, '0'));
	    return parts.join('');
	} else {
		console.log('seconds2time: No valid format selected.');
	}
  };
