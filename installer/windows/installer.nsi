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
  File /oname=obs-tuya-smart-plug.exe "..\..\dist\obs-tuya-smart-plug\obs-tuya-smart-plug.exe"

  ; Neutralino config
  File "..\..\dist\obs-tuya-smart-plug\neutralino.config.json"

  ; Node.js runtime
  SetOutPath "$INSTDIR\runtime"
  File "..\..\dist\obs-tuya-smart-plug\runtime\node.exe"

  ; Frontend
  SetOutPath "$INSTDIR\apps\desktop\dist"
  File /r "..\..\dist\obs-tuya-smart-plug\apps\desktop\dist\*"

  ; Sidecar
  SetOutPath "$INSTDIR\apps\sidecar\dist"
  File "..\..\dist\obs-tuya-smart-plug\apps\sidecar\dist\bundle.mjs"

  ; Native modules
  SetOutPath "$INSTDIR\apps\sidecar\node_modules"
  File /nonfatal /r "..\..\dist\obs-tuya-smart-plug\apps\sidecar\node_modules\*"

  ; Resources
  SetOutPath "$INSTDIR\resources"

  ; Launcher script (VBScript - no console window)
  SetOutPath "$INSTDIR"
  FileOpen $0 "$INSTDIR\start.vbs" w
  FileWrite $0 'Set WshShell = CreateObject("WScript.Shell")$\r$\n'
  FileWrite $0 'Set fso = CreateObject("Scripting.FileSystemObject")$\r$\n'
  FileWrite $0 'appDir = fso.GetParentFolderName(WScript.ScriptFullName)$\r$\n'
  FileWrite $0 'WshShell.CurrentDirectory = appDir$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 "' Start sidecar (hidden window)$\r$\n"
  FileWrite $0 'WshShell.Run """" & appDir & "\runtime\node.exe"" """ & appDir & "\apps\sidecar\dist\bundle.mjs""", 0, False$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 "' Wait for sidecar to start$\r$\n"
  FileWrite $0 'WScript.Sleep 3000$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 "' Start Neutralino (GUI window)$\r$\n"
  FileWrite $0 'WshShell.Run """" & appDir & "\obs-tuya-smart-plug.exe"" --load-dir-res", 1, True$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 "' Cleanup: stop sidecar when app exits$\r$\n"
  FileWrite $0 'Set objWMI = GetObject("winmgmts:\\.\root\cimv2")$\r$\n'
  FileWrite $0 'Set colProcs = objWMI.ExecQuery("SELECT * FROM Win32_Process WHERE Name=''node.exe'' AND CommandLine LIKE ''%bundle.mjs%''")$\r$\n'
  FileWrite $0 'For Each objProc In colProcs$\r$\n'
  FileWrite $0 '    objProc.Terminate()$\r$\n'
  FileWrite $0 'Next$\r$\n'
  FileClose $0

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\OBS PowerGrid"
  CreateShortcut "$SMPROGRAMS\OBS PowerGrid\OBS PowerGrid.lnk" "wscript.exe" '"$INSTDIR\start.vbs"' "$INSTDIR\obs-tuya-smart-plug.exe" 0
  CreateShortcut "$SMPROGRAMS\OBS PowerGrid\Desinstalar.lnk" "$INSTDIR\uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\OBS PowerGrid.lnk" "wscript.exe" '"$INSTDIR\start.vbs"' "$INSTDIR\obs-tuya-smart-plug.exe" 0

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
