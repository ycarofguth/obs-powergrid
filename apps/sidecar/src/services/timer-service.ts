import type { TimerState, TimerConfigInput } from '@obs-tuya/shared'

function createDefaultTimer(id: string): TimerState {
  return {
    id,
    status: 'stopped',
    direction: 'up',
    elapsedMs: 0,
    targetMs: null,
    startedAt: null,
    label: '',
  }
}

const timers = new Map<string, TimerState>()

// Initialize default timer
timers.set('default', createDefaultTimer('default'))

export function getTimer(id = 'default'): TimerState {
  let timer = timers.get(id)

  if (!timer) {
    timer = createDefaultTimer(id)
    timers.set(id, timer)
  }

  // Retorna estado bruto — o cliente calcula o display com startedAt
  return { ...timer }
}

export function startTimer(id = 'default'): TimerState {
  let timer = timers.get(id)

  if (!timer) {
    timer = createDefaultTimer(id)
  }

  // Only start if not already running
  if (timer.status !== 'running') {
    timer = {
      ...timer,
      status: 'running',
      startedAt: Date.now(),
    }
    timers.set(id, timer)
  }

  return getTimer(id)
}

export function pauseTimer(id = 'default'): TimerState {
  let timer = timers.get(id)

  if (!timer) {
    timer = createDefaultTimer(id)
    timers.set(id, timer)
    return getTimer(id)
  }

  if (timer.status === 'running' && timer.startedAt !== null) {
    const elapsed = timer.elapsedMs + (Date.now() - timer.startedAt)
    timer = {
      ...timer,
      status: 'paused',
      elapsedMs: elapsed,
      startedAt: null,
    }
    timers.set(id, timer)
  }

  return getTimer(id)
}

export function stopTimer(id = 'default'): TimerState {
  const timer = timers.get(id)

  const stopped: TimerState = {
    ...(timer ?? createDefaultTimer(id)),
    status: 'stopped',
    elapsedMs: 0,
    startedAt: null,
  }

  timers.set(id, stopped)

  return getTimer(id)
}

export function resetTimer(id = 'default'): TimerState {
  let timer = timers.get(id)

  if (!timer) {
    timer = createDefaultTimer(id)
    timers.set(id, timer)
    return getTimer(id)
  }

  if (timer.status === 'running') {
    // Keep running but reset elapsed and startedAt
    timer = {
      ...timer,
      elapsedMs: 0,
      startedAt: Date.now(),
    }
  } else {
    timer = {
      ...timer,
      elapsedMs: 0,
    }
  }

  timers.set(id, timer)

  return getTimer(id)
}

export function updateTimer(id = 'default', config: TimerConfigInput): TimerState {
  let timer = timers.get(id)

  if (!timer) {
    timer = createDefaultTimer(id)
  }

  if (config.label !== undefined) {
    timer = { ...timer, label: config.label }
  }

  if (config.direction !== undefined) {
    timer = { ...timer, direction: config.direction }
  }

  if (config.targetMs !== undefined) {
    timer = { ...timer, targetMs: config.targetMs }
  }

  timers.set(id, timer)

  return getTimer(id)
}
