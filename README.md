### This is the first project I ever coded from scratch, so it's not written well, but it works.

## ⚠️Important
- The code checks for changes in `test.js` and reloads that file. This is essentially planned **code injection**. Remove that if you wish.
- The **Mailing function might not work** anymore. I use the project, but not the mailing function, so I haven't bothered to keep up with the API.
- I wasn't able to figure out how to detect system shutdown, so currently, by default, up to the **last 30 minutes of logs will be lost**. You can Exit gracefully via the tray icon.


## How to use
- Clone the repo
- Rename `RENAME TO(restart.ps1)` to `restart.ps1`
- Run once
- If you want to modify check frequency or get emails, you'll have to fill out `settings.json`
- some more options and debug options are at the top of `IPLog.js`
- Run again or configure to run at startup
