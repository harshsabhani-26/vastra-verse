@echo off
echo Running Migration for Text Customization...
echo.

cd /d "C:\Users\shree\Desktop\M & H"

echo Running Migration...
node node_modules\prisma\build\index.js migrate dev --name add_text_customization_to_banners

echo.
echo Generating Prisma Client...
node node_modules\prisma\build\index.js generate

echo.
echo Done! Text customization features are now available.
pause
