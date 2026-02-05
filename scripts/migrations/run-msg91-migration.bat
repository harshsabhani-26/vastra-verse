@echo off
echo Running Prisma Migration for MSG91 SMS OTP Support...
echo.

cd /d "C:\Users\shree\Desktop\M & H"

echo Generating Prisma Client...
node node_modules\prisma\build\index.js generate

echo.
echo Running Migration...
node node_modules\prisma\build\index.js migrate dev --name add_msg91_sms_otp_support

echo.
echo Migration Complete!
echo.
echo Don't forget to add MSG91 credentials to your .env file:
echo MSG91_AUTH_KEY=your_auth_key_here
echo MSG91_SENDER_ID=TXTIND
echo MSG91_TEMPLATE_ID=your_template_id_here
echo MSG91_DLT_TE_ID=your_dlt_te_id_here
echo.
echo You can now restart your dev server with: npm run dev
pause
