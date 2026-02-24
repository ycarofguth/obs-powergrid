import { getDb, schema } from '../db/index.js'
import { desc, eq, and, gte, lte } from 'drizzle-orm'
import {
  listDevicesWithStatus,
  getDeviceWithStatus,
  getDeviceCurrentStatus,
} from './connection-manager.js'
import { getSettings, calculateCost } from './settings-service.js'
import type {
  DeviceStatusResponse,
  DeviceWithStatus,
  ComparisonChartData,
  ComparisonChartDevice,
  ComparisonRankings,
  DeviceRanking,
} from '@obs-tuya/shared'
import { listDevices } from './device-manager.js'

export interface DashboardSummary {
  totalDevices: number
  enabledDevices: number
  connectedDevices: number
  totalPowerWatts: number
  averagePowerWatts: number
  sessionCost: number
  currency: string
  devices: DashboardDeviceCard[]
}

export interface DashboardDeviceCard {
  id: string
  name: string
  enabled: boolean
  isConnected: boolean
  mode: 'local' | 'cloud'
  status: {
    switch: boolean
    power: number
    voltage: number
    current: number
  } | null
  sessionStartTime: Date | null
  sessionCost: number
}

export interface DeviceDashboard {
  device: DeviceWithStatus
  realtime: DeviceStatusResponse | null
  stats: DeviceStats
  costSummary: CostSummary
  connectionInfo: {
    mode: 'local' | 'cloud'
    connectedSince: Date | null
    totalConnectionTime: number
  }
}

export interface DeviceStats {
  period: string
  startDate: Date
  endDate: Date
  readingsCount: number
  avgPower: number
  maxPower: number
  minPower: number
  totalKwh: number
  avgVoltage: number
  avgCurrent: number
}

export interface CostSummary {
  totalCost: number
  currency: string
  kwhPrice: number
  totalKwh: number
}

export interface ReadingAggregation {
  timestamp: Date
  avgPower: number
  avgVoltage: number
  avgCurrent: number
  count: number
}

// Cache simples para sessoes de dispositivos (potencia media para calculo de custo)
const deviceSessions: Map<string, { startTime: Date; readings: number[] }> = new Map()

/**
 * Inicia ou atualiza sessao de um dispositivo
 */
export function updateDeviceSession(deviceId: string, powerWatts: number): void {
  const session = deviceSessions.get(deviceId)
  if (!session) {
    deviceSessions.set(deviceId, {
      startTime: new Date(),
      readings: [powerWatts],
    })
  } else {
    session.readings.push(powerWatts)
    // Mantem apenas as ultimas 1000 leituras em memoria
    if (session.readings.length > 1000) {
      session.readings = session.readings.slice(-1000)
    }
  }
}

/**
 * Encerra sessao de um dispositivo
 */
export function endDeviceSession(deviceId: string): void {
  deviceSessions.delete(deviceId)
}

/**
 * Obtem sessao de um dispositivo
 */
export function getDeviceSession(deviceId: string): { startTime: Date; readings: number[] } | null {
  return deviceSessions.get(deviceId) || null
}

/**
 * Limpa todas as sessoes
 */
export function clearAllSessions(): void {
  deviceSessions.clear()
}

/**
 * Retorna resumo do dashboard unificado
 */
export function getDashboardSummary(): DashboardSummary {
  const allDevices = listDevicesWithStatus()
  const settings = getSettings()

  let totalPowerWatts = 0
  let connectedCount = 0
  const deviceCards: DashboardDeviceCard[] = []

  for (const device of allDevices) {
    let status: DashboardDeviceCard['status'] = null
    let sessionCost = 0
    let sessionStartTime: Date | null = null

    if (device.enabled && device.isConnected) {
      connectedCount++
      const deviceStatus = getDeviceCurrentStatus(device.id)
      if (deviceStatus) {
        status = {
          switch: deviceStatus.switch,
          power: deviceStatus.power,
          voltage: deviceStatus.voltage,
          current: deviceStatus.current,
        }
        totalPowerWatts += deviceStatus.power || 0

        // Calcular custo da sessao
        const session = deviceSessions.get(device.id)
        if (session) {
          sessionStartTime = session.startTime
          const avgPower =
            session.readings.length > 0
              ? session.readings.reduce((a, b) => a + b, 0) / session.readings.length
              : 0
          const durationMs = Date.now() - session.startTime.getTime()
          sessionCost = calculateCost(avgPower, durationMs)
        }
      }
    }

    deviceCards.push({
      id: device.id,
      name: device.name,
      enabled: device.enabled,
      isConnected: device.isConnected,
      mode: device.communicationMode,
      status,
      sessionStartTime,
      sessionCost,
    })
  }

  const enabledDevices = allDevices.filter((d) => d.enabled)
  const totalSessionCost = deviceCards.reduce((sum, d) => sum + d.sessionCost, 0)

  return {
    totalDevices: allDevices.length,
    enabledDevices: enabledDevices.length,
    connectedDevices: connectedCount,
    totalPowerWatts,
    averagePowerWatts: connectedCount > 0 ? totalPowerWatts / connectedCount : 0,
    sessionCost: totalSessionCost,
    currency: settings.currency,
    devices: deviceCards,
  }
}

