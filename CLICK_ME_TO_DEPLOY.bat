@echo off
echo ==========================================
echo    ALLIGATOR SURFER - GITHUB DEPLOYER
echo ==========================================
echo.
echo We need to set up your Git identity first.
echo Don't worry, this is just for the commit history.
echo.
set /p "GName=Enter your Name (e.g. John Doe): "
set /p "GEmail=Enter your Email (e.g. john@example.com): "

echo.
echo initializing Git repository...
git init
git config user.name "%GName%"
git config user.email "%GEmail%"

git branch -M master

echo.
echo Adding remote repository...
git remote add origin https://github.com/RaviDandaiya/Eligtor-Sufer.git
git remote set-url origin https://github.com/RaviDandaiya/Eligtor-Sufer.git

echo.
echo Staging files...
git add .

echo.
echo Committing changes...
git commit -m "Live version: Solid Visuals & Chill Speed"

echo.
echo ==========================================
echo READY TO PUSH TO MASTER!
echo.
echo 1. A window might pop up to sign in to GitHub.
echo 2. If it asks for a password in the terminal, use a "Personal Access Token".
echo    (But usually the popup window handles it).
echo ==========================================
echo.
pause
git push -u origin master

echo.
echo ==========================================
echo DONE! If you saw "Success" or specific URLs above, it worked.
echo Now go to GitHub Settings -> Pages to enable the site.
echo ==========================================
pause
