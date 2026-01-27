@echo off
cd /d "c:\Users\shree\Desktop\M & H"
npx prisma generate
npx prisma migrate dev --name add_appointment_model
pause
