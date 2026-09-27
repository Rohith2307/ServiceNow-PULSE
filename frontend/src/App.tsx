import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Student = {
  student_id: string
  name: string
  cohort_group: string
  year_level: number
}

type Pulse = {
  pulse_id: string
  date: string
  wellbeing_level: number
  concerns: string[]
  optional_note: string
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
  why_detected: {
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const tabs = ['overview', 'checkin', 'trajectory', 'insights', 'support'] as const

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

function App() {
  const [route, setRoute] = useState<string>(() => window.location.pathname)

  useEffect(() => {
    const handleRouteChange = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  const navigate = (nextRoute: string) => {
    window.history.pushState({}, '', nextRoute)
    setRoute(window.location.pathname)
  }

  if (route.startsWith('/university')) {
    return <UniversityDashboard onNavigate={navigate} />
  }

  return <StudentExperience onNavigate={navigate} />
}

function StudentExperience({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('Aisha-202')
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]>('overview')
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null)
  const [warning, setWarning] = useState<EarlyWarning | null>(null)
  const [supportOptions, setSupportOptions] = useState<SupportOption[]>([])
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
        setError(loadError instanceof Error ? loadError.message : 'Unable to load students')
      }
    }

    void loadStudents()
  }, [selectedStudentId])

  useEffect(() => {
    if (!selectedStudentId) {
      return
    }

    const loadStudentData = async () => {
      setLoading(true)
      setError('')

      try {
        const [trajectoryData, warningData, supportData] = await Promise.all([
          fetchJson<Trajectory>(`${API_BASE_URL}/api/students/${selectedStudentId}/trajectory`),
          fetchJson<EarlyWarning>(`${API_BASE_URL}/api/students/${selectedStudentId}/early-warning`),
          fetchJson<SupportOption[]>(`${API_BASE_URL}/api/students/${selectedStudentId}/support-options`),
        ])

        setTrajectory(trajectoryData)
        setWarning(warningData)
        setSupportOptions(supportData)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load this student profile')
        setTrajectory(null)
        setWarning(null)
        setSupportOptions([])
      } finally {
        setLoading(false)
      }
    }

    void loadStudentData()
  }, [selectedStudentId])

  const latestPulse = trajectory?.pulses.at(-1) ?? null
  const averageWellbeing = trajectory?.pulses.length
    ? Math.round(
        trajectory.pulses.reduce((total, pulse) => total + pulse.wellbeing_level, 0) /
          trajectory.pulses.length,
      )
    : 0

  const statusLabel = warning ? warning.status.replace(/_/g, ' ') : 'Stable'
  const contextLabel = warning ? warning.context.replace(/_/g, ' ') : 'N/A'
  const evidenceLabel = warning?.evidence_strength ? warning.evidence_strength.replace(/_/g, ' ') : 'Limited'

  return (
    <div className="app-shell">
      <aside className="side-panel">
        <div className="brand-block">
          <span className="brand-badge">PULSE</span>
          <p>Student support</p>
        </div>

        <div className="route-toggle">
          <button type="button" className="route-button active" onClick={() => onNavigate('/')}>
            Student
          </button>
          <button type="button" className="route-button" onClick={() => onNavigate('/university')}>
            University
          </button>
        </div>

        <label className="field-label" htmlFor="student-select">
          Student
        </label>
        <select
          id="student-select"
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
        >
          {students.map((student) => (
            <option key={student.student_id} value={student.student_id}>
              {student.name}
            </option>
          ))}
        </select>

        <nav className="tab-nav" aria-label="Student sections">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={selectedTab === tab ? 'tab-button active' : 'tab-button'}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <span className="mini-label">Current status</span>
          <strong>{statusLabel}</strong>
          <small>{selectedStudent?.cohort_group ?? 'Loading cohort'}</small>
        </div>
      </aside>

      <main className="main-panel">
        {error ? <div className="status-banner error">{error}</div> : null}

        {selectedStudent && (
          <header className="hero-header">
            <div>
              <p className="eyebrow">How are things going?</p>
              <h1>{selectedStudent.name}</h1>
            </div>

            <div
              className={`status-pill ${warning ? `status-${warning.status.toLowerCase()}` : 'status-stable'}`}
            >
              {warning ? statusLabel : 'STABLE'}
            </div>
          </header>
        )}

        {loading && !trajectory ? (
          <div className="loading-state">Checking the latest pulse…</div>
        ) : null}

        {!loading && selectedTab === 'overview' && (
          <div className="content-stack">
            <section className="card highlight-card">
              <div className="card-header">
                <h2>Current check-in</h2>
                <span>{latestPulse?.date ?? 'No check-in'}</span>
              </div>
              <div className="wellbeing-row">
                <div className="wellbeing-value">{latestPulse?.wellbeing_level ?? 0}</div>
                <div>
                  <p className="label">Wellbeing</p>
                  <p className="value-copy">
                    {latestPulse?.optional_note ?? 'No update recorded yet.'}
                  </p>
                </div>
              </div>
              <div className="tag-list">
                {(latestPulse?.concerns ?? []).map((concern) => (
                  <span key={concern} className="tag">
                    {concern}
                  </span>
                ))}
              </div>
            </section>

            <section className="card-grid two-up">
              <div className="card">
                <h3>Wellbeing trend</h3>
                <div className="metric-row">
                  <strong>{averageWellbeing}</strong>
                  <span>average</span>
                </div>
                <p className="support-copy">
                  {warning
                    ? `Direction is ${warning.direction}, with ${warning.magnitude} change noted.`
                    : 'Current trend remains stable.'}
                </p>
              </div>

              <div className="card">
                <h3>Context</h3>
                <div className="metric-row">
                  <strong>{contextLabel}</strong>
                  <span>key frame</span>
                </div>
                <p className="support-copy">
                  {warning
                    ? `This pattern is being interpreted in the context of ${contextLabel}.`
                    : 'No unusual context has been flagged.'}
                </p>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <h3>What changed, why now, and what this means</h3>
                <span>{evidenceLabel} evidence</span>
              </div>

              <p className="support-copy">
                {warning
                  ? `The current pattern is ${warning.direction} and has ${warning.persistence ? 'been sustained' : 'not stayed consistent'} across recent check-ins.`
                  : 'No meaningful change is currently visible in the student pulse.'}
              </p>

              <div className="inline-summary">
                <span className="meta-badge">{warning?.pattern_type ?? 'STABLE'}</span>
                <span className="meta-badge secondary">{warning?.evidence_strength ?? 'LIMITED'}</span>
              </div>

              <div className="explain-grid">
                <div className="explain-box">
                  <p className="small-label">Why now</p>
                  <p className="support-copy">{warning?.why_now ?? 'This pattern remains comparatively stable at the moment.'}</p>
                </div>

                <div className="explain-box">
                  <p className="small-label">Context</p>
                  <p className="support-copy">
                    {warning?.context_explanation ?? `The student is currently being interpreted within the ${contextLabel} context.`}
                  </p>
                </div>
              </div>

              <p className="support-copy muted">
                {warning?.historical_comparison ?? 'There is no additional historical comparison available for this pattern yet.'}
              </p>

              <div className="tag-list signal-list">
                {(warning?.contributing_signals ?? []).map((signal) => (
                  <span key={signal} className="tag signal-tag">
                    {signal.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </section>
          </div>
        )}

        {!loading && selectedTab === 'checkin' && (
          <section className="card">
            <div className="card-header">
              <h2>Recent check-in</h2>
              <span>{latestPulse?.date ?? 'No data'}</span>
            </div>
            <div className="checkin-grid">
              <div>
                <p className="label">Wellbeing score</p>
                <div className="wellbeing-score">{latestPulse?.wellbeing_level ?? 0}</div>
              </div>
              <div>
                <p className="label">Student note</p>
                <p className="value-copy">{latestPulse?.optional_note ?? 'No notes available.'}</p>
              </div>
            </div>
            <div className="tag-list">
              {(latestPulse?.concerns ?? []).map((concern) => (
                <span key={concern} className="tag">
                  {concern}
                </span>
              ))}
            </div>
          </section>
        )}

        {!loading && selectedTab === 'trajectory' && (
          <section className="card">
            <div className="card-header">
              <h2>Wellbeing trajectory</h2>
              <span>{trajectory?.count ?? 0} check-ins</span>
            </div>
            <div className="chart" aria-label="Wellbeing trend chart">
              {(trajectory?.pulses ?? []).map((pulse) => (
                <div key={pulse.pulse_id} className="bar-group">
                  <div
                    className="bar"
                    style={{ height: `${Math.max(18, pulse.wellbeing_level * 18)}px` }}
                    title={`${pulse.date}: ${pulse.wellbeing_level}`}
                  >
                    <span>{pulse.wellbeing_level}</span>
                  </div>
                  <label>{pulse.date.replace('2026-', 'W')}</label>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && selectedTab === 'insights' && (
          <div className="content-stack">
            <section className="card">
              <h3>What changed</h3>
              <p className="support-copy">
                {warning
                  ? `The pattern is ${warning.direction} and is ${warning.persistence ? 'persistent' : 'not persistent'} across recent check-ins.`
                  : 'No change has been detected yet.'}
              </p>
              <div className="tag-list signal-list">
                {(warning?.why_detected.contributing_signals ?? []).map((signal) => (
                  <span key={signal} className="tag signal-tag">
                    {signal.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </section>

            <section className="card">
              <h3>Recommended next steps</h3>
              <ul className="bullet-list">
                {(warning?.recommended_actions ?? ['Continue monitoring and revisit later.']).map(
                  (item) => <li key={item}>{item}</li>,
                )}
              </ul>
            </section>
          </div>
        )}

        {!loading && selectedTab === 'support' && (
          <section className="card">
            <div className="card-header">
              <h2>Support options</h2>
              <span>{supportOptions.length} choices</span>
            </div>
            <div className="support-list">
              {supportOptions.map((option) => (
                <div key={option.option_id} className="support-item">
                  <div>
                    <p className="support-type">{option.type}</p>
                    <h3>{option.label}</h3>
                  </div>
                  <p>{option.description}</p>
                  <button type="button" className="action-button">
                    Choose this option
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function UniversityDashboard({ onNavigate }: { onNavigate: (route: string) => void }) {
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
        const [overviewData, trendsData, cohortsData, contextData, recommendationsData] = await Promise.all([
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
        setError(loadError instanceof Error ? loadError.message : 'Could not load dashboard data')
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

  useEffect(() => {
    if (!cohorts.length) {
      setSelectedCohortName(null)
      return
    }

    const preferred = [...cohorts].sort((left, right) => right.prevalence - left.prevalence).find((cohort) => cohort.status !== 'STABLE')
    setSelectedCohortName((current) => current ?? preferred?.cohort_name ?? cohorts[0].cohort_name)
  }, [cohorts])

  const patternSummary = selectedCohort
    ? `${selectedCohort.cohort_name} is showing an emerging pattern. ${selectedCohort.explanation}`
    : 'No emerging pattern is currently visible in the available cohort data.'
  const evidenceNarrative = selectedCohort
    ? `${selectedCohort.pattern_type ?? 'STABLE'} pattern with ${selectedCohort.evidence_strength ?? 'LIMITED'} evidence.`
    : 'No cohort-level evidence is available yet.'

  return (
    <div className="university-shell">
      <header className="university-header">
        <div>
          <p className="eyebrow">University intelligence</p>
          <h1>Early signal and context dashboard</h1>
        </div>

        <div className="route-toggle university-toggle">
          <button type="button" className="route-button" onClick={() => onNavigate('/')}>
            Student
          </button>
          <button type="button" className="route-button active" onClick={() => onNavigate('/university')}>
            University
          </button>
        </div>
      </header>

      {error ? <div className="status-banner error">{error}</div> : null}

      {loading ? (
        <div className="loading-state">Loading university signals…</div>
      ) : (
        <>
          <section className="overview-grid">
            <div className="info-card emphasis-card">
              <p className="small-label">What changed?</p>
              <h2>{selectedCohort ? selectedCohort.cohort_name : 'No cohort signal detected'}</h2>
              <p className="info-copy">
                {selectedCohort
                  ? `Wellbeing has shifted downward over the last reporting window. ${selectedCohort.prevalence.toFixed(1)}% of tracked pulse entries are below the lower threshold.`
                  : 'No cohort-level change is currently visible in the available data.'}
              </p>
              <div className="stats-row">
                <div>
                  <strong>{selectedCohort ? `${selectedCohort.prevalence.toFixed(1)}%` : '—'}</strong>
                  <span>prevalence</span>
                </div>
                <div>
                  <strong>{selectedCohort ? `${selectedCohort.sample_size}` : '0'}</strong>
                  <span>students</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <p className="small-label">Institution overview</p>
              <div className="kpi-list">
                <div>
                  <span>Total students</span>
                  <strong>{overview?.total_students ?? 0}</strong>
                </div>
                <div>
                  <span>Pulse entries</span>
                  <strong>{overview?.total_pulses ?? 0}</strong>
                </div>
                <div>
                  <span>Cohorts</span>
                  <strong>{overview?.cohort_count ?? 0}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Emerging patterns</h3>
                <span>{trends?.pulses ?? 0} pulse entries</span>
              </div>

              <div className="signal-list">
                {cohorts.map((cohort) => (
                  <button
                    key={cohort.cohort_name}
                    type="button"
                    className={selectedCohort?.cohort_name === cohort.cohort_name ? 'signal-row selected' : 'signal-row'}
                    onClick={() => setSelectedCohortName(cohort.cohort_name)}
                  >
                    <div className="signal-text">
                      <strong>{cohort.cohort_name}</strong>
                      <span>{cohort.status}</span>
                    </div>
                    <div className="signal-bar-wrap">
                      <div className="signal-bar" style={{ width: `${Math.min(cohort.prevalence, 100)}%` }} />
                    </div>
                    <small>
                      {cohort.prevalence.toFixed(1)}% · {cohort.sample_size} students
                    </small>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Trend summary</h3>
                <span>{trends?.trend_summary ?? 'No trend summary available'}</span>
              </div>
              <div className="mini-bar-stack">
                {cohorts.map((cohort) => (
                  <div key={cohort.cohort_name} className="mini-bar-row">
                    <span>{cohort.cohort_name}</span>
                    <div className="mini-bar-track">
                      <div className="mini-bar" style={{ width: `${Math.min(cohort.prevalence, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="insight-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Where is it happening?</h3>
                <span>cohort comparison</span>
              </div>
              <ul className="cohort-list">
                {cohorts.map((cohort) => (
                  <li key={cohort.cohort_name} className={cohort.status === 'EMERGING' ? 'cohort-row highlight' : 'cohort-row'}>
                    <span>{cohort.cohort_name}</span>
                    <strong>{cohort.status}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>What context is present?</h3>
                <span>current context events</span>
              </div>
              <div className="context-stack">
                {context.length ? (
                  context.map((event) => (
                    <div key={event.event_id} className="context-item">
                      <p className="context-type">{event.event_type.replace(/_/g, ' ')}</p>
                      <strong>{event.date}</strong>
                      <span>{event.event_description}</span>
                    </div>
                  ))
                ) : (
                  <p className="info-copy">No current context events are available.</p>
                )}
              </div>
            </div>
          </section>

          <section className="insight-grid wide-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Why might this be happening?</h3>
                <span>contextual interpretation</span>
              </div>
              <p className="info-copy">{patternSummary}</p>
              {selectedCohort ? (
                <div className="inline-summary">
                  <span className="meta-badge">{selectedCohort.pattern_type ?? 'STABLE'}</span>
                  <span className="meta-badge secondary">{selectedCohort.evidence_strength ?? 'LIMITED'}</span>
                </div>
              ) : null}

              <div className="answer-grid">
                <div className="answer-card">
                  <p className="small-label">Why now</p>
                  <p className="info-copy">{selectedCohort?.why_now ?? 'The current pattern is not yet strong enough to attribute a specific trigger.'}</p>
                </div>
                <div className="answer-card">
                  <p className="small-label">Context</p>
                  <p className="info-copy">{selectedCohort?.context_explanation ?? 'No direct context trigger is visible in the current data.'}</p>
                </div>
                <div className="answer-card">
                  <p className="small-label">Evidence</p>
                  <p className="info-copy">{selectedCohort?.historical_comparison ?? evidenceNarrative}</p>
                </div>
              </div>

              {selectedCohort ? (
                <div className="tag-list signal-list">
                  {selectedCohort.concerns.map((concern) => (
                    <span key={concern} className="tag signal-tag">
                      {concern}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Contributing signals</h3>
                <span>structured signal view</span>
              </div>
              {selectedCohort ? (
                <div className="signal-meter-list">
                  {selectedCohort.concerns.map((signal) => (
                    <div key={signal} className="signal-meter-row">
                      <span>{signal}</span>
                      <div className="signal-meter-track">
                        <div className="signal-meter-fill" style={{ width: `${Math.max(35, Math.min(100, Math.round((selectedCohort.prevalence + 20))))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="info-copy">No contributing signals available.</p>
              )}
            </div>
          </section>

          <section className="panel-card recommendation-card">
            <div className="panel-header">
              <h3>What could help?</h3>
              <span>institutional suggestions</span>
            </div>
            <div className="recommendation-list">
              {recommendations.length ? (
                recommendations.map((recommendation) => (
                  <article key={`${recommendation.cohort}-${recommendation.recommendation}`} className="recommendation-item">
                    <p className="recommendation-label">{recommendation.cohort}</p>
                    <h4>{recommendation.recommendation}</h4>
                    <p className="info-copy">
                      This suggestion is designed to support a contextual response, not to automate an intervention.
                    </p>
                  </article>
                ))
              ) : (
                <p className="info-copy">No recommendations are currently available.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default App
