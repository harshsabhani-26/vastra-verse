@echo off
echo Running Prisma Migration for Bottom Page Banner Support...
echo.

cd /d "C:\Users\shree\Desktop\M & H"

echo Generating Prisma Client...
node node_modules\prisma\build\index.js generate

echo.
echo Running Migration...
node node_modules\prisma\build\index.js migrate dev --name add_bottom_page_banner_type

echo.
echo Migration Complete!
echo You can now restart your dev server with: npm run dev
pause