/**
 * Retorna dashboard detalhado de um dispositivo
 */
export function getDeviceDashboard(
  deviceId: string,
  startDate?: Date,
  endDate?: Date
): DeviceDashboard | null {
  const device = getDeviceWithStatus(deviceId)
  if (!device) return null

  const settings = getSettings()
  const now = new Date()
  const periodStart = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000) // Ultimas 24h padrao
  const periodEnd = endDate || now

  // Dados em tempo real
  let realtime: DeviceStatusResponse | null = null
  if (device.isConnected) {
    const status = getDeviceCurrentStatus(deviceId)
    if (status) {
      realtime = {
        ...status,
        deviceId: device.deviceId,
        deviceName: device.name,
        isConnected: true,
        mode: device.communicationMode,
      }
    }
  }

  // Estatisticas do periodo
  const stats = getDeviceStats(deviceId, periodStart, periodEnd)

  // Custo
  const costSummary: CostSummary = {
    totalCost: stats.totalKwh * settings.kwhPrice,
    currency: settings.currency,
    kwhPrice: settings.kwhPrice,
    totalKwh: stats.totalKwh,
  }

  // Info de conexao
  const session = deviceSessions.get(deviceId)

  return {
    device,
    realtime,
    stats,
    costSummary,
    connectionInfo: {
      mode: device.communicationMode,
      connectedSince: session?.startTime || null,
      totalConnectionTime: session ? Date.now() - session.startTime.getTime() : 0,
    },
  }
}

/**
 * Calcula estatisticas de um dispositivo para um periodo
 */
export function getDeviceStats(deviceId: string, startDate: Date, endDate: Date): DeviceStats {
  const db = getDb()

  const readings = db
    .select()
    .from(schema.readings)
    .where(
      and(
        eq(schema.readings.deviceId, deviceId),
        gte(schema.readings.timestamp, startDate),
        lte(schema.readings.timestamp, endDate)
      )
    )
    .orderBy(desc(schema.readings.timestamp))
    .all()

  if (readings.length === 0) {
    return {
      period: 'custom',
      startDate,
      endDate,
      readingsCount: 0,
      avgPower: 0,
      maxPower: 0,
      minPower: 0,
      totalKwh: 0,
      avgVoltage: 0,
      avgCurrent: 0,
    }
  }

  const powers = readings.map((r) => r.power ?? 0)
  const voltages = readings.map((r) => r.voltage ?? 0)
  const currents = readings.map((r) => r.current ?? 0)

  const avgPower = powers.reduce((a, b) => a + b, 0) / powers.length
  const maxPower = Math.max(...powers)
  const minPower = Math.min(...powers)
  const avgVoltage = voltages.reduce((a, b) => a + b, 0) / voltages.length
  const avgCurrent = currents.reduce((a, b) => a + b, 0) / currents.length

  // Calcular kWh total baseado no intervalo real das leituras
  // readings estão ordenados DESC, então [0] = mais recente, [length-1] = mais antigo
  const newestReading = readings[0]
  const oldestReading = readings[readings.length - 1]
  const newestTimestamp = newestReading ? newestReading.timestamp.getTime() : endDate.getTime()
  const oldestTimestamp = oldestReading ? oldestReading.timestamp.getTime() : startDate.getTime()
  const actualDurationHours = (newestTimestamp - oldestTimestamp) / (1000 * 60 * 60)
  const totalKwh = actualDurationHours > 0 ? (avgPower / 1000) * actualDurationHours : 0

  return {
    period: 'custom',
    startDate,
    endDate,
    readingsCount: readings.length,
    avgPower,
    maxPower,
    minPower,
    totalKwh,
    avgVoltage,
    avgCurrent,
  }
}

/**
 * Retorna leituras agregadas por intervalo (para graficos)
 */
