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
  File /oname=obs-powergrid.exe "..\..\dist\obs-powergrid\obs-powergrid.exe"

  ; Neutralino config
  File "..\..\dist\obs-powergrid\neutralino.config.json"

  ; Icon
  File "..\..\dist\obs-powergrid\icon.ico"

  ; Node.js runtime
  SetOutPath "$INSTDIR\runtime"
  File "..\..\dist\obs-powergrid\runtime\node.exe"

  ; Frontend
  SetOutPath "$INSTDIR\apps\desktop\dist"
  File /r "..\..\dist\obs-powergrid\apps\desktop\dist\*"

  ; Sidecar
  SetOutPath "$INSTDIR\apps\sidecar\dist"
  File "..\..\dist\obs-powergrid\apps\sidecar\dist\bundle.mjs"

  ; Native modules
  SetOutPath "$INSTDIR\apps\sidecar\node_modules"
  File /nonfatal /r "..\..\dist\obs-powergrid\apps\sidecar\node_modules\*"

  ; Native bindings (.node files where `bindings` module searches)
  SetOutPath "$INSTDIR\apps\sidecar\build\Release"
  File /nonfatal "..\..\dist\obs-powergrid\apps\sidecar\build\Release\*.node"

  ; Resources
  SetOutPath "$INSTDIR\resources"

  ; Launcher script (created by build-windows-dist.sh)
  SetOutPath "$INSTDIR"
  File "..\..\dist\obs-powergrid\start.vbs"

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\OBS PowerGrid"
  CreateShortcut "$SMPROGRAMS\OBS PowerGrid\OBS PowerGrid.lnk" "wscript.exe" '"$INSTDIR\start.vbs"' "$INSTDIR\icon.ico" 0
  CreateShortcut "$SMPROGRAMS\OBS PowerGrid\Desinstalar.lnk" "$INSTDIR\uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\OBS PowerGrid.lnk" "wscript.exe" '"$INSTDIR\start.vbs"' "$INSTDIR\icon.ico" 0

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
    "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKLM "Software\OBS PowerGrid" "InstallDir" "$INSTDIR"
SectionEnd

; ---- Uninstall Section ----
Section "Uninstall"
  ; Remove files
  RMDir /r "$INSTDIR\apps"
  RMDir /r "$INSTDIR\runtime"
  RMDir /r "$INSTDIR\resources"
  Delete "$INSTDIR\obs-powergrid.exe"
  Delete "$INSTDIR\neutralino.config.json"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\start.vbs"
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
