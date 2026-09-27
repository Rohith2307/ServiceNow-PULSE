import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Student = {
  student_id: string
  name: string
  cohort_group: string
  year_level?: number
  year?: number
  program?: string
}

type Pulse = {
  pulse_id: string
  student_id: string
  date: string
  wellbeing_level: number
  concerns: string[]
  optional_note: string | null
}

type Trajectory = {
  student_id: string
  count: number
  pulses: Pulse[]
}

type EarlyWarning = {
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

type SupportOption = {
  option_id: string
  label: string
  type: string
  description: string
  student_controlled: boolean
}

type DashboardOverview = {
  total_students: number
  total_pulses: number
  cohort_count: number
  status: string
}

type DashboardTrends = {
  pulses: number
  trend_summary: string
}

type DashboardCohort = {
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

type DashboardContextEvent = {
  event_id: string
  date: string
  event_type: string
  event_description: string
  assessment_period: number
  semester_phase: string
  major_deadline_flag: number
}

type DashboardRecommendation = {
  cohort: string
  recommendation: string
}

type AppScreen = 'pulse' | 'journey' | 'support' | 'university'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const CONCERN_OPTIONS = [
  { id: 'academic pressure', label: 'Academic pressure', icon: '📚' },
  { id: 'sleep', label: 'Sleep & rest', icon: '😴' },
  { id: 'workload', label: 'Workload pacing', icon: '💼' },
  { id: 'time management', label: 'Time & deadlines', icon: '⏳' },
  { id: 'financial stress', label: 'Financial worries', icon: '💳' },
  { id: 'social adjustment', label: 'Social & connection', icon: '🌱' },
  { id: 'orientation', label: 'Settling in & routine', icon: '🧭' },
]

const SCORE_DESCRIPTORS: Record<number, { label: string; tone: string }> = {
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

function getActiveScreen(pathname: string): AppScreen {
  if (pathname.startsWith('/university')) return 'university'
  if (pathname.startsWith('/journey') || pathname.startsWith('/my-journey')) return 'journey'
  if (pathname.startsWith('/support') || pathname.startsWith('/my-support')) return 'support'
  return 'pulse'
}

// Human-friendly explainability helpers to avoid raw backend terminology dumps
function humanizeStatus(status?: string): string {
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

function humanizePatternType(patternType?: string): string {
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

function humanizeEvidence(strength?: string): string {
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

function humanizeDirection(direction?: string): string {
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

function humanizeDeviation(deviation?: number): string {
  if (deviation === undefined || deviation === null) return 'In line with your baseline'
  if (deviation < -0.2) {
    return `${Math.abs(deviation).toFixed(1)} points below your earlier baseline`
  }
  if (deviation > 0.2) {
    return `${deviation.toFixed(1)} points above your earlier baseline`
  }
  return 'Closely aligned with your established baseline'
}

function humanizeSignal(signal: string): string {
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

function humanizeContext(context?: string): string {
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

function formatError(error: unknown, fallback: string): string {
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

function calculateNextWeek(pulses: Pulse[] | undefined): string {
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

export default function App() {
  const [route, setRoute] = useState<string>(() => window.location.pathname)

  useEffect(() => {
    const handleRouteChange = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  const navigateToScreen = (screen: AppScreen) => {
    const screenPaths: Record<AppScreen, string> = {
      pulse: '/my-pulse',
      journey: '/my-journey',
      support: '/my-support',
      university: '/university',
    }
    const path = screenPaths[screen]
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  const activeScreen = getActiveScreen(route)

  if (activeScreen === 'university') {
    return <UniversityDashboard activeScreen={activeScreen} onNavigate={navigateToScreen} />
  }

  return <StudentAppShell activeScreen={activeScreen} onNavigate={navigateToScreen} />
}

function StudentAppShell({
  activeScreen,
  onNavigate,
}: {
  activeScreen: AppScreen
  onNavigate: (screen: AppScreen) => void
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('Aisha-202')
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null)
  const [warning, setWarning] = useState<EarlyWarning | null>(null)
  const [supportOptions, setSupportOptions] = useState<SupportOption[]>([])
  const [contextEvents, setContextEvents] = useState<DashboardContextEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedStudent = useMemo(
    () => students.find((student) => student.student_id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  )

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await fetchJson<Student[]>(`${API_BASE_URL}/api/students`)
        setStudents(data)
        if (data.length > 0 && !data.some((student) => student.student_id === selectedStudentId)) {
          setSelectedStudentId(data[0].student_id)
        }
      } catch (loadError) {
        setError(formatError(loadError, 'Unable to load student directory'))
      }
    }

    void loadStudents()
  }, [selectedStudentId])

  const loadStudentData = async (studentId: string) => {
    setLoading(true)
    setError('')

    try {
      const [trajectoryData, warningData, supportData, contextData] = await Promise.all([
        fetchJson<Trajectory>(`${API_BASE_URL}/api/students/${studentId}/trajectory`),
        fetchJson<EarlyWarning>(`${API_BASE_URL}/api/students/${studentId}/early-warning`),
        fetchJson<SupportOption[]>(`${API_BASE_URL}/api/students/${studentId}/support-options`),
        fetchJson<DashboardContextEvent[]>(`${API_BASE_URL}/api/dashboard/context`).catch(() => []),
      ])

      setTrajectory(trajectoryData)
      setWarning(warningData)
      setSupportOptions(supportData)
      setContextEvents(contextData)
    } catch (loadError) {
      setError(formatError(loadError, 'Could not load student profile'))
      setTrajectory(null)
      setWarning(null)
      setSupportOptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedStudentId) return
    void loadStudentData(selectedStudentId)
  }, [selectedStudentId])

  return (
    <div className="app-shell">
      <aside className="side-panel">
        <div className="brand-block">
          <div className="brand-logo-row">
            <span className="brand-mark">●</span>
            <span className="brand-badge">PULSE</span>
          </div>
          <p className="brand-tagline">Your confidential wellbeing space</p>
        </div>

        <div className="nav-group">
          <span className="nav-group-label">Student Space</span>
          <nav className="main-nav" aria-label="Student space navigation">
            <button
              type="button"
              className={`main-nav-button ${activeScreen === 'pulse' ? 'active' : ''}`}
              onClick={() => onNavigate('pulse')}
            >
              <span className="nav-icon">📝</span>
              <div className="nav-text">
                <span className="nav-title">My Pulse</span>
                <span className="nav-sub">Check in for this week</span>
              </div>
            </button>
            <button
              type="button"
              className={`main-nav-button ${activeScreen === 'journey' ? 'active' : ''}`}
              onClick={() => onNavigate('journey')}
            >
              <span className="nav-icon">📈</span>
              <div className="nav-text">
                <span className="nav-title">My Journey</span>
                <span className="nav-sub">What has changed over time</span>
              </div>
            </button>
            <button
              type="button"
              className={`main-nav-button ${activeScreen === 'support' ? 'active' : ''}`}
              onClick={() => onNavigate('support')}
            >
              <span className="nav-icon">🛡️</span>
              <div className="nav-text">
                <span className="nav-title">My Support</span>
                <span className="nav-sub">Voluntary choices &amp; options</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="nav-group institution-group">
          <span className="nav-group-label">Institutional Overview</span>
          <nav className="main-nav" aria-label="Institutional navigation">
            <button
              type="button"
              className={`main-nav-button inst-button ${
                activeScreen === 'university' ? 'active' : ''
              }`}
              onClick={() => onNavigate('university')}
            >
              <span className="nav-icon">🏛️</span>
              <div className="nav-text">
                <span className="nav-title">University Intelligence</span>
                <span className="nav-sub">Cohort patterns (Aggregate)</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="side-divider" />

        <div className="student-profile-block">
          <label className="field-label" htmlFor="student-select">
            Active Student Space
          </label>
          <select
            id="student-select"
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
          >
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {student.name} ({student.student_id})
              </option>
            ))}
          </select>
        </div>

        <div className="mini-card privacy-callout">
          <div className="privacy-badge">🔒 Private &amp; Student-Controlled</div>
          <p className="privacy-text">
            PULSE does not report scores to professors or create automatic referrals.
          </p>
        </div>
      </aside>

      <main className="main-panel">
        {error ? <div className="status-banner error">{error}</div> : null}

        {selectedStudent && (
          <header className="hero-header">
            <div>
              <div className="hero-breadcrumbs">
                <span className="breadcrumb-root">Student Space</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">
                  {activeScreen === 'pulse' && 'My Pulse'}
                  {activeScreen === 'journey' && 'My Journey'}
                  {activeScreen === 'support' && 'My Support'}
                </span>
              </div>
              <h1 className="hero-greeting">
                {activeScreen === 'pulse' && `Hi ${selectedStudent.name}, how are you feeling?`}
                {activeScreen === 'journey' && `${selectedStudent.name}'s Wellbeing Journey`}
                {activeScreen === 'support' && `Support Options for ${selectedStudent.name}`}
              </h1>
              <p className="hero-subline">
                {activeScreen === 'pulse' &&
                  'A quick, private check-in to reflect on your week and track your personal pattern.'}
                {activeScreen === 'journey' &&
                  'Understanding how your wellbeing and context have shifted over recent weeks.'}
                {activeScreen === 'support' &&
                  'Voluntary choices tailored to your pattern. Everything remains under your control.'}
              </p>
            </div>

            <div className="header-status-badge">
              <span className="status-dot">●</span>
              <span>{humanizeStatus(warning?.status)}</span>
            </div>
          </header>
        )}

        {loading && !trajectory ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Gathering your personal wellbeing data…</p>
          </div>
        ) : (
          <div className="screen-content-wrapper">
            {activeScreen === 'pulse' && (
              <MyPulseScreen
                student={selectedStudent}
                trajectory={trajectory}
                warning={warning}
                onPulseSubmitted={() => loadStudentData(selectedStudentId)}
                onNavigate={onNavigate}
              />
            )}

            {activeScreen === 'journey' && (
              <MyJourneyScreen
                warning={warning}
                trajectory={trajectory}
                contextEvents={contextEvents}
                onNavigate={onNavigate}
              />
            )}

            {activeScreen === 'support' && (
              <MySupportScreen
                warning={warning}
                trajectory={trajectory}
                supportOptions={supportOptions}
                onNavigate={onNavigate}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function MyPulseScreen({
  student,
  trajectory,
  warning,
  onPulseSubmitted,
  onNavigate,
}: {
  student: Student | null
  trajectory: Trajectory | null
  warning: EarlyWarning | null
  onPulseSubmitted: () => Promise<void>
  onNavigate: (screen: AppScreen) => void
}) {
  const latestPulse = trajectory?.pulses.at(-1) ?? null
  const [showPreviousCheckin, setShowPreviousCheckin] = useState(false)

  return (
    <div className="content-stack">
      <PulseCheckinForm
        key={student?.student_id ?? 'student'}
        student={student}
        trajectory={trajectory}
        warning={warning}
        onPulseSubmitted={onPulseSubmitted}
        onNavigate={onNavigate}
      />

      {latestPulse ? (
        <section className="card quiet-card">
          <div className="quiet-card-header">
            <div className="quiet-card-meta">
              <span className="quiet-icon">🗓️</span>
              <div>
                <span className="small-label">Previous Check-in</span>
                <p className="quiet-title">
                  Week {latestPulse.date} · Rated{' '}
                  <strong>{latestPulse.wellbeing_level} / 10</strong>
                  {latestPulse.concerns.length > 0 &&
                    ` · ${latestPulse.concerns.map(humanizeSignal).join(', ')}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="toggle-link-button"
              onClick={() => setShowPreviousCheckin((prev) => !prev)}
            >
              {showPreviousCheckin ? 'Hide note' : 'View past note'}
            </button>
          </div>

          {showPreviousCheckin && (
            <div className="previous-details-panel">
              <p className="previous-note-text">
                "{latestPulse.optional_note || 'No optional note provided for this check-in.'}"
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}

function PulseCheckinForm({
  student,
  trajectory,
  warning,
  onPulseSubmitted,
  onNavigate,
}: {
  student: Student | null
  trajectory: Trajectory | null
  warning: EarlyWarning | null
  onPulseSubmitted: () => Promise<void>
  onNavigate: (screen: AppScreen) => void
}) {
  const [date, setDate] = useState(() => calculateNextWeek(trajectory?.pulses))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [wellbeingLevel, setWellbeingLevel] = useState<number>(6)
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([])
  const [optionalNote, setOptionalNote] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submittedDate, setSubmittedDate] = useState<string | null>(null)

  useEffect(() => {
    if (!submittedDate) {
      setDate(calculateNextWeek(trajectory?.pulses))
    }
  }, [trajectory?.pulses, submittedDate])

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((item) => item !== concern) : [...prev, concern],
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!student) return

    setSubmitting(true)
    setFormError('')

    try {
      const payload = {
        student_id: student.student_id,
        date: date.trim(),
        wellbeing_level: wellbeingLevel,
        concerns: selectedConcerns,
        optional_note: optionalNote.trim() || null,
      }

      const response = await fetch(`${API_BASE_URL}/api/pulses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Please ensure all required fields are filled correctly.')
        }
        if (response.status === 500) {
          throw new Error(
            `A check-in for date ${date.trim()} has already been recorded or could not be saved. Please pick a new date or week.`,
          )
        }
        throw new Error(`Submission failed with status ${response.status}`)
      }

      const submitted = date.trim()
      await onPulseSubmitted()
      setSubmittedDate(submitted)
      setDate(calculateNextWeek([...(trajectory?.pulses ?? []), { pulse_id: 'new', student_id: student.student_id, date: submitted, wellbeing_level: wellbeingLevel, concerns: selectedConcerns, optional_note: optionalNote }]))
      setOptionalNote('')
      setSelectedConcerns([])
    } catch (err) {
      setFormError(formatError(err, 'Failed to record check-in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const activeDescriptor = SCORE_DESCRIPTORS[wellbeingLevel] ?? {
    label: 'Managing',
    tone: 'Steady',
  }

  return (
    <>
      {submittedDate ? (
        <section className="card post-submit-card">
          <div className="post-submit-header">
            <div className="post-submit-icon">✓</div>
            <div className="post-submit-content">
              <h3>Your check-in is saved</h3>
              <p className="support-copy">
                Your entry for <strong>Week {submittedDate}</strong> has been seamlessly
                incorporated into your personal wellbeing journey.
              </p>
            </div>
          </div>

          <div className="post-submit-actions">
            <button
              type="button"
              className="action-button primary-action"
              onClick={() => onNavigate('journey')}
            >
              View My Journey →
            </button>
            {warning?.status === 'SUPPORT_SUGGESTED' || warning?.status === 'EMERGING' ? (
              <button
                type="button"
                className="action-button secondary-action"
                onClick={() => onNavigate('support')}
              >
                Explore Support Options →
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {formError ? <div className="status-banner error">{formError}</div> : null}

      <section className="card checkin-main-card">
        <div className="card-header borderless">
          <div>
            <span className="section-step-indicator">Step 1 of 1 · Quick Reflection</span>
            <h2 className="checkin-title">Weekly Pulse Check-in</h2>
          </div>
          <div className="period-badge-wrap">
            <span className="period-badge">Target: Week {date}</span>
            <button
              type="button"
              className="date-toggle-button"
              onClick={() => setShowDatePicker((prev) => !prev)}
            >
              {showDatePicker ? 'Done' : 'Change week'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pulse-form">
          {showDatePicker && (
            <div className="form-group date-picker-box">
              <label htmlFor="pulse-date" className="input-label">
                Target Week Identifier
              </label>
              <input
                id="pulse-date"
                type="text"
                className="text-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. 2026-W05"
                required
                disabled={submitting}
              />
              <small className="helper-text">Format: YYYY-W## (auto-incremented)</small>
            </div>
          )}

          {/* Primary Hierarchy: Tactile 1-10 Wellbeing rating */}
          <div className="form-group primary-rating-group">
            <div className="rating-header-row">
              <label className="input-label">
                How would you rate your overall wellbeing this week?
              </label>
              <div className="selected-score-chip">
                <span className="score-num">{wellbeingLevel}</span>
                <span className="score-max">/ 10</span>
              </div>
            </div>

            <div className="score-selector" role="radiogroup" aria-label="Wellbeing score 1 to 10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                const isCurrent = wellbeingLevel === score
                return (
                  <button
                    key={score}
                    type="button"
                    className={`score-button ${isCurrent ? 'active' : ''}`}
                    onClick={() => setWellbeingLevel(score)}
                    disabled={submitting}
                    aria-pressed={isCurrent}
                    title={`Rate ${score} of 10`}
                  >
                    {score}
                  </button>
                )
              })}
            </div>

            <div className="score-feedback-bar">
              <span className="descriptor-label">{activeDescriptor.label}</span>
              <span className="descriptor-tone">{activeDescriptor.tone}</span>
            </div>
          </div>

          {/* Secondary Hierarchy: What's been on your mind? */}
          <div className="form-group">
            <div className="input-label-row">
              <label className="input-label">What has been affecting you?</label>
              <span className="optional-tag">Optional context</span>
            </div>
            <div className="chip-grid">
              {CONCERN_OPTIONS.map((concern) => {
                const isSelected = selectedConcerns.includes(concern.id)
                return (
                  <button
                    key={concern.id}
                    type="button"
                    className={`concern-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleConcern(concern.id)}
                    disabled={submitting}
                    aria-pressed={isSelected}
                  >
                    <span className="chip-icon">{concern.icon}</span>
                    <span className="chip-text">{concern.label}</span>
                    {isSelected ? <span className="chip-check">✓</span> : null}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tertiary Hierarchy: Optional personal note */}
          <div className="form-group">
            <div className="input-label-row">
              <label htmlFor="optional-note" className="input-label">
                Personal reflection
              </label>
              <span className="optional-tag">Private · Optional</span>
            </div>
            <textarea
              id="optional-note"
              className="textarea-input"
              rows={2}
              value={optionalNote}
              onChange={(e) => setOptionalNote(e.target.value)}
              placeholder="Anything you'd like to remember about this week? (Only visible to you)"
              disabled={submitting}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button primary-cta"
              disabled={submitting}
            >
              {submitting ? 'Saving your check-in…' : 'Save Check-in'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

function MyJourneyScreen({
  warning,
  trajectory,
  contextEvents,
  onNavigate,
}: {
  warning: EarlyWarning | null
  trajectory: Trajectory | null
  contextEvents: DashboardContextEvent[]
  onNavigate: (screen: AppScreen) => void
}) {
  const pulses = trajectory?.pulses ?? []
  const hasPulses = pulses.length > 0

  const previousObservations = pulses.length > 2 ? pulses.slice(0, pulses.length - 2) : []
  const recentObservations = pulses.length > 2 ? pulses.slice(pulses.length - 2) : pulses

  const baselineSummary = warning?.baseline ?? 'Baseline is being calculated from your check-ins.'

  // Extract a human baseline number if available for visual alignment
  const baselineMatch = baselineSummary.match(/baseline.*?(\d+\.?\d*)/i)
  const baselineVal = baselineMatch ? parseFloat(baselineMatch[1]) : 6.0

  return (
    <div className="content-stack journey-experience">
      {/* 1. Hero Narrative Statement */}
      <section className="card journey-hero-card">
        <div className="hero-statement-top">
          <span className="story-pill">Personal Wellbeing Story</span>
          <div className="hero-status-tags">
            <span className="meta-badge-soft">{humanizePatternType(warning?.pattern_type)}</span>
            <span className="meta-badge-soft emphasis">
              {humanizeEvidence(warning?.evidence_strength)}
            </span>
          </div>
        </div>

        <h2 className="story-headline">
          {warning?.direction === 'declining'
            ? 'Your recent check-ins have stayed lower than your earlier baseline.'
            : 'Your wellbeing check-ins are holding steady against your baseline.'}
        </h2>

        <p className="story-lead">
          {warning
            ? warning.explanation
            : 'PULSE tracks shifts over time to help you reflect with context and provide voluntary support whenever you want.'}
        </p>

        <div className="journey-summary-bar">
          <div className="summary-stat">
            <span className="stat-label">Direction</span>
            <strong className="stat-val">{humanizeDirection(warning?.direction)}</strong>
          </div>
          <div className="summary-stat-divider" />
          <div className="summary-stat">
            <span className="stat-label">Persistence</span>
            <strong className="stat-val">
              {warning?.persistence ? 'Sustained (3+ weeks)' : 'Short-term'}
            </strong>
          </div>
          <div className="summary-stat-divider" />
          <div className="summary-stat">
            <span className="stat-label">Baseline Deviation</span>
            <strong className="stat-val">{humanizeDeviation(warning?.deviation)}</strong>
          </div>
        </div>
      </section>

      {/* 2. Visual Trajectory Timeline Centerpiece */}
      <section className="card trajectory-chart-card">
        <div className="card-header borderless">
          <div>
            <span className="section-step-indicator">Longitudinal View</span>
            <h3>Wellbeing Timeline &amp; Baseline Comparison</h3>
          </div>
          <div className="trajectory-legend">
            <span className="legend-item">
              <span className="legend-dot active" /> Check-in score
            </span>
            <span className="legend-item">
              <span className="legend-line-sample" /> Established baseline ({baselineVal.toFixed(1)})
            </span>
          </div>
        </div>

        {!hasPulses ? (
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p>Not enough check-in history to identify a trajectory yet.</p>
            <button
              type="button"
              className="action-button secondary-action"
              onClick={() => onNavigate('pulse')}
            >
              Submit your first pulse →
            </button>
          </div>
        ) : (
          <div className="trajectory-visual-container">
            <div className="baseline-indicator-line" style={{ bottom: `${(baselineVal / 10) * 100}%` }}>
              <span className="baseline-tag">Baseline ~{baselineVal.toFixed(1)}</span>
            </div>

            <div className="trajectory-bars-wrapper" aria-label="Wellbeing score progression chart">
              {pulses.map((pulse, idx) => {
                const heightPercent = Math.max(15, (pulse.wellbeing_level / 10) * 100)
                const isRecent = idx >= pulses.length - 2
                const matchingContext = contextEvents.find((evt) => evt.date === pulse.date)

                return (
                  <div key={pulse.pulse_id} className="timeline-col">
                    {matchingContext && (
                      <div className="milestone-pin-top" title={matchingContext.event_description}>
                        <span className="pin-icon">🚩</span>
                        <span className="pin-text">{matchingContext.event_description}</span>
                      </div>
                    )}

                    <div className="bar-track">
                      <div
                        className={`bar-fill ${isRecent ? 'recent-fill' : 'baseline-fill'}`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        <span className="bar-score-bubble">{pulse.wellbeing_level}</span>
                      </div>
                    </div>

                    <div className="timeline-date-label">
                      <strong>{pulse.date.replace('2026-', 'W')}</strong>
                      <span className="window-sublabel">
                        {isRecent ? 'Recent' : 'Baseline'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. "Why Now?" Elevated Feature & Contextual Framing */}
      <div className="card-grid two-up">
        {/* Why Now Feature Card */}
        <section className="card why-now-card">
          <div className="card-header borderless">
            <div className="why-now-header">
              <span className="why-now-badge">✨ PULSE Key Signal</span>
              <h3>Why is this showing up now?</h3>
            </div>
          </div>

          <p className="why-now-body">
            {warning?.why_now ??
              'The current pattern is not yet sustained enough to warrant concern.'}
          </p>

          <div className="converging-signals-block">
            <span className="sub-label">Contributing Signals in This Pattern:</span>
            <div className="tag-list">
              {warning?.contributing_signals && warning.contributing_signals.length > 0 ? (
                warning.contributing_signals.map((sig) => (
                  <span key={sig} className="signal-pill">
                    {humanizeSignal(sig)}
                  </span>
                ))
              ) : (
                <span className="tag muted">No stress signals flagged</span>
              )}
            </div>
          </div>
        </section>

        {/* Academic Calendar Context Card */}
        <section className="card context-card">
          <div className="card-header borderless">
            <div>
              <span className="section-step-indicator">Surrounding Circumstances</span>
              <h3>Academic Calendar Context</h3>
            </div>
          </div>

          <p className="support-copy">
            {warning?.context_explanation ??
              `Your recent pattern coincides with the ${humanizeContext(warning?.context)}.`}
          </p>

          <div className="context-events-list">
            {contextEvents.map((event) => (
              <div key={event.event_id} className="context-event-row">
                <span className="event-date-badge">{event.date}</span>
                <div className="event-info">
                  <strong>{event.event_description}</strong>
                  <span className="event-phase">
                    {humanizeContext(event.event_type)} · Phase: {event.semester_phase}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Detailed Observations Timeline: Baseline vs Recent */}
      <section className="card observations-container-card">
        <div className="card-header borderless">
          <div>
            <span className="section-step-indicator">Check-in Log</span>
            <h3>Detailed Observations Breakdown</h3>
          </div>
          <span className="obs-count-badge">{pulses.length} total entries</span>
        </div>

        {!hasPulses ? (
          <div className="empty-state">No check-in entries to display yet.</div>
        ) : (
          <div className="observations-split-grid">
            <div className="obs-column baseline-col">
              <div className="obs-col-header">
                <h4>Earlier Baseline Window</h4>
                <span className="obs-col-sub">Initial reference pattern</span>
              </div>
              {previousObservations.length === 0 ? (
                <p className="empty-column-note">Initial observations form your baseline.</p>
              ) : (
                <div className="obs-card-stack">
                  {previousObservations.map((pulse) => (
                    <div key={pulse.pulse_id} className="obs-entry-card">
                      <div className="obs-entry-header">
                        <strong>Week {pulse.date}</strong>
                        <span className="entry-score-tag">{pulse.wellbeing_level} / 10</span>
                      </div>
                      <p className="entry-note">
                        {pulse.optional_note || 'No note attached'}
                      </p>
                      {pulse.concerns.length > 0 ? (
                        <div className="entry-concerns-row">
                          {pulse.concerns.map((c) => (
                            <span key={c} className="tiny-chip">
                              {humanizeSignal(c)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="obs-column recent-col">
              <div className="obs-col-header">
                <h4>Recent Observation Window</h4>
                <span className="obs-col-sub">Current pattern being evaluated</span>
              </div>
              <div className="obs-card-stack">
                {recentObservations.map((pulse) => (
                  <div key={pulse.pulse_id} className="obs-entry-card recent-entry">
                    <div className="obs-entry-header">
                      <strong>Week {pulse.date}</strong>
                      <span className="entry-score-tag highlight">{pulse.wellbeing_level} / 10</span>
                    </div>
                    <p className="entry-note">
                      {pulse.optional_note || 'No note attached'}
                    </p>
                    {pulse.concerns.length > 0 ? (
                      <div className="entry-concerns-row">
                        {pulse.concerns.map((c) => (
                          <span key={c} className="tiny-chip">
                            {humanizeSignal(c)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. Clear Bridge to My Support */}
      <section className="card screen-step-banner">
        <div className="step-banner-content">
          <span className="step-banner-tag">Next Step</span>
          <h3>What can I choose to do next?</h3>
          <p className="support-copy">
            Now that you understand what has shifted, you can explore voluntary support choices.
            Everything is private and student-controlled.
          </p>
        </div>
        <button
          type="button"
          className="action-button primary-cta"
          onClick={() => onNavigate('support')}
        >
          Explore Support Choices →
        </button>
      </section>
    </div>
  )
}

function MySupportScreen({
  warning,
  supportOptions,
  onNavigate,
}: {
  warning: EarlyWarning | null
  trajectory: Trajectory | null
  supportOptions: SupportOption[]
  onNavigate: (screen: AppScreen) => void
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [acknowledgedOptions, setAcknowledgedOptions] = useState<Record<string, boolean>>({})

  const handleSelectOption = (optionId: string) => {
    setSelectedOptionId((current) => (current === optionId ? null : optionId))
  }

  const handleAcknowledge = (optionId: string) => {
    setAcknowledgedOptions((prev) => ({
      ...prev,
      [optionId]: true,
    }))
  }

  const handleDismiss = (optionId: string) => {
    setAcknowledgedOptions((prev) => ({
      ...prev,
      [optionId]: false,
    }))
    if (selectedOptionId === optionId) {
      setSelectedOptionId(null)
    }
  }

  return (
    <div className="content-stack support-experience">
      {/* 1. Context Summary & Agency Reassurance */}
      <section className="card support-hero-card">
        <div className="support-hero-top">
          <span className="support-badge-pill">Voluntary Support Hub</span>
          <span className="autonomy-pill">100% Student Controlled</span>
        </div>

        <h2 className="support-hero-title">Support choices tailored to your pattern</h2>

        <p className="support-hero-lead">
          {warning
            ? `Your recent check-ins show a sustained shift during the ${humanizeContext(
                warning.context,
              ).toLowerCase()}. Because this change has persisted across several weeks, these voluntary options are here if you'd like support navigating the workload.`
            : 'Your wellbeing pattern remains steady. Voluntary support resources are always here whenever you wish to explore them.'}
        </p>

        <div className="support-privacy-bar">
          <span className="privacy-icon">🛡️</span>
          <span>
            PULSE does not automatically book appointments, create tickets, or notify advisers.
            Any choice you make is entirely private and voluntary.
          </span>
        </div>
      </section>

      {/* 2. Distinct Support Choice Cards */}
      <section className="support-cards-grid">
        {supportOptions.length === 0 ? (
          <div className="card empty-state">No specific support options suggested right now.</div>
        ) : (
          supportOptions.map((option) => {
            const isSelected = selectedOptionId === option.option_id
            const isAcknowledged = acknowledgedOptions[option.option_id]

            const optionConfig: Record<
              string,
              { icon: string; tag: string; buttonText: string; themeClass: string }
            > = {
              'option-1': {
                icon: '🤝',
                tag: 'Human Connection · Voluntary',
                buttonText: 'View advising contacts',
                themeClass: 'theme-support',
              },
              'option-2': {
                icon: '📖',
                tag: 'Academic Workload · Self-Service',
                buttonText: 'View academic tools',
                themeClass: 'theme-academic',
              },
              'option-3': {
                icon: '🌿',
                tag: 'Self-Guided · Private',
                buttonText: 'Browse self-help guides',
                themeClass: 'theme-resource',
              },
              'option-4': {
                icon: '☕',
                tag: 'Your Autonomy · No Pressure',
                buttonText: 'Choose to revisit later',
                themeClass: 'theme-defer',
              },
              'option-5': {
                icon: '🌿',
                tag: 'Self-Guided · Private',
                buttonText: 'Browse resources',
                themeClass: 'theme-resource',
              },
              'option-6': {
                icon: '🤝',
                tag: 'Human Connection · Voluntary',
                buttonText: 'View contact options',
                themeClass: 'theme-support',
              },
              'option-7': {
                icon: '☕',
                tag: 'Your Choice · No Pressure',
                buttonText: 'Decline for now',
                themeClass: 'theme-defer',
              },
              'option-8': {
                icon: '☕',
                tag: 'Your Choice · No Pressure',
                buttonText: 'Keep monitoring quietly',
                themeClass: 'theme-defer',
              },
            }

            const cfg = optionConfig[option.option_id] ?? {
              icon: '💡',
              tag: 'Voluntary Choice',
              buttonText: 'Explore option',
              themeClass: 'theme-resource',
            }

            return (
              <div
                key={option.option_id}
                className={`card support-card-item ${cfg.themeClass} ${
                  isSelected ? 'expanded' : ''
                }`}
              >
                <div className="support-card-main">
                  <div className="support-card-header">
                    <div className="support-icon-badge">{cfg.icon}</div>
                    <div className="support-header-text">
                      <span className="card-category-tag">{cfg.tag}</span>
                      <h3 className="card-option-label">{option.label}</h3>
                    </div>
                  </div>

                  <p className="card-option-desc">{option.description}</p>

                  <div className="card-actions-strip">
                    <button
                      type="button"
                      className={`support-action-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectOption(option.option_id)}
                    >
                      {isSelected ? 'Hide details' : cfg.buttonText}
                    </button>
                    {isAcknowledged ? (
                      <span className="choice-recorded-badge">✓ Choice recorded</span>
                    ) : null}
                  </div>
                </div>

                {isSelected && (
                  <div className="support-expanded-panel">
                    {option.type === 'support' && (
                      <div className="panel-inner-content">
                        <h4>Advising &amp; Wellbeing Contacts</h4>
                        <p className="panel-lead">
                          Confidential support contacts are available whenever you wish to speak with someone:
                        </p>
                        <div className="contact-cards-stack">
                          <div className="contact-item-card">
                            <strong>Faculty of Engineering Wellbeing Adviser</strong>
                            <p>
                              Drop-in or email via{' '}
                              <code className="email-code">wellbeing-support@university.edu</code>
                            </p>
                          </div>
                          <div className="contact-item-card">
                            <strong>Student Peer Support Desk</strong>
                            <p>Room 104, Student Commons · Drop-in Mon–Fri 9am–4pm</p>
                          </div>
                        </div>
                        <p className="subtle-reassurance-text">
                          Note: Reaching out is completely your choice. PULSE does not automatically
                          notify anyone or book an appointment.
                        </p>
                      </div>
                    )}

                    {option.type === 'academic' && (
                      <div className="panel-inner-content">
                        <h4>Academic Guidance &amp; Extensions</h4>
                        <p className="panel-lead">
                          Self-service academic support resources to help manage peak workload:
                        </p>
                        <div className="contact-cards-stack">
                          <div className="contact-item-card">
                            <strong>Coursework Extension Guidelines</strong>
                            <p>
                              Self-service criteria and instructions for short-term assignment adjustments.
                            </p>
                          </div>
                          <div className="contact-item-card">
                            <strong>Study Planning Templates</strong>
                            <p>Self-paced milestone schedules and weekly time-blocking worksheets.</p>
                          </div>
                        </div>
                        <p className="subtle-reassurance-text">
                          Note: Extension requests remain voluntary and can be submitted via the student
                          portal when you choose.
                        </p>
                      </div>
                    )}

                    {option.type === 'resource' && (
                      <div className="panel-inner-content">
                        <h4>Self-Guided Wellbeing &amp; Study Resources</h4>
                        <p className="panel-lead">Available on-demand self-care guides:</p>
                        <div className="contact-cards-stack">
                          <div className="contact-item-card">
                            <strong>Assessment Period Navigation Guide</strong>
                            <p>Managing multi-deadline weeks and pacing coursework.</p>
                          </div>
                          <div className="contact-item-card">
                            <strong>Sleep Hygiene &amp; Focus Guide</strong>
                            <p>Practical steps for restorative sleep during heavy project periods.</p>
                          </div>
                          <div className="contact-item-card">
                            <strong>Campus Mindfulness &amp; Relaxation Audios</strong>
                            <p>5-minute guided relaxation and focus recordings.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {option.type === 'defer' && (
                      <div className="panel-inner-content defer-content">
                        <h4>That's completely okay.</h4>
                        <p className="panel-lead">
                          You know your schedule and needs best. PULSE respects your autonomy and will
                          continue your regular, unobtrusive check-ins. No notifications, alerts, or
                          follow-ups will be sent.
                        </p>
                      </div>
                    )}

                    <div className="panel-bottom-controls">
                      {!isAcknowledged ? (
                        <button
                          type="button"
                          className="action-button primary-action"
                          onClick={() => handleAcknowledge(option.option_id)}
                        >
                          {option.type === 'defer' ? 'Confirm choice' : 'Acknowledge this choice'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="action-button reset-action"
                          onClick={() => handleDismiss(option.option_id)}
                        >
                          Reset choice
                        </button>
                      )}
                      <button
                        type="button"
                        className="action-button secondary-action"
                        onClick={() => setSelectedOptionId(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>

      {/* 3. Return Navigation */}
      <section className="card support-footer-nav">
        <div>
          <span className="section-step-indicator">Student Navigation</span>
          <p className="support-copy">
            Done exploring support options? You can return to your longitudinal timeline or record
            a new check-in anytime.
          </p>
        </div>
        <div className="footer-nav-buttons">
          <button
            type="button"
            className="action-button secondary-action"
            onClick={() => onNavigate('journey')}
          >
            ← Back to My Journey
          </button>
          <button
            type="button"
            className="action-button secondary-action"
            onClick={() => onNavigate('pulse')}
          >
            Record New Pulse →
          </button>
        </div>
      </section>
    </div>
  )
}

function humanizeCohortStatus(status?: string): { label: string; badgeClass: string; desc: string } {
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

function UniversityDashboard({
  activeScreen,
  onNavigate,
}: {
  activeScreen: AppScreen
  onNavigate: (screen: AppScreen) => void
}) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [trends, setTrends] = useState<DashboardTrends | null>(null)
  const [cohorts, setCohorts] = useState<DashboardCohort[]>([])
  const [context, setContext] = useState<DashboardContextEvent[]>([])
  const [recommendations, setRecommendations] = useState<DashboardRecommendation[]>([])
  const [selectedCohortName, setSelectedCohortName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [overviewData, trendsData, cohortsData, contextData, recommendationsData] =
          await Promise.all([
            fetchJson<DashboardOverview>(`${API_BASE_URL}/api/dashboard/overview`),
            fetchJson<DashboardTrends>(`${API_BASE_URL}/api/dashboard/trends`),
            fetchJson<DashboardCohort[]>(`${API_BASE_URL}/api/dashboard/cohorts`),
            fetchJson<DashboardContextEvent[]>(`${API_BASE_URL}/api/dashboard/context`),
            fetchJson<DashboardRecommendation[]>(`${API_BASE_URL}/api/dashboard/recommendations`),
          ])

        setOverview(overviewData)
        setTrends(trendsData)
        setCohorts(cohortsData)
        setContext(contextData)
        setRecommendations(recommendationsData)
      } catch (loadError) {
        setError(formatError(loadError, 'Could not load university dashboard data'))
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const selectedCohort = useMemo(() => {
    if (!cohorts.length) return null
    const sorted = [...cohorts].sort((left, right) => right.prevalence - left.prevalence)
    const highlighted = sorted.find((cohort) => cohort.status !== 'STABLE') ?? sorted[0]
    return cohorts.find((cohort) => cohort.cohort_name === selectedCohortName) ?? highlighted
  }, [cohorts, selectedCohortName])

  // Compute aggregate concerns landscape across all cohorts
  const aggregateConcerns = useMemo(() => {
    const counts: Record<string, number> = {}
    cohorts.forEach((cohort) => {
      cohort.concerns.forEach((concern) => {
        counts[concern] = (counts[concern] || 0) + 1
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [cohorts])

  const emergingCount = useMemo(() => {
    return cohorts.filter((c) => c.status === 'EMERGING' || c.status === 'WATCH').length
  }, [cohorts])

  const stableCount = useMemo(() => {
    return cohorts.filter((c) => c.status === 'STABLE').length
  }, [cohorts])

  return (
    <div className="university-shell">
      {/* Institutional Top Header */}
      <header className="university-header">
        <div className="header-brand-block">
          <div className="institutional-eyebrow-row">
            <span className="inst-badge">🏛️ PULSE Institutional Space</span>
            <span className="privacy-pill">🔒 Strict Cohort Aggregates · Zero Individual Profiling</span>
          </div>
          <h1 className="inst-title">University Intelligence</h1>
          <p className="inst-subtitle">
            Population-level wellbeing signals, contextual calendar dynamics, and systemic institutional insights.
          </p>
        </div>

        <nav className="header-nav" aria-label="Experiences navigation">
          <button
            type="button"
            className="nav-chip"
            onClick={() => onNavigate('pulse')}
          >
            📝 My Pulse
          </button>
          <button
            type="button"
            className="nav-chip"
            onClick={() => onNavigate('journey')}
          >
            📈 My Journey
          </button>
          <button
            type="button"
            className="nav-chip"
            onClick={() => onNavigate('support')}
          >
            🛡️ My Support
          </button>
          <button
            type="button"
            className={`nav-chip ${activeScreen === 'university' ? 'active' : ''}`}
            onClick={() => onNavigate('university')}
          >
            🏛️ University Intelligence
          </button>
        </nav>
      </header>

      {error ? <div className="status-banner error">{error}</div> : null}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Analyzing population cohort signals and academic context…</p>
        </div>
      ) : (
        <div className="inst-content-stack">
          {/* Executive Posture & Overview Strip */}
          <section className="inst-card exec-overview-card">
            <div className="exec-metrics-grid">
              <div className="exec-metric-tile">
                <span className="metric-label">Tracked Cohorts</span>
                <strong className="metric-value">{overview?.cohort_count ?? 0}</strong>
                <span className="metric-sub">Active academic groups</span>
              </div>
              <div className="exec-metric-tile">
                <span className="metric-label">Monitored Population</span>
                <strong className="metric-value">{overview?.total_students ?? 0}</strong>
                <span className="metric-sub">Enrolled students in scope</span>
              </div>
              <div className="exec-metric-tile">
                <span className="metric-label">Analyzed Check-ins</span>
                <strong className="metric-value">{overview?.total_pulses ?? 0}</strong>
                <span className="metric-sub">Total aggregate pulses</span>
              </div>
              <div className="exec-metric-tile highlight-tile">
                <span className="metric-label">Signal Posture</span>
                <strong className="metric-value">
                  {emergingCount > 0 ? `${emergingCount} Shift Detected` : 'All Stable'}
                </strong>
                <span className="metric-sub">
                  {emergingCount > 0 ? `${stableCount} cohort(s) steady` : 'Broad baseline consistency'}
                </span>
              </div>
            </div>

            <div className="intelligence-principles-bar">
              <div className="principle-item">
                <span className="principle-icon">✨</span>
                <div>
                  <strong>Explainable Multi-Signal Intelligence</strong>
                  <p>Transparent pattern detection with contextual reasoning rather than opaque predictive scores.</p>
                </div>
              </div>
              <div className="principle-item">
                <span className="principle-icon">🛡️</span>
                <div>
                  <strong>Institutional Privacy Guarantee</strong>
                  <p>Aggregated cohort metrics only. Zero individual ranking, risk scores, or intervention queues.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 1. WHAT IS CHANGING? (Aggregate Signal Dynamics) */}
          <section className="inst-card">
            <div className="section-head">
              <div className="section-number-pill">1</div>
              <div>
                <span className="section-category-label">Aggregate Signal Dynamics</span>
                <h2 className="section-main-heading">What is changing across the student body?</h2>
              </div>
            </div>

            <div className="two-column-split">
              <div className="split-panel">
                <span className="panel-subheading">Population Trajectory Summary</span>
                <div className="highlight-box">
                  <p className="highlight-lead">
                    {trends?.trend_summary ?? 'Cohort signals are being tracked for early warnings.'}
                  </p>
                  <p className="panel-explanation">
                    Across all monitored groups, check-in data is analyzed for meaningful multi-week shifts from baseline.
                    Currently, {emergingCount} of {cohorts.length} cohort(s) exhibit early stress signals coinciding with peak academic calendar deadlines.
                  </p>
                </div>

                <div className="cohort-prevalence-summary">
                  <div className="summary-stat-box">
                    <span className="stat-caption">Average Shift Prevalence</span>
                    <strong className="stat-number">
                      {cohorts.length > 0
                        ? (cohorts.reduce((acc, c) => acc + c.prevalence, 0) / cohorts.length).toFixed(1)
                        : 0}%
                    </strong>
                    <span className="stat-footnote">Check-ins below baseline threshold</span>
                  </div>
                  <div className="summary-stat-box">
                    <span className="stat-caption">Primary Stress Domain</span>
                    <strong className="stat-number">Academic Load</strong>
                    <span className="stat-footnote">Leading recurring category</span>
                  </div>
                </div>
              </div>

              <div className="split-panel">
                <span className="panel-subheading">Recurring Concern Landscape (Across Cohorts)</span>
                {aggregateConcerns.length > 0 ? (
                  <div className="concern-meters-stack">
                    {aggregateConcerns.map(([concern, count]) => {
                      const pct = Math.round((count / Math.max(cohorts.length, 1)) * 100)
                      return (
                        <div key={concern} className="concern-meter-item">
                          <div className="concern-meter-header">
                            <span className="concern-name">{humanizeSignal(concern)}</span>
                            <span className="concern-count">{count} of {cohorts.length} cohorts ({pct}%)</span>
                          </div>
                          <div className="meter-track">
                            <div
                              className="meter-fill"
                              style={{ width: `${Math.max(15, pct)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty-panel-text">No specific recurring concerns recorded in this period.</p>
                )}
              </div>
            </div>
          </section>

          {/* 2. WHERE IS IT CHANGING? (Cohort Comparison & Status Matrix) */}
          <section className="inst-card">
            <div className="section-head">
              <div className="section-number-pill">2</div>
              <div>
                <span className="section-category-label">Cohort Comparison</span>
                <h2 className="section-main-heading">Where is it changing?</h2>
              </div>
              <span className="header-meta-tag">{cohorts.length} Academic Cohorts Monitored</span>
            </div>

            <p className="section-intro">
              Compare aggregate pattern dynamics across cohorts. Select any cohort card to inspect its deep-dive contextual evidence and why-now reasoning below.
            </p>

            <div className="cohort-cards-grid">
              {cohorts.map((cohort) => {
                const statusMeta = humanizeCohortStatus(cohort.status)
                const isSelected = selectedCohort?.cohort_name === cohort.cohort_name

                return (
                  <div
                    key={cohort.cohort_name}
                    className={`cohort-card ${statusMeta.badgeClass} ${isSelected ? 'active-selection' : ''}`}
                    onClick={() => setSelectedCohortName(cohort.cohort_name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedCohortName(cohort.cohort_name)
                      }
                    }}
                  >
                    <div className="cohort-card-top">
                      <div>
                        <h3 className="cohort-name">{cohort.cohort_name}</h3>
                        <span className="cohort-size">{cohort.sample_size} active students in sample</span>
                      </div>
                      <span className={`status-pill ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="cohort-status-desc">{statusMeta.desc}</p>

                    <div className="cohort-metrics-row">
                      <div className="cohort-metric">
                        <span className="label">Shift Prevalence</span>
                        <strong className="value">{cohort.prevalence.toFixed(1)}%</strong>
                      </div>
                      <div className="cohort-metric">
                        <span className="label">Baseline Deviation</span>
                        <strong className="value">
                          {cohort.deviation !== undefined && cohort.deviation !== 0
                            ? `${cohort.deviation > 0 ? '+' : ''}${cohort.deviation.toFixed(1)} pts`
                            : '0.0 pts'}
                        </strong>
                      </div>
                      <div className="cohort-metric">
                        <span className="label">Trend Direction</span>
                        <strong className="value">{humanizeDirection(cohort.wellbeing_trend)}</strong>
                      </div>
                    </div>

                    <div className="prevalence-progress-bar">
                      <div
                        className="prevalence-fill"
                        style={{ width: `${Math.min(100, Math.max(10, cohort.prevalence))}%` }}
                      />
                    </div>

                    {cohort.concerns.length > 0 && (
                      <div className="cohort-tags-wrap">
                        <span className="tags-label">Key Concerns:</span>
                        <div className="tags-list">
                          {cohort.concerns.map((c) => (
                            <span key={c} className="cohort-tag">
                              {humanizeSignal(c)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="cohort-card-action">
                      <span className="select-prompt">
                        {isSelected ? '✓ Currently inspecting signals' : 'Click to inspect signals →'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 3. WHY MIGHT IT BE HAPPENING? (Contextual Explanatory Layer) */}
          <section className="inst-card">
            <div className="section-head">
              <div className="section-number-pill">3</div>
              <div>
                <span className="section-category-label">Contextual Layer</span>
                <h2 className="section-main-heading">Why might it be happening?</h2>
              </div>
              <span className="header-meta-tag">Academic Calendar Dynamics</span>
            </div>

            <p className="section-intro">
              PULSE contextualizes wellbeing shifts with active institutional milestones. We interpret signals in context without asserting single-variable causality.
            </p>

            <div className="context-events-grid">
              {context.length > 0 ? (
                context.map((event) => (
                  <div key={event.event_id} className="context-event-card">
                    <div className="event-card-top">
                      <span className="event-date-pill">{event.date}</span>
                      <span className="event-phase-tag">{humanizeContext(event.event_type)}</span>
                      {event.major_deadline_flag ? (
                        <span className="event-deadline-tag">🚩 Major Deadline</span>
                      ) : null}
                    </div>
                    <h3 className="event-title">{event.event_description}</h3>
                    <p className="event-sub">Semester Phase: {event.semester_phase}</p>
                  </div>
                ))
              ) : (
                <p className="empty-panel-text">No academic calendar events recorded for this period.</p>
              )}
            </div>

            <div className="context-coincidence-banner">
              <span className="banner-icon">💡</span>
              <div className="banner-body">
                <strong>Contextual Coincidence Principle</strong>
                <p>
                  Observed wellbeing dips in engineering cohorts coincide with midterm assessment schedules.
                  These calendar events provide vital explanatory context, ensuring leadership understands the surrounding environment rather than assuming isolated distress.
                </p>
              </div>
            </div>
          </section>

          {/* 4. WHY NOW? (Explainable Reasoning & Signal Convergence) */}
          {selectedCohort && (
            <section className="inst-card why-now-focus-card">
              <div className="section-head">
                <div className="section-number-pill">4</div>
                <div>
                  <span className="section-category-label">Explainability &amp; Reasoning</span>
                  <h2 className="section-main-heading">Why is this pattern worth paying attention to now?</h2>
                </div>
                <div className="cohort-focus-badge">
                  <span>Inspecting:</span>
                  <strong>{selectedCohort.cohort_name}</strong>
                </div>
              </div>

              <div className="why-now-story-box">
                <div className="story-meta-tags">
                  <span className="meta-badge-inst">
                    Pattern: {humanizePatternType(selectedCohort.pattern_type)}
                  </span>
                  <span className="meta-badge-inst highlight">
                    Evidence Strength: {humanizeEvidence(selectedCohort.evidence_strength)}
                  </span>
                </div>

                <h3 className="why-now-headline">
                  {selectedCohort.why_now ?? 'Evaluating cohort trajectory against historical baseline.'}
                </h3>

                <p className="why-now-narrative">
                  {selectedCohort.explanation}
                </p>
              </div>

              <div className="three-pillar-grid">
                <div className="pillar-card">
                  <span className="pillar-label">Signal Convergence</span>
                  <p className="pillar-copy">
                    {selectedCohort.concerns.length > 1
                      ? `Multiple distinct stress signals (${selectedCohort.concerns.map(humanizeSignal).join(', ')}) are converging simultaneously, indicating a broader workload friction rather than an isolated outlier.`
                      : selectedCohort.concerns.length === 1
                      ? `Signal centered predominantly on ${humanizeSignal(selectedCohort.concerns[0])}.`
                      : 'No multi-signal convergence detected in this cohort.'}
                  </p>
                </div>

                <div className="pillar-card">
                  <span className="pillar-label">Baseline Comparison</span>
                  <p className="pillar-copy">
                    {selectedCohort.baseline ?? 'Baseline established from earlier reporting cycles.'}
                  </p>
                  <div className="deviation-callout">
                    <span>Net Shift:</span>
                    <strong>
                      {selectedCohort.deviation !== undefined
                        ? `${selectedCohort.deviation > 0 ? '+' : ''}${selectedCohort.deviation.toFixed(1)} points`
                        : '0.0 points'}
                    </strong>
                  </div>
                </div>

                <div className="pillar-card">
                  <span className="pillar-label">Historical Comparison</span>
                  <p className="pillar-copy">
                    {selectedCohort.historical_comparison ??
                      'Comparing against previous academic terms for similar cohort phases.'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 5. WHAT COULD THE UNIVERSITY CONSIDER? (Systemic Recommendations) */}
          <section className="inst-card recommendations-card">
            <div className="section-head">
              <div className="section-number-pill">5</div>
              <div>
                <span className="section-category-label">Systemic Considerations</span>
                <h2 className="section-main-heading">What could the institution consider?</h2>
              </div>
              <span className="header-meta-tag">Human Judgment &amp; Systemic Options</span>
            </div>

            <p className="section-intro">
              Institutional recommendations are systemic options for departmental leadership and faculty consideration.
              They are designed for structural adjustments (e.g. deadline spacing, office hour availability), never automated individual student intervention.
            </p>

            <div className="recommendations-stack">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => {
                  const matchingCohort = cohorts.find((c) => c.cohort_name === rec.cohort)
                  const isEmerging = matchingCohort?.status === 'EMERGING'

                  return (
                    <article
                      key={`${rec.cohort}-${rec.recommendation}`}
                      className={`recommendation-box ${isEmerging ? 'priority-rec' : ''}`}
                    >
                      <div className="rec-header">
                        <span className="rec-cohort-pill">{rec.cohort}</span>
                        <span className="rec-type-tag">
                          {isEmerging ? '⚡ Active Consideration' : '📌 Baseline Governance'}
                        </span>
                      </div>

                      <div className="rec-body-grid">
                        <div className="rec-col">
                          <span className="rec-subhead">Observation</span>
                          <p className="rec-text">
                            {matchingCohort
                              ? `${matchingCohort.wellbeing_trend === 'declining' ? 'Downward shift' : 'Stable pattern'} observed (${matchingCohort.prevalence.toFixed(1)}% prevalence), coinciding with ${humanizeContext(matchingCohort.context).toLowerCase()}.`
                              : 'Cohort pattern tracking in progress.'}
                          </p>
                        </div>

                        <div className="rec-col highlight-col">
                          <span className="rec-subhead">Consideration</span>
                          <h3 className="rec-action-text">{rec.recommendation}</h3>
                        </div>

                        <div className="rec-col">
                          <span className="rec-subhead">Rationale</span>
                          <p className="rec-text">
                            {isEmerging
                              ? 'Proactively highlighting academic pacing and extension resources lowers friction during high-stress assessment weeks without singling out individual students.'
                              : 'Maintaining steady baseline monitoring ensures early signals are caught if coursework demands increase later in the term.'}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })
              ) : (
                <p className="empty-panel-text">No institutional recommendations currently active.</p>
              )}
            </div>

            <div className="governance-disclaimer-box">
              <span className="gov-icon">🏛️</span>
              <p>
                <strong>Human Judgment Standard:</strong> PULSE preserves human leadership and faculty discretion.
                No automated alerts, disciplinary tracking, or student casework are created by this intelligence engine.
              </p>
            </div>
          </section>

          {/* Institutional Data Governance Footer */}
          <footer className="inst-card governance-footer">
            <div className="gov-footer-content">
              <div>
                <span className="small-label">Data Governance &amp; Ethics</span>
                <p className="gov-footer-text">
                  PULSE University Intelligence operates exclusively on aggregated, de-identified cohort metrics.
                  All student participation remains voluntary, confidential, and student-controlled.
                </p>
              </div>
              <div className="gov-badges-row">
                <span className="gov-badge">FERPA / Privacy Aligned</span>
                <span className="gov-badge">Non-Diagnostic</span>
                <span className="gov-badge">Zero Individual Surveillance</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}

export { MyPulseScreen, MyJourneyScreen, MySupportScreen, UniversityDashboard }
