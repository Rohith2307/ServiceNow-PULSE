import { useEffect, useState } from 'react'
import type { DashboardContextEvent, EarlyWarning, Student, Trajectory } from '../../types'
import {
  API_BASE_URL,
  fetchJson,
  formatError,
  humanizeContext,
  humanizeDeviation,
  humanizeDirection,
  humanizeEvidence,
  humanizePatternType,
  humanizeSignal,
  humanizeStatus,
} from '../../utils/formatters'

interface StudentTrajectoryViewProps {
  student: Student
  contextEvents: DashboardContextEvent[]
  onBackToCohort: () => void
}

export default function StudentTrajectoryView({
  student,
  contextEvents,
  onBackToCohort,
}: StudentTrajectoryViewProps) {
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null)
  const [warning, setWarning] = useState<EarlyWarning | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true)
      setError('')
      try {
        const [trajectoryData, warningData] = await Promise.all([
          fetchJson<Trajectory>(`${API_BASE_URL}/api/students/${student.student_id}/trajectory`),
          fetchJson<EarlyWarning>(`${API_BASE_URL}/api/students/${student.student_id}/early-warning`),
        ])
        setTrajectory(trajectoryData)
        setWarning(warningData)
      } catch (err) {
        setError(formatError(err, 'Failed to load longitudinal trajectory for this student.'))
      } finally {
        setLoading(false)
      }
    }

    void loadStudentData()
  }, [student.student_id])

  const pulses = trajectory?.pulses ?? []
  const hasPulses = pulses.length > 0
  const previousObservations = pulses.length > 2 ? pulses.slice(0, pulses.length - 2) : []
  const recentObservations = pulses.length > 2 ? pulses.slice(pulses.length - 2) : pulses

  const baselineSummary = warning?.baseline ?? 'Baseline calculated from observations.'
  const baselineMatch = baselineSummary.match(/baseline.*?(\d+\.?\d*)/i)
  const baselineVal = baselineMatch ? parseFloat(baselineMatch[1]) : 6.0

  return (
    <div className="inst-content-stack student-trajectory-inst-view">
      {/* Navigation Breadcrumb / Top Bar */}
      <div className="inst-subnav-bar">
        <button
          type="button"
          className="inst-back-btn"
          onClick={onBackToCohort}
        >
          ← Back to Cohort Intelligence
        </button>
        <div className="inst-view-badge">
          <span>Viewing Student Longitudinal Pattern:</span>
          <strong>{student.name} ({student.student_id})</strong>
        </div>
      </div>

      {error ? <div className="status-banner error">{error}</div> : null}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading longitudinal trajectory for {student.name}…</p>
        </div>
      ) : (
        <>
          {/* Student Profile & Overview Card */}
          <section className="inst-card">
            <div className="student-inst-hero-header">
              <div className="student-avatar-large">
                {student.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="student-inst-info">
                <div className="student-meta-tags">
                  <span className="inst-badge">{student.cohort_group}</span>
                  {student.program && <span className="privacy-pill">{student.program}</span>}
                  <span className="status-pill badge-stable">ID: {student.student_id}</span>
                </div>
                <h2 className="student-inst-name">{student.name}</h2>
                <p className="student-inst-lead">
                  Longitudinal pattern analysis across {pulses.length} recorded pulse check-in(s).
                </p>
              </div>

              <div className="student-inst-status-box">
                <span className="small-label">Observed Posture</span>
                <strong className="status-val">{humanizeStatus(warning?.status)}</strong>
                <span className="status-pattern-type">
                  {humanizePatternType(warning?.pattern_type)}
                </span>
              </div>
            </div>

            <div className="student-inst-metrics-grid">
              <div className="inst-metric-tile">
                <span className="metric-label">Pattern Direction</span>
                <strong className="metric-value">{humanizeDirection(warning?.direction)}</strong>
                <span className="metric-sub">Trajectory movement</span>
              </div>
              <div className="inst-metric-tile">
                <span className="metric-label">Persistence</span>
                <strong className="metric-value">
                  {warning?.persistence ? 'Sustained (3+ wks)' : 'Transitory'}
                </strong>
                <span className="metric-sub">Multi-week signal</span>
              </div>
              <div className="inst-metric-tile">
                <span className="metric-label">Baseline Deviation</span>
                <strong className="metric-value">
                  {warning?.deviation !== undefined && warning?.deviation !== null
                    ? `${warning.deviation > 0 ? '+' : ''}${warning.deviation.toFixed(1)} pts`
                    : '0.0 pts'}
                </strong>
                <span className="metric-sub">{humanizeDeviation(warning?.deviation)}</span>
              </div>
              <div className="inst-metric-tile highlight-tile">
                <span className="metric-label">Evidence Strength</span>
                <strong className="metric-value">
                  {humanizeEvidence(warning?.evidence_strength)}
                </strong>
                <span className="metric-sub">Confidence level</span>
              </div>
            </div>
          </section>

          {/* Longitudinal Trajectory Timeline */}
          <section className="inst-card">
            <div className="section-head">
              <div className="section-number-pill">1</div>
              <div>
                <span className="section-category-label">Longitudinal View</span>
                <h2 className="section-main-heading">Wellbeing Timeline &amp; Baseline Shift</h2>
              </div>
              <div className="trajectory-legend">
                <span className="legend-item">
                  <span className="legend-dot active" /> Pulse score
                </span>
                <span className="legend-item">
                  <span className="legend-line-sample" /> Baseline ({baselineVal.toFixed(1)})
                </span>
              </div>
            </div>

            {!hasPulses ? (
              <div className="empty-state">No check-in history available for this student.</div>
            ) : (
              <div className="trajectory-visual-container">
                <div
                  className="baseline-indicator-line"
                  style={{ bottom: `${(baselineVal / 10) * 100}%` }}
                >
                  <span className="baseline-tag">Baseline ~{baselineVal.toFixed(1)}</span>
                </div>

                <div className="trajectory-bars-wrapper" aria-label="Student wellbeing score trajectory">
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

          {/* Explainability & Context */}
          <div className="card-grid two-up">
            {/* Why Now Reasoning */}
            <section className="inst-card">
              <div className="section-head">
                <div className="section-number-pill">2</div>
                <div>
                  <span className="section-category-label">Explainable Pattern</span>
                  <h3 className="section-main-heading">Why is this pattern notable?</h3>
                </div>
              </div>

              <p className="why-now-body">
                {warning?.why_now ?? warning?.explanation ?? 'Evaluating pattern against baseline.'}
              </p>

              <div className="converging-signals-block">
                <span className="sub-label">Converging Signals:</span>
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

            {/* Academic Calendar Context */}
            <section className="inst-card">
              <div className="section-head">
                <div className="section-number-pill">3</div>
                <div>
                  <span className="section-category-label">Institutional Context</span>
                  <h3 className="section-main-heading">Academic Calendar Events</h3>
                </div>
              </div>

              <p className="support-copy">
                {warning?.context_explanation ??
                  `Pattern aligns with ${humanizeContext(warning?.context)}.`}
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

          {/* Detailed Observations Log */}
          <section className="inst-card">
            <div className="section-head">
              <div className="section-number-pill">4</div>
              <div>
                <span className="section-category-label">Observations Log</span>
                <h2 className="section-main-heading">Historical Check-in Breakdown</h2>
              </div>
              <span className="obs-count-badge">{pulses.length} check-ins</span>
            </div>

            <div className="observations-split-grid">
              <div className="obs-column baseline-col">
                <div className="obs-col-header">
                  <h4>Baseline Window</h4>
                  <span className="obs-col-sub">Initial reference pattern</span>
                </div>
                {previousObservations.length === 0 ? (
                  <p className="empty-column-note">Initial observations establish baseline.</p>
                ) : (
                  <div className="obs-card-stack">
                    {previousObservations.map((pulse) => (
                      <div key={pulse.pulse_id} className="obs-entry-card">
                        <div className="obs-entry-header">
                          <strong>Week {pulse.date}</strong>
                          <span className="entry-score-tag">{pulse.wellbeing_level} / 10</span>
                        </div>
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
                  <h4>Recent Window</h4>
                  <span className="obs-col-sub">Current evaluation window</span>
                </div>
                <div className="obs-card-stack">
                  {recentObservations.map((pulse) => (
                    <div key={pulse.pulse_id} className="obs-entry-card recent-entry">
                      <div className="obs-entry-header">
                        <strong>Week {pulse.date}</strong>
                        <span className="entry-score-tag highlight">
                          {pulse.wellbeing_level} / 10
                        </span>
                      </div>
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
          </section>

          {/* Institutional Ethics & Non-Surveillance Notice */}
          <div className="governance-disclaimer-box">
            <span className="gov-icon">🛡️</span>
            <p>
              <strong>Student Privacy Notice:</strong> Longitudinal inspection is provided to assist
              faculty and academic advising leadership in understanding trajectory context. PULSE does
              not generate automated disciplinary referrals, automated ticketing, or clinical risk scores.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
