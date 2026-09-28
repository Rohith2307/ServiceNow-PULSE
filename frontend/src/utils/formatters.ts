import type { Pulse } from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const CONCERN_OPTIONS = [
  { id: 'academic pressure', label: 'Academic pressure', icon: '📚' },
  { id: 'sleep', label: 'Sleep & rest', icon: '😴' },
  { id: 'workload', label: 'Workload pacing', icon: '💼' },
  { id: 'time management', label: 'Time & deadlines', icon: '⏳' },
  { id: 'financial stress', label: 'Financial worries', icon: '💳' },
  { id: 'social adjustment', label: 'Social & connection', icon: '🌱' },
  { id: 'orientation', label: 'Settling in & routine', icon: '🧭' },
]

export const SCORE_DESCRIPTORS: Record<number, { label: string; tone: string }> = {
  1: { label: 'Struggling heavily', tone: 'Very depleted' },
  2: { label: 'Feeling quite low', tone: 'Heavy strain' },
  3: { label: 'A bit overwhelmed', tone: 'Substantial load' },
  4: { label: 'Somewhat stretched', tone: 'Low energy' },
  5: { label: 'Managing steadily', tone: 'Neutral & holding steady' },
  6: { label: 'Doing okay', tone: 'Relatively balanced' },
  7: { label: 'Feeling good', tone: 'Positive momentum' },
  8: { label: 'Energized & calm', tone: 'Solid focus' },
  9: { label: 'Very fulfilled', tone: 'Thriving & engaged' },
  10: { label: 'Exceptional', tone: 'Peak wellbeing' },
}

export function humanizeStatus(status?: string): string {
  switch (status) {
    case 'SUPPORT_SUGGESTED':
      return 'Support choices suggested'
    case 'EMERGING':
      return 'Pattern developing'
    case 'WATCH':
      return 'Early observation'
    case 'STABLE':
    default:
      return 'Steady pattern'
  }
}

export function humanizePatternType(patternType?: string): string {
  switch (patternType) {
    case 'EXPECTED_CONTEXTUAL_CHANGE':
      return 'Expected contextual shift'
    case 'UNUSUAL_PATTERN':
      return 'Noticeable shift from baseline'
    case 'EMERGING_PATTERN':
      return 'Emerging trend'
    case 'STABLE':
    default:
      return 'Consistent pattern'
  }
}

export function humanizeEvidence(strength?: string): string {
  switch (strength) {
    case 'STRONG':
      return 'Strong, consistent pattern'
    case 'MODERATE':
      return 'Moderate pattern'
    case 'LIMITED':
    default:
      return 'Early observation'
  }
}

export function humanizeDirection(direction?: string): string {
  switch (direction) {
    case 'declining':
      return 'Downward trend'
    case 'improving':
      return 'Upward trend'
    case 'stable':
    default:
      return 'Steady'
  }
}

export function humanizeDeviation(deviation?: number): string {
  if (deviation === undefined || deviation === null) return 'In line with your baseline'
  if (deviation < -0.2) {
    return `${Math.abs(deviation).toFixed(1)} points below earlier baseline`
  }
  if (deviation > 0.2) {
    return `${deviation.toFixed(1)} points above earlier baseline`
  }
  return 'Closely aligned with established baseline'
}

export function humanizeSignal(signal: string): string {
  switch (signal) {
    case 'wellbeing_decline':
      return 'Reported lower wellbeing'
    case 'attendance_decline':
      return 'Missed class sessions'
    case 'deadline_pressure':
      return 'Upcoming deadlines'
    case 'extension_requests':
      return 'Coursework extension requests'
    case 'support_requests':
      return 'Prior support contacts'
    case 'academic_pressure':
      return 'Academic pressure'
    case 'sleep_concern':
      return 'Sleep disruption'
    case 'financial_concern':
      return 'Financial stress'
    default:
      return signal.replace(/_/g, ' ')
  }
}

export function humanizeContext(context?: string): string {
  switch (context) {
    case 'assessment_period':
      return 'Mid-semester assessment period'
    case 'assignment_deadline':
      return 'Major assignment deadline'
    case 'semester_transition':
      return 'Semester transition phase'
    case 'high_cohort_stress':
      return 'Elevated cohort pressure'
    case 'stable_context':
    default:
      return 'Standard academic term'
  }
}

export function humanizeCohortStatus(status?: string): {
  label: string
  badgeClass: string
  desc: string
} {
  switch (status) {
    case 'EMERGING':
      return {
        label: 'Emerging Pattern',
        badgeClass: 'badge-emerging',
        desc: 'Sustained downward shift from baseline across reporting window',
      }
    case 'WATCH':
      return {
        label: 'Early Watch',
        badgeClass: 'badge-watch',
        desc: 'Early downward movement without full multi-signal convergence',
      }
    case 'STABLE':
    default:
      return {
        label: 'Stable Baseline',
        badgeClass: 'badge-stable',
        desc: 'Wellbeing distribution remains aligned with normal baseline',
      }
  }
}

export function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes('500') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Unable to reach the PULSE service. Please verify that the backend is active.'
    }
    if (msg.includes('404')) {
      return 'The requested information was not found.'
    }
    return msg
  }
  return fallback
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

export function calculateNextWeek(pulses: Pulse[] | undefined): string {
  if (!pulses || pulses.length === 0) return '2026-W01'
  const lastPulse = pulses[pulses.length - 1]
  const match = lastPulse.date.match(/^(\d{4})-W(\d{1,2})$/)
  if (match) {
    const year = match[1]
    const week = parseInt(match[2], 10) + 1
    return `${year}-W${String(week).padStart(2, '0')}`
  }
  return `2026-W${String(pulses.length + 1).padStart(2, '0')}`
}
