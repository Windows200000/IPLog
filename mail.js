module.exports = {
    send,
    write
  };

const ownTools = require('./ownTools');
  
const {google} = require('googleapis');
const { OAuth2 } = google.auth;
const nodemailer = require('nodemailer');

const fs = require('fs');



async function send(sendTo, subject, text) {
    settings = require('./settings.json');

    const oAuth2Client = new google.auth.OAuth2(
      settings.CLIENT_ID,
      settings.CLIENT_SECRET,
      settings.REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: settings.REFRESH_TOKEN });
  
    try {
      const headers = await oAuth2Client.getRequestHeaders();
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: settings.MAIL_FROM,
          clientId: settings.CLIENT_ID,
          clientSecret: settings.CLIENT_SECRET,
          refreshToken: settings.REFRESH_TOKEN,
          accessToken: headers.Authorization.replace('Bearer ', ''),
          accessUrl: 'https://oauth2.googleapis.com/token'
        }
      });
  
      const mailOptions = {
        from: 'IPLog <' + settings.MAIL_FROM + '>',
        to: sendTo,
        subject: subject,
        html: text
      };
  
      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw error;
    }
}


  

async function write(data) {
    return new Promise((resolve) => {
      let currentTime = ownTools.getTime();
      let table = '<table style="border-collapse: collapse;">';
      table += '<tr style="border: 1px solid black;"><th style="border: 1px solid black; padding: 5px;">Time</th><th style="border: 1px solid black; padding: 5px;">IPv4</th><th style="border: 1px solid black; padding: 5px;">IPv6</th></tr>';
      let lastIPv4Status = !data[0].IPv4;
      let lastIPv6Status = !data[0].IPv6;
      let lastDay = "";
      //console.log(data.length);
      for (let i = 0; i < data.length; i++) {
        let IPv4output = "";
        let IPv6output = "";
        let writeThisLine = false;

        if (data[i]?.IPv4 !== lastIPv4Status && !data[i].IPv4) {
          writeThisLine = true
          for (let p = i + 1; p <= data.length; p++) {
            //console.log('\n' + p);
            //console.log(i)
            if (data[p]?.IPv4) {
              IPv4output = ownTools.seconds2time(ownTools.reverseTime(data[p].time).unix - ownTools.reverseTime(data[i].time).unix,'hh mm ss');
              break;
            } else if (p == data.length){
              IPv4output = '⏳' + ownTools.seconds2time(ownTools.reverseTime(currentTime).unix - ownTools.reverseTime(data[i].time).unix,'hh mm ss');
              break;
            }
          }
        };
          
        if (data[i]?.IPv6 !== lastIPv6Status && !data[i].IPv6) {
          writeThisLine = true
          for (let p = i + 1; p <= data.length; p++) {
            if (data[p]?.IPv6) {
              IPv6output = ownTools.seconds2time(ownTools.reverseTime(data[p].time).unix - ownTools.reverseTime(data[i].time).unix,'hh mm ss');
              break;
            } else if (p == data.length){
              IPv6output = '⏳' + ownTools.seconds2time(ownTools.reverseTime(currentTime).unix - ownTools.reverseTime(data[i].time).unix,'hh mm ss');
              break;
            }
          }
        };

        if (ownTools.reverseTime(data[i].time).day !== lastDay && writeThisLine) {
          let weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          lastDay = ownTools.reverseTime(data[i].time).day;
          var weekday = ownTools.reverseTime(data[i].time).weekday;
          table += `<tr style="border: 1px solid black;"><td style="border: 1px solid black; padding: 5px; font-weight: bold" colspan="3">
            ${weekdays[weekday] + ', ' + ownTools.reverseTime(data[i].time).day + '.' + ownTools.reverseTime(data[i].time).month}
            </td></tr>`;
        };

        if (writeThisLine) {
          /*if ((ownTools.seconds2time(ownTools.reverseTime(data[i].time).unix  % 86400,'HH:MM:SS')) == '18:03:50') {
            console.log('ipv4:' + IPv4output + 'ipv6:' + IPv6output)
          };*/ //Testing output

          table += `<tr style="border: 1px solid black;"><td style="border: 1px solid black; padding: 5px;">
            ${(ownTools.seconds2time(ownTools.reverseTime(data[i].time).unix  % 86400,'HH:MM:SS'))}</td><td style="border: 1px solid black; padding: 5px;">
            ${IPv4output}</td><td style="border: 1px solid black; padding: 5px;">
            ${IPv6output}</td></tr>`;
            //console.log('last: ' + lastIPv4Status + ' ' + lastIPv6Status);
            //console.log('current: ' + data[i].IPv4 + ' ' + data[i].IPv6);
            //console.log('output:' + IPv4output + 'v6:' + IPv6output);
        };
        lastIPv4Status = data[i].IPv4;
        lastIPv6Status = data[i].IPv6;
      }
      table += `<tr style="border: 1px solid black;"><td style="border: 1px solid black; padding: 5px" colspan="3">
            ${currentTime.substring(10)}
            </td></tr>`;
      table += '</table>';
      resolve(table);
    });
  };