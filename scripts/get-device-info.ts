/**
 * Script para obter Device ID, Local Key e IP dos dispositivos Tuya
 *
 * Uso:
 *   npx tsx scripts/get-device-info.ts
 *
 * Você vai precisar das credenciais do projeto Tuya IoT Platform:
 *   - Client ID (Access ID)
 *   - Client Secret (Access Secret)
 *
 * Encontre em: iot.tuya.com → Cloud → Project → Overview
 */

import crypto from 'crypto'
import readline from 'readline'

const TUYA_REGIONS: Record<string, string> = {
  us: 'https://openapi.tuyaus.com', // Western America
  eu: 'https://openapi.tuyaeu.com', // Central Europe
  cn: 'https://openapi.tuyacn.com', // China
  in: 'https://openapi.tuyain.com', // India
}

interface TuyaConfig {
  clientId: string
  clientSecret: string
  region: string
}

interface DeviceInfo {
  id: string
  name: string
  local_key: string
  ip: string
  category: string
  online: boolean
}

function createSign(
  clientId: string,
  secret: string,
  timestamp: string,
  accessToken: string,
  method: string,
  path: string,
  body: string = ''
): string {
  const contentHash = crypto.createHash('sha256').update(body).digest('hex')
  const stringToSign = [method, contentHash, '', path].join('\n')
  const signStr = clientId + accessToken + timestamp + stringToSign
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase()
}

async function getAccessToken(config: TuyaConfig): Promise<string> {
  const timestamp = Date.now().toString()
  const path = '/v1.0/token?grant_type=1'
  const sign = createSign(config.clientId, config.clientSecret, timestamp, '', 'GET', path)

  const response = await fetch(`${TUYA_REGIONS[config.region]}${path}`, {
    method: 'GET',
    headers: {
      client_id: config.clientId,
      sign: sign,
      t: timestamp,
      sign_method: 'HMAC-SHA256',
    },
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(`Erro ao obter token: ${data.msg} (code: ${data.code})`)
  }

  return data.result.access_token
}

async function getDevices(config: TuyaConfig, accessToken: string): Promise<DeviceInfo[]> {
  const timestamp = Date.now().toString()
  const path = '/v1.0/iot-01/associated-users/devices'
  const sign = createSign(config.clientId, config.clientSecret, timestamp, accessToken, 'GET', path)

  const response = await fetch(`${TUYA_REGIONS[config.region]}${path}`, {
    method: 'GET',
    headers: {
      client_id: config.clientId,
      access_token: accessToken,
      sign: sign,
      t: timestamp,
      sign_method: 'HMAC-SHA256',
    },
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(`Erro ao listar dispositivos: ${data.msg} (code: ${data.code})`)
  }

  return data.result.devices || []
}

async function getDeviceDetails(
  config: TuyaConfig,
  accessToken: string,
  deviceId: string
): Promise<DeviceInfo | null> {
  const timestamp = Date.now().toString()
  const path = `/v1.0/devices/${deviceId}`
  const sign = createSign(config.clientId, config.clientSecret, timestamp, accessToken, 'GET', path)

  const response = await fetch(`${TUYA_REGIONS[config.region]}${path}`, {
    method: 'GET',
    headers: {
      client_id: config.clientId,
      access_token: accessToken,
      sign: sign,
      t: timestamp,
      sign_method: 'HMAC-SHA256',
    },
  })

  const data = await response.json()

  if (!data.success) {
    console.error(`Erro ao obter detalhes do dispositivo ${deviceId}: ${data.msg}`)
    return null
  }

  return data.result
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('\n=== Tuya Device Info ===\n')
  console.log('Obtenha Client ID e Client Secret em:')
  console.log('iot.tuya.com → Cloud → Project → Overview\n')

  const clientId = await prompt('Client ID (Access ID): ')
  const clientSecret = await prompt('Client Secret (Access Secret): ')

  console.log('\nRegiões disponíveis:')
  console.log('  us - Western America (Brasil)')
  console.log('  eu - Central Europe')
  console.log('  cn - China')
  console.log('  in - India')

  const region = (await prompt('Região [us]: ')) || 'us'

  if (!TUYA_REGIONS[region]) {
    console.error('Região inválida')
    process.exit(1)
  }

  const config: TuyaConfig = { clientId, clientSecret, region }

  try {
    console.log('\nObtendo token de acesso...')
    const accessToken = await getAccessToken(config)
    console.log('Token obtido com sucesso!')

    console.log('\nListando dispositivos...')
    const devices = await getDevices(config, accessToken)

    if (devices.length === 0) {
      console.log('Nenhum dispositivo encontrado.')
      console.log('Verifique se você vinculou o app Tuya/Smart Life ao projeto.')
      return
    }

    console.log(`\nEncontrados ${devices.length} dispositivo(s):\n`)
    console.log('='.repeat(80))

    for (const device of devices) {
      const details = await getDeviceDetails(config, accessToken, device.id)

      if (details) {
        console.log(`\nNome: ${details.name}`)
        console.log(`Categoria: ${details.category}`)
        console.log(`Online: ${details.online ? 'Sim' : 'Não'}`)
        console.log('-'.repeat(40))
        console.log(`Device ID:  ${details.id}`)
        console.log(`Local Key:  ${details.local_key}`)
        console.log(`IP:         ${details.ip || 'N/A (use scan na rede local)'}`)
        console.log('='.repeat(80))
      }
    }

    console.log('\n✓ Copie o Device ID, Local Key e IP para o app.')
    console.log('  Se o IP não aparecer, descubra pelo roteador ou app Tuya.\n')
  } catch (error) {
    console.error('\nErro:', (error as Error).message)
    console.log('\nPossíveis causas:')
    console.log('  - Client ID ou Secret incorretos')
    console.log('  - Região errada (deve ser a mesma do app)')
    console.log('  - APIs não habilitadas no projeto (IoT Core)')
    console.log('  - Trial expirado (ative o Basic Plan em My Services)')
  }
}

main()
