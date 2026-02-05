@echo off
echo Running Prisma Migration for Video Upload Support...
echo.

cd /d "C:\Users\shree\Desktop\M & H"

echo Generating Prisma Client...
node node_modules\prisma\build\index.js generate

echo.
echo Running Migration...
node node_modules\prisma\build\index.js migrate dev --name add_video_support_to_hero_banner

echo.
echo Migration Complete!
pause
