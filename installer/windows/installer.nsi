!include "MUI2.nsh"

; ---- General ----
Name "OBS PowerGrid"
OutFile "..\..\dist\OBS-PowerGrid-Setup-v${VERSION}.exe"
InstallDir "$PROGRAMFILES64\OBS PowerGrid"
InstallDirRegKey HKLM "Software\OBS PowerGrid" "InstallDir"
RequestExecutionLevel admin
Unicode True

; ---- Version Info ----
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "OBS PowerGrid"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "Copyright (C) 2026 ycaroguth - GPL v3"
VIAddVersionKey "FileDescription" "OBS PowerGrid Installer"

; ---- UI ----
!define MUI_ABORTWARNING
!define MUI_ICON "..\..\apps\desktop\resources\icons\icon-256.png"
!define MUI_UNICON "..\..\apps\desktop\resources\icons\icon-256.png"

; ---- Pages ----
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; ---- Uninstall Pages ----
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ---- Language ----
!insertmacro MUI_LANGUAGE "PortugueseBR"

; ---- Install Section ----
Section "Install"
  SetOutPath "$INSTDIR"

  ; Neutralino binary
  File /oname=obs-tuya-smart-plug.exe "..\..\dist\obs-tuya-smart-plug\obs-tuya-smart-plug.exe"

  ; Neutralino config
  File "..\..\dist\obs-tuya-smart-plug\neutralino.config.json"

  ; Node.js runtime
  SetOutPath "$INSTDIR\runtime"
  File "..\..\dist\obs-tuya-smart-plug\runtime\node.exe"

  ; Frontend
  SetOutPath "$INSTDIR\apps\desktop\dist"
  File /r "..\..\dist\obs-tuya-smart-plug\apps\desktop\dist\*.*"

  ; Sidecar
  SetOutPath "$INSTDIR\apps\sidecar\dist"
  File "..\..\dist\obs-tuya-smart-plug\apps\sidecar\dist\bundle.mjs"

  ; Native modules
  SetOutPath "$INSTDIR\apps\sidecar\node_modules"
  File /r "..\..\dist\obs-tuya-smart-plug\apps\sidecar\node_modules\*.*"

  ; Resources
  SetOutPath "$INSTDIR\resources"

  ; Launcher script
  SetOutPath "$INSTDIR"
  FileOpen $0 "$INSTDIR\start.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'cd /d "%~dp0"$\r$\n'
  FileWrite $0 'start "" /b "runtime\node.exe" "apps\sidecar\dist\bundle.mjs"$\r$\n'
  FileWrite $0 'timeout /t 3 /nobreak >nul$\r$\n'
  FileWrite $0 '"obs-tuya-smart-plug.exe" --load-dir-res$\r$\n'
  FileWrite $0 'taskkill /f /im node.exe 2>nul$\r$\n'
  FileClose $0

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\OBS PowerGrid"
  CreateShortcut "$SMPROGRAMS\OBS PowerGrid\OBS PowerGrid.lnk" "$INSTDIR\start.bat" "" "$INSTDIR\obs-tuya-smart-plug.exe" 0
  CreateShortcut "$SMPROGRAMS\OBS PowerGrid\Desinstalar.lnk" "$INSTDIR\uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\OBS PowerGrid.lnk" "$INSTDIR\start.bat" "" "$INSTDIR\obs-tuya-smart-plug.exe" 0

  ; Registry - Add/Remove Programs
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OBS PowerGrid" \
    "DisplayName" "OBS PowerGrid"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OBS PowerGrid" \
    "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OBS PowerGrid" \
    "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OBS PowerGrid" \
    "Publisher" "ycaroguth"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OBS PowerGrid" \
    "DisplayIcon" "$INSTDIR\obs-tuya-smart-plug.exe"
  WriteRegStr HKLM "Software\OBS PowerGrid" "InstallDir" "$INSTDIR"
SectionEnd

; ---- Uninstall Section ----
Section "Uninstall"
  ; Remove files
  RMDir /r "$INSTDIR\apps"
  RMDir /r "$INSTDIR\runtime"
  RMDir /r "$INSTDIR\resources"
  Delete "$INSTDIR\obs-tuya-smart-plug.exe"
  Delete "$INSTDIR\neutralino.config.json"
  Delete "$INSTDIR\start.bat"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  ; Remove shortcuts
  Delete "$SMPROGRAMS\OBS PowerGrid\OBS PowerGrid.lnk"
  Delete "$SMPROGRAMS\OBS PowerGrid\Desinstalar.lnk"
  RMDir "$SMPROGRAMS\OBS PowerGrid"
  Delete "$DESKTOP\OBS PowerGrid.lnk"

  ; Remove registry
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OBS PowerGrid"
  DeleteRegKey HKLM "Software\OBS PowerGrid"
SectionEnd
