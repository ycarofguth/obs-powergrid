import { useState, useRef, useEffect } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'
import type { DashboardDeviceCard } from '@obs-tuya/shared'

interface DeviceSelectorProps {
  devices: DashboardDeviceCard[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function DeviceSelector({ devices, selectedIds, onSelectionChange }: DeviceSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const allSelected = devices.length > 0 && selectedIds.length === devices.length
  const noneSelected = selectedIds.length === 0

  const handleToggleDevice = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleSelectAll = () => {
    onSelectionChange(devices.map((d) => d.id))
  }

  const handleDeselectAll = () => {
    onSelectionChange([])
  }

  const selectedCount = selectedIds.length
  const buttonLabel =
    selectedCount === 0
      ? 'Selecionar dispositivos'
      : selectedCount === devices.length
        ? 'Todos os dispositivos'
        : `${selectedCount} dispositivo${selectedCount > 1 ? 's' : ''}`

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-[var(--hover-bg-subtle)] transition-colors border border-border"
      >
        <span>{buttonLabel}</span>
        <CaretDown
          size={16}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-50">
          {/* Select All / Deselect All */}
          <div className="flex items-center gap-2 p-2 border-b border-border">
            <button
              onClick={handleSelectAll}
              disabled={allSelected}
              className="flex-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selecionar todos
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={noneSelected}
              className="flex-1 px-2 py-1 text-xs text-muted-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Desmarcar todos
            </button>
          </div>

          {/* Device list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {devices.map((device) => {
              const isSelected = selectedIds.includes(device.id)
              return (
                <button
                  key={device.id}
                  onClick={() => handleToggleDevice(device.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-border bg-background'
                    }`}
                  >
                    {isSelected && (
                      <Check size={12} weight="bold" className="text-primary-foreground" />
                    )}
                  </div>

                  {/* Connection status dot */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      device.isConnected ? 'bg-success' : 'bg-muted-foreground'
                    }`}
                  />

                  {/* Device name */}
                  <span className="text-foreground truncate">{device.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