export function getAggregatedReadings(
  deviceId: string,
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 5
): ReadingAggregation[] {
  const db = getDb()

  const readings = db
    .select()
    .from(schema.readings)
    .where(
      and(
        eq(schema.readings.deviceId, deviceId),
        gte(schema.readings.timestamp, startDate),
        lte(schema.readings.timestamp, endDate)
      )
    )
    .orderBy(schema.readings.timestamp)
    .all()

  if (readings.length === 0) return []

  // Agrupar por intervalo
  const buckets: Map<
    number,
    { powers: number[]; voltages: number[]; currents: number[]; timestamp: Date }
  > = new Map()
  const intervalMs = intervalMinutes * 60 * 1000

  for (const reading of readings) {
    const bucketTime = Math.floor(reading.timestamp.getTime() / intervalMs) * intervalMs
    const bucket = buckets.get(bucketTime)

    if (bucket) {
      bucket.powers.push(reading.power ?? 0)
      bucket.voltages.push(reading.voltage ?? 0)
      bucket.currents.push(reading.current ?? 0)
    } else {
      buckets.set(bucketTime, {
        powers: [reading.power ?? 0],
        voltages: [reading.voltage ?? 0],
        currents: [reading.current ?? 0],
        timestamp: new Date(bucketTime),
      })
    }
  }

  // Converter para array de agregacoes
  const result: ReadingAggregation[] = []
  for (const [, bucket] of buckets) {
    result.push({
      timestamp: bucket.timestamp,
      avgPower: bucket.powers.reduce((a, b) => a + b, 0) / bucket.powers.length,
      avgVoltage: bucket.voltages.reduce((a, b) => a + b, 0) / bucket.voltages.length,
      avgCurrent: bucket.currents.reduce((a, b) => a + b, 0) / bucket.currents.length,
      count: bucket.powers.length,
    })
  }

  return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Retorna custo agregado por hora (para grafico de barras)
 */
export function getHourlyCosts(
  deviceId: string,
  startDate: Date,
  endDate: Date
): { hour: Date; cost: number; kwh: number }[] {
  const settings = getSettings()
  const aggregated = getAggregatedReadings(deviceId, startDate, endDate, 60) // 1 hora

  return aggregated.map((agg) => {
    const kwh = agg.avgPower / 1000 // Por hora
    return {
      hour: agg.timestamp,
      kwh,
      cost: kwh * settings.kwhPrice,
    }
  })
}

const COMPARISON_PALETTE = ['#FBBF24', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444']

/**
 * Retorna dados de grafico de comparacao entre multiplos dispositivos
 */
export function getComparisonChartData(options: {
  deviceIds?: string[]
  startDate: Date
  endDate: Date
  intervalMinutes: number
}): ComparisonChartData {
  const { deviceIds, startDate, endDate, intervalMinutes } = options

  const allDevices = listDevices()
  const enabledDevices = allDevices.filter((d) => d.enabled)

  // Filtrar por deviceIds se fornecido
  const targetDevices = deviceIds
    ? enabledDevices.filter((d) => deviceIds.includes(d.id))
    : enabledDevices

  const devices: ComparisonChartDevice[] = targetDevices.map((device, index) => {
    const readings = getAggregatedReadings(device.id, startDate, endDate, intervalMinutes)
    return {
      deviceId: device.id,
      deviceName: device.name,
      color: COMPARISON_PALETTE[index % COMPARISON_PALETTE.length]!,
      readings,
    }
  })

  return { devices }
}

/**
 * Retorna rankings de comparacao entre multiplos dispositivos
 */
export function getComparisonRankings(options: {
  deviceIds?: string[]
  startDate: Date
  endDate: Date
}): ComparisonRankings {
  const { deviceIds, startDate, endDate } = options
  const settings = getSettings()

  const allDevices = listDevices()
  const enabledDevices = allDevices.filter((d) => d.enabled)

  // Filtrar por deviceIds se fornecido
  const targetDevices = deviceIds
    ? enabledDevices.filter((d) => deviceIds.includes(d.id))
    : enabledDevices

  // Coletar stats de cada dispositivo
  const deviceStatsEntries = targetDevices.map((device) => {
    const stats = getDeviceStats(device.id, startDate, endDate)
    const cost = stats.totalKwh * settings.kwhPrice
    return { device, stats, cost }
  })

  // Calcular totais
  const totalKwh = deviceStatsEntries.reduce((sum, e) => sum + e.stats.totalKwh, 0)
  const totalCost = deviceStatsEntries.reduce((sum, e) => sum + e.cost, 0)
  const totalPower = deviceStatsEntries.reduce((sum, e) => sum + e.stats.avgPower, 0)
  const totalVoltage = deviceStatsEntries.reduce((sum, e) => sum + e.stats.avgVoltage, 0)
  const totalCurrent = deviceStatsEntries.reduce((sum, e) => sum + e.stats.avgCurrent, 0)

  // Funcao auxiliar para criar ranking ordenado por metrica
  function buildRanking(
    getValue: (entry: (typeof deviceStatsEntries)[number]) => number,
    total: number
  ): DeviceRanking[] {
    const sorted = [...deviceStatsEntries].sort((a, b) => getValue(b) - getValue(a))
    return sorted.map((entry, index) => {
      const value = getValue(entry)
      return {
        deviceId: entry.device.id,
        deviceName: entry.device.name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        rank: index + 1,
      }
    })
  }

  return {
    rankings: {
      power: buildRanking((e) => e.stats.avgPower, totalPower),
      cost: buildRanking((e) => e.cost, totalCost),
      voltage: buildRanking((e) => e.stats.avgVoltage, totalVoltage),
      current: buildRanking((e) => e.stats.avgCurrent, totalCurrent),
    },
    totals: {
      totalKwh,
      totalCost,
      currency: settings.currency,
      kwhPrice: settings.kwhPrice,
    },
  }
}
