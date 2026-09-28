import { useEffect, useMemo, useState } from 'react'
import type {
  DashboardCohort,
  DashboardContextEvent,
  DashboardOverview,
  DashboardRecommendation,
  DashboardTrends,
  Student,
} from '../../types'
import { API_BASE_URL, fetchJson, formatError } from '../../utils/formatters'
import CohortIntelligenceView from './CohortIntelligenceView'
import StudentTrajectoryView from './StudentTrajectoryView'

interface UniversitySpaceProps {
  onNavigateHome: () => void
}

export default function UniversitySpace({ onNavigateHome }: UniversitySpaceProps) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [trends, setTrends] = useState<DashboardTrends | null>(null)
  const [cohorts, setCohorts] = useState<DashboardCohort[]>([])
  const [context, setContext] = useState<DashboardContextEvent[]>([])
  const [recommendations, setRecommendations] = useState<DashboardRecommendation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboardAndStudents = async () => {
      setLoading(true)
      setError('')

      try {
        const [
          overviewData,
          trendsData,
          cohortsData,
          contextData,
          recommendationsData,
          studentsData,
        ] = await Promise.all([
          fetchJson<DashboardOverview>(`${API_BASE_URL}/api/dashboard/overview`),
          fetchJson<DashboardTrends>(`${API_BASE_URL}/api/dashboard/trends`),
          fetchJson<DashboardCohort[]>(`${API_BASE_URL}/api/dashboard/cohorts`),
          fetchJson<DashboardContextEvent[]>(`${API_BASE_URL}/api/dashboard/context`),
          fetchJson<DashboardRecommendation[]>(`${API_BASE_URL}/api/dashboard/recommendations`),
          fetchJson<Student[]>(`${API_BASE_URL}/api/students`).catch(() => []),
        ])

        setOverview(overviewData)
        setTrends(trendsData)
        setCohorts(cohortsData)
        setContext(contextData)
        setRecommendations(recommendationsData)
        setStudents(studentsData)
      } catch (loadError) {
        setError(formatError(loadError, 'Could not load university intelligence data'))
      } finally {
        setLoading(false)
      }
    }

    void loadDashboardAndStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase().trim()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.cohort_group.toLowerCase().includes(q),
    )
  }, [students, searchQuery])

  const selectedStudent = useMemo(
    () => (selectedStudentId ? students.find((s) => s.student_id === selectedStudentId) ?? null : null),
    [selectedStudentId, students],
  )

  return (
    <div className="university-app-layout">
      {/* Institutional Top Navbar */}
      <header className="university-topbar">
        <div className="university-topbar-inner">
          <div className="inst-brand-cluster">
            <button
              type="button"
              className="inst-brand-button"
              onClick={onNavigateHome}
              title="Return to PULSE Home"
            >
              <span className="brand-dot inst-dot">●</span>
              <span className="brand-wordmark">PULSE</span>
            </button>
            <span className="inst-divider-slash">/</span>
            <span className="inst-section-badge">University Intelligence</span>
          </div>

          <div className="inst-topbar-meta">
            <span className="privacy-pill">
              🔒 Aggregated Cohort Analytics · Zero Individual Surveillance
            </span>
            <button
              type="button"
              className="inst-home-link-btn"
              onClick={onNavigateHome}
            >
              Exit to Home
            </button>
          </div>
        </div>
      </header>

      <div className="university-main-split">
        {/* Student Selector Sidebar */}
        <aside className="university-sidebar" aria-label="Student selector sidebar">
          <div className="sidebar-section-header">
            <span className="sidebar-label">Navigation &amp; Directory</span>
          </div>

          {/* Cohort Intelligence Master Tab */}
          <button
            type="button"
            className={`cohort-nav-item ${selectedStudentId === null ? 'active' : ''}`}
            onClick={() => setSelectedStudentId(null)}
          >
            <span className="cohort-nav-icon">🏛️</span>
            <div className="cohort-nav-text">
              <span className="cohort-nav-title">Cohort Intelligence</span>
              <span className="cohort-nav-sub">Population &amp; cohort signals</span>
            </div>
          </button>

          <div className="sidebar-divider" />

          {/* Students Directory Search */}
          <div className="student-search-block">
            <div className="sidebar-heading-row">
              <span className="sidebar-label">Students ({students.length})</span>
            </div>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="student-search-input"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search students by name, ID, or cohort"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Students List */}
          <div className="students-list-scroll" role="listbox" aria-label="Student directory">
            {filteredStudents.length === 0 ? (
              <div className="empty-search-state">
                <span>No students match "{searchQuery}"</span>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = selectedStudentId === student.student_id
                const initials = student.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)

                return (
                  <button
                    key={student.student_id}
                    type="button"
                    className={`student-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedStudentId(student.student_id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="student-item-avatar">{initials}</div>
                    <div className="student-item-info">
                      <div className="student-item-name-row">
                        <span className="student-item-name">{student.name}</span>
                        {isSelected && <span className="student-selected-dot">●</span>}
                      </div>
                      <div className="student-item-meta">
                        <span className="student-item-id">{student.student_id}</span>
                        <span className="student-item-cohort">{student.cohort_group}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="sidebar-footer-note">
            <span className="footer-lock-icon">🔒</span>
            <span>Non-punitive longitudinal inspection</span>
          </div>
        </aside>

        {/* Main Workspace Content Area */}
        <main className="university-content-area">
          {error ? <div className="status-banner error">{error}</div> : null}

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Analyzing population cohort signals and academic context…</p>
            </div>
          ) : selectedStudent ? (
            <StudentTrajectoryView
              student={selectedStudent}
              contextEvents={context}
              onBackToCohort={() => setSelectedStudentId(null)}
            />
          ) : (
            <div className="university-shell-inner">
              <header className="university-header-inner">
                <div className="header-brand-block">
                  <div className="institutional-eyebrow-row">
                    <span className="inst-badge">🏛️ PULSE Institutional Space</span>
                    <span className="privacy-pill">
                      🔒 Strict Cohort Aggregates · Zero Individual Profiling
                    </span>
                  </div>
                  <h1 className="inst-title">University Intelligence</h1>
                  <p className="inst-subtitle">
                    Population-level wellbeing signals, contextual calendar dynamics, and systemic
                    institutional insights.
                  </p>
                </div>
              </header>

              <CohortIntelligenceView
                overview={overview}
                trends={trends}
                cohorts={cohorts}
                context={context}
                recommendations={recommendations}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
