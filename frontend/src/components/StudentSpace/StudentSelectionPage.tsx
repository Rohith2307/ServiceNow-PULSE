import { useEffect, useState } from 'react'
import type { Student } from '../../types'
import { API_BASE_URL, fetchJson, formatError } from '../../utils/formatters'

interface StudentSelectionPageProps {
  initialStudentId?: string | null
  onContinue: (studentId: string) => void
  onBackToHome: () => void
}

export default function StudentSelectionPage({
  initialStudentId,
  onContinue,
  onBackToHome,
}: StudentSelectionPageProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchJson<Student[]>(`${API_BASE_URL}/api/students`)
        setStudents(data)
        if (initialStudentId && data.some((s) => s.student_id === initialStudentId)) {
          setSelectedStudentId(initialStudentId)
        }
      } catch (err) {
        setError(formatError(err, 'Unable to load student directory. Please ensure the backend is running.'))
      } finally {
        setLoading(false)
      }
    }

    void loadStudents()
  }, [initialStudentId])

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId)

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStudentId) {
      onContinue(selectedStudentId)
    }
  }

  return (
    <main className="student-selection-container">
      <div className="student-selection-card">
        <header className="selection-brand-header">
          <div className="selection-badge-wrap">
            <span className="selection-dot">●</span>
            <span className="selection-badge">STUDENT SPACE ONBOARDING</span>
          </div>
          <h1 className="selection-brand-title">PULSE</h1>
          <h2 className="selection-heading">Welcome to PULSE</h2>
          <p className="selection-subtext">
            Select a student profile to continue to your personal space.
          </p>
        </header>

        {error ? <div className="status-banner error">{error}</div> : null}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading student profiles…</p>
          </div>
        ) : (
          <form onSubmit={handleContinue} className="selection-form">
            <div className="selection-field-group">
              <label htmlFor="student-profile-select" className="selection-label">
                Select your student profile
              </label>
              <div className="select-wrapper">
                <select
                  id="student-profile-select"
                  className="selection-dropdown"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  aria-label="Select student profile"
                  required
                >
                  <option value="" disabled>
                    Select student profile…
                  </option>
                  {students.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.name} ({student.student_id} · {student.cohort_group})
                    </option>
                  ))}
                </select>
                <span className="select-caret">▼</span>
              </div>
            </div>

            {selectedStudent && (
              <div className="selected-preview-box">
                <div className="preview-avatar">
                  {selectedStudent.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="preview-details">
                  <strong className="preview-name">{selectedStudent.name}</strong>
                  <span className="preview-meta">
                    {selectedStudent.student_id} · {selectedStudent.cohort_group}
                  </span>
                </div>
                <span className="preview-ready-tag">✓ Ready</span>
              </div>
            )}

            <button
              type="submit"
              className="selection-continue-btn"
              disabled={!selectedStudentId}
            >
              Continue to My Space →
            </button>
          </form>
        )}

        <footer className="selection-footer">
          <button
            type="button"
            className="selection-back-btn"
            onClick={onBackToHome}
          >
            ← Back to home
          </button>
          <div className="selection-privacy-note">
            <span>🔒 Confidential · Student-controlled wellbeing data</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
