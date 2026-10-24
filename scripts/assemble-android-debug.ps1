$ErrorActionPreference = "Stop"
$gradleHome = "D:\gradle-user-home"
if (-not (Test-Path $gradleHome)) { New-Item -ItemType Directory -Path $gradleHome | Out-Null }
$env:GRADLE_USER_HOME = $gradleHome
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"
if (-not (Test-Path "$javaHome\bin\java.exe")) {
  Write-Error "JDK 25 not found at $javaHome — edit scripts/assemble-android-debug.ps1"
}
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;" + $env:Path
Write-Host "Using JAVA_HOME=$env:JAVA_HOME"
java -version

$androidDir = Join-Path $PSScriptRoot "..\android"
$localProps = Join-Path $androidDir "local.properties"
if (-not (Test-Path $localProps)) {
  $candidates = @(
    "D:\Android\Sdk",
    (Join-Path $env:LOCALAPPDATA "Android\Sdk")
  )
  $sdk = $candidates | Where-Object { Test-Path (Join-Path $_ "platform-tools\adb.exe") } | Select-Object -First 1
  if (-not $sdk) {
    Write-Host ""
    Write-Host "Android SDK not found."
    Write-Host "  1. Install Android Studio, or SDK command-line tools."
    Write-Host "  2. Prefer D:\Android\Sdk if C: is low on space."
    Write-Host "  3. Copy android\local.properties.example to android\local.properties"
    exit 1
  }
  $sdkDir = ($sdk -replace "\\", "/")
  "sdk.dir=$sdkDir" | Set-Content -Path $localProps -Encoding ASCII
  Write-Host "Wrote android\local.properties with sdk.dir=$sdkDir"
}

if (Test-Path $localProps) {
  $line = Get-Content $localProps | Where-Object { $_ -match "^sdk\.dir=" } | Select-Object -First 1
  if ($line) {
    $env:ANDROID_HOME = ($line -replace "^sdk\.dir=", "").Trim().Replace("/", "\")
  }
}

Set-Location $androidDir
& .\gradlew.bat assembleDebug --no-daemon
exit $LASTEXITCODE
