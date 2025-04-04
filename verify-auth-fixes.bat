@echo off
echo Verifying authentication fixes...
echo.
echo Checking authMiddleware.js...
echo.
echo Checking login function in authController.js...
findstr /C:\
userId:
user._id\ /C:\id:
user._id\ backend\controllers\authController.js
echo.
echo Checking direct-login route in authRoutes.js...
findstr /C:\
/direct-login\ backend\routes\authRoutes.js
echo.
echo Verification complete.
