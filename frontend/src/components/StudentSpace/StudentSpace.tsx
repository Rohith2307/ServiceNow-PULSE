import { useEffect, useState } from 'react'
import type {
  DashboardContextEvent,
  EarlyWarning,
  Student,
  StudentScreen,
  SupportOption,
  Trajectory,
} from '../../types'
import { API_BASE_URL, fetchJson, formatError, humanizeStatus } from '../../utils/formatters'
import MyJourneyScreen from './MyJourneyScreen'
import MyPulseScreen from './MyPulseScreen'
import MySupportScreen from './MySupportScreen'

interface StudentSpaceProps {
  selectedStudentId: string
  activeScreen: StudentScreen
  onNavigateScreen: (screen: StudentScreen) => void
  onNavigateHome: () => void
  onSwitchStudent: () => void
}

export default function StudentSpace({
  selectedStudentId,
  activeScreen,
  onNavigateScreen,
  onNavigateHome,
  onSwitchStudent,
}: StudentSpaceProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null)
  const [warning, setWarning] = useState<EarlyWarning | null>(null)
  const [supportOptions, setSupportOptions] = useState<SupportOption[]>([])
  const [contextEvents, setContextEvents] = useState<DashboardContextEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStudentData = async (studentId: string) => {
    setLoading(true)
    setError('')

    try {
      const [studentData, trajectoryData, warningData, supportData, contextData] =
        await Promise.all([
          fetchJson<Student>(`${API_BASE_URL}/api/students/${studentId}`),
          fetchJson<Trajectory>(`${API_BASE_URL}/api/students/${studentId}/trajectory`),
          fetchJson<EarlyWarning>(`${API_BASE_URL}/api/students/${studentId}/early-warning`),
          fetchJson<SupportOption[]>(`${API_BASE_URL}/api/students/${studentId}/support-options`),
          fetchJson<DashboardContextEvent[]>(`${API_BASE_URL}/api/dashboard/context`).catch(() => []),
        ])

      setStudent(studentData)
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
    <div className="student-space-layout">
      {/* Top Student Navigation Bar — Zero Dropdowns */}
      <header className="student-navbar">
        <div className="student-navbar-inner">
          <div className="student-brand-area">
            <button
              type="button"
              className="student-brand-link"
              onClick={onNavigateHome}
              title="Return to PULSE Home"
            >
              <span className="brand-dot">●</span>
              <span className="brand-wordmark">PULSE</span>
            </button>
            <span className="student-space-tag">
              {student ? `${student.name}'s Space` : 'Student Space'}
            </span>
          </div>

          <nav className="student-nav-tabs" aria-label="Student primary navigation">
            <button
              type="button"
              className={`student-tab-btn ${activeScreen === 'pulse' ? 'active' : ''}`}
              onClick={() => onNavigateScreen('pulse')}
              aria-current={activeScreen === 'pulse' ? 'page' : undefined}
            >
              <span className="tab-icon">📝</span>
              <span className="tab-label">My Pulse</span>
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeScreen === 'journey' ? 'active' : ''}`}
              onClick={() => onNavigateScreen('journey')}
              aria-current={activeScreen === 'journey' ? 'page' : undefined}
            >
              <span className="tab-icon">📈</span>
              <span className="tab-label">My Journey</span>
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeScreen === 'support' ? 'active' : ''}`}
              onClick={() => onNavigateScreen('support')}
              aria-current={activeScreen === 'support' ? 'page' : undefined}
            >
              <span className="tab-icon">🛡️</span>
              <span className="tab-label">My Support</span>
            </button>
          </nav>

          <div className="student-navbar-right">
            {student && (
              <div className="student-static-identity" title={`Active student: ${student.name} (${student.student_id})`}>
                <span className="identity-avatar">
                  {student.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                <span className="identity-name">{student.name}</span>
              </div>
            )}
            <button
              type="button"
              className="student-switch-link"
              onClick={onSwitchStudent}
              title="Switch to another student profile"
            >
              Switch Profile
            </button>
            <span className="student-privacy-chip">
              🔒 Private
            </span>
          </div>
        </div>
      </header>

      {/* Main Student Space Content Container */}
      <main className="student-main-content">
        {error ? <div className="status-banner error">{error}</div> : null}

        {student && (
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
                {activeScreen === 'pulse' && `Hi ${student.name}, how are you feeling?`}
                {activeScreen === 'journey' && `${student.name}'s Wellbeing Journey`}
                {activeScreen === 'support' && `Support Options for ${student.name}`}
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
                student={student}
                trajectory={trajectory}
                warning={warning}
                onPulseSubmitted={() => loadStudentData(selectedStudentId)}
                onNavigate={onNavigateScreen}
              />
            )}

            {activeScreen === 'journey' && (
              <MyJourneyScreen
                warning={warning}
                trajectory={trajectory}
                contextEvents={contextEvents}
                onNavigate={onNavigateScreen}
              />
            )}

            {activeScreen === 'support' && (
              <MySupportScreen
                warning={warning}
                trajectory={trajectory}
                supportOptions={supportOptions}
                onNavigate={onNavigateScreen}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
