@echo off
setlocal EnableDelayedExpansion
rem Gradle + Android builds need several GB; keep cache off low-space C:
if not exist "D:\gradle-user-home" mkdir "D:\gradle-user-home"
set "GRADLE_USER_HOME=D:\gradle-user-home"
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo JDK 25 not found at:
  echo   %JAVA_HOME%
  echo Install Temurin 25 or edit JAVA_HOME in scripts\assemble-android-debug.cmd
  exit /b 1
)
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Using JAVA_HOME=%JAVA_HOME%
java -version

set "ANDROID_DIR=%~dp0..\android"
cd /d "%ANDROID_DIR%"

if not exist "local.properties" (
  set "SDK="
  if exist "D:\Android\Sdk\platform-tools\adb.exe" set "SDK=D:/Android/Sdk"
  if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" set "SDK=%LOCALAPPDATA:\=/%/Android/Sdk"
  if defined SDK (
    echo sdk.dir=!SDK!> local.properties
    echo Wrote android\local.properties with sdk.dir=!SDK!
  ) else (
    echo.
    echo Android SDK not found.
    echo   1. Install Android Studio, or SDK command-line tools.
    echo   2. Put the SDK on D: if C: is full, e.g. D:\Android\Sdk
    echo   3. Create android\local.properties from local.properties.example
    echo.
    exit /b 1
  )
)

if exist "local.properties" (
  for /f "tokens=1,* delims==" %%A in ('findstr /b "sdk.dir=" local.properties') do set "ANDROID_HOME=%%B"
  set "ANDROID_HOME=!ANDROID_HOME:/=\!"
)

call gradlew.bat assembleDebug --no-daemon
exit /b %ERRORLEVEL%
