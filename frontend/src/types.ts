export type Student = {
  student_id: string
  name: string
  cohort_group: string
  year_level?: number
  year?: number
  program?: string
}

export type Pulse = {
  pulse_id: string
  student_id: string
  date: string
  wellbeing_level: number
  concerns: string[]
  optional_note: string | null
}

export type Trajectory = {
  student_id: string
  count: number
  pulses: Pulse[]
}

export type EarlyWarning = {
  status: string
  direction: string
  persistence: boolean
  magnitude: string
  signal_convergence: boolean
  context: string
  support_signal: string
  contributing_signals: string[]
  pattern_type?: string
  evidence_strength?: string
  baseline?: string
  deviation?: number
  why_now?: string
  context_explanation?: string
  historical_comparison?: string
  trajectory_explanation?: string
  why_detected?: {
    trajectory: string
    persistence: boolean
    magnitude: string
    context: string
    contributing_signals: string[]
    pattern_type?: string
    evidence_strength?: string
    why_now?: string
    context_explanation?: string
    historical_comparison?: string
  }
  explanation: string
  recommended_actions: string[]
  student_id: string
}

export type SupportOption = {
  option_id: string
  label: string
  type: string
  description: string
  student_controlled: boolean
}

export type DashboardOverview = {
  total_students: number
  total_pulses: number
  cohort_count: number
  status: string
}

export type DashboardTrends = {
  pulses: number
  trend_summary: string
}

export type DashboardCohort = {
  cohort_name: string
  status: string
  wellbeing_trend: string
  prevalence: number
  sample_size: number
  concerns: string[]
  context: string
  what_changed: string[]
  pattern_type?: string
  evidence_strength?: string
  baseline?: string
  deviation?: number
  why_now?: string
  context_explanation?: string
  historical_comparison?: string
  explanation: string
}

export type DashboardContextEvent = {
  event_id: string
  date: string
  event_type: string
  event_description: string
  assessment_period: number
  semester_phase: string
  major_deadline_flag: number
}

export type DashboardRecommendation = {
  cohort: string
  recommendation: string
}

export type StudentScreen = 'pulse' | 'journey' | 'support'
export type AppRoute = 'landing' | 'student-select' | 'student' | 'university'
