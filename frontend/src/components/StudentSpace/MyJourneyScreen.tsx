import type { DashboardContextEvent, EarlyWarning, Trajectory } from '../../types'
import {
  humanizeContext,
  humanizeDeviation,
  humanizeDirection,
  humanizeEvidence,
  humanizePatternType,
  humanizeSignal,
} from '../../utils/formatters'

interface MyJourneyScreenProps {
  warning: EarlyWarning | null
  trajectory: Trajectory | null
  contextEvents: DashboardContextEvent[]
  onNavigate: (screen: 'pulse' | 'journey' | 'support') => void
}

export default function MyJourneyScreen({
  warning,
  trajectory,
  contextEvents,
  onNavigate,
}: MyJourneyScreenProps) {
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
            <div
              className="baseline-indicator-line"
              style={{ bottom: `${(baselineVal / 10) * 100}%` }}
            >
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
                      <p className="entry-note">{pulse.optional_note || 'No note attached'}</p>
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
                      <span className="entry-score-tag highlight">
                        {pulse.wellbeing_level} / 10
                      </span>
                    </div>
                    <p className="entry-note">{pulse.optional_note || 'No note attached'}</p>
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
