@echo off
set "source=./IPLog_backup.json"
set "destination=./IPLog.json"

echo Copying %source% to %destination%...

rem /Y flag is used to suppress confirmation prompts
copy /Y "%source%" "%destination%"

echo Copy operation completed.
pause
