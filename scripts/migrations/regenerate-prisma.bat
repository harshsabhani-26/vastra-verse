@echo off
echo Regenerating Prisma Client...
echo.
echo Please make sure npm run dev is STOPPED before running this!
echo.
pause

cd /d "C:\Users\shree\Desktop\M & H"

echo Generating Prisma Client...
node node_modules\prisma\build\index.js generate

echo.
echo Prisma Client Generated!
echo.
echo Now you can run: npm run dev
pause
