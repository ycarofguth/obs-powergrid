import { os, events, app, window as neuWindow } from '@neutralinojs/lib'

let isWindowVisible = true
let trayStatusText = 'Carregando...'

export async function setupTray(): Promise<void> {
  await updateTrayMenu()

  events.on('trayMenuItemClicked', async (event: CustomEvent) => {
    switch (event.detail.id) {
      case 'show_hide':
        await toggleWindowVisibility()
        break
      case 'quit':
        await app.exit()
        break
    }
  })
}

async function updateTrayMenu(): Promise<void> {
  await os.setTray({
    icon: '/resources/tray-iconTemplate.png',
    menuItems: [
      { id: 'show_hide', text: isWindowVisible ? 'Ocultar Janela' : 'Mostrar Janela' },
      { text: '-' },
      { id: 'status', text: trayStatusText, isDisabled: true },
      { text: '-' },
      { id: 'quit', text: 'Encerrar' },
    ],
  })
}

export function updateTrayStatus(
  connectedCount: number,
  totalDevices: number,
  totalPower: number
): void {
  const powerStr =
    totalPower >= 1000 ? `${(totalPower / 1000).toFixed(1)} kW` : `${totalPower.toFixed(0)} W`
  trayStatusText = `${connectedCount}/${totalDevices} devices - ${powerStr}`
  updateTrayMenu().catch(console.error)
}

export async function toggleWindowVisibility(): Promise<void> {
  if (isWindowVisible) {
    await neuWindow.hide()
  } else {
    await neuWindow.show()
    await neuWindow.focus()
  }
  isWindowVisible = !isWindowVisible
  await updateTrayMenu()
}

export function setWindowHidden(): void {
  isWindowVisible = false
  updateTrayMenu().catch(console.error)
}
