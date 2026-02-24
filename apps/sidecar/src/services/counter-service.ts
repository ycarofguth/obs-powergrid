import type { CounterState, CounterConfigInput } from '@obs-tuya/shared'

function createDefaultCounter(id: string): CounterState {
  return {
    id,
    value: 0,
    step: 1,
    label: '',
    min: null,
    max: null,
  }
}

const counters = new Map<string, CounterState>()

// Initialize default counter
counters.set('default', createDefaultCounter('default'))

export function getCounter(id = 'default'): CounterState {
  let counter = counters.get(id)

  if (!counter) {
    counter = createDefaultCounter(id)
    counters.set(id, counter)
  }

  return { ...counter }
}

export function incrementCounter(id = 'default'): CounterState {
  let counter = counters.get(id)

  if (!counter) {
    counter = createDefaultCounter(id)
  }

  let newValue = counter.value + counter.step

  // Respect max boundary
  if (counter.max !== null && newValue > counter.max) {
    newValue = counter.max
  }

  counter = { ...counter, value: newValue }
  counters.set(id, counter)

  return getCounter(id)
}

export function decrementCounter(id = 'default'): CounterState {
  let counter = counters.get(id)

  if (!counter) {
    counter = createDefaultCounter(id)
  }

  let newValue = counter.value - counter.step

  // Respect min boundary
  if (counter.min !== null && newValue < counter.min) {
    newValue = counter.min
  }

  counter = { ...counter, value: newValue }
  counters.set(id, counter)

  return getCounter(id)
}

export function resetCounter(id = 'default'): CounterState {
  let counter = counters.get(id)

  if (!counter) {
    counter = createDefaultCounter(id)
  }

  counter = { ...counter, value: 0 }
  counters.set(id, counter)

  return getCounter(id)
}

export function updateCounter(id = 'default', config: CounterConfigInput): CounterState {
  let counter = counters.get(id)

  if (!counter) {
    counter = createDefaultCounter(id)
  }

  if (config.label !== undefined) {
    counter = { ...counter, label: config.label }
  }

  if (config.step !== undefined) {
    counter = { ...counter, step: config.step }
  }

  if (config.min !== undefined) {
    counter = { ...counter, min: config.min }
  }

  if (config.max !== undefined) {
    counter = { ...counter, max: config.max }
  }

  if (config.value !== undefined) {
    counter = { ...counter, value: config.value }
  }

  counters.set(id, counter)

  return getCounter(id)
}
