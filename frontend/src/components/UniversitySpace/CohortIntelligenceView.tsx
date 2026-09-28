import { useMemo, useState } from 'react'
import type {
  DashboardCohort,
  DashboardContextEvent,
  DashboardOverview,
  DashboardRecommendation,
  DashboardTrends,
} from '../../types'
import {
  humanizeCohortStatus,
  humanizeContext,
  humanizeDirection,
  humanizeEvidence,
  humanizePatternType,
  humanizeSignal,
} from '../../utils/formatters'

interface CohortIntelligenceViewProps {
  overview: DashboardOverview | null
  trends: DashboardTrends | null
  cohorts: DashboardCohort[]
  context: DashboardContextEvent[]
  recommendations: DashboardRecommendation[]
}

export default function CohortIntelligenceView({
  overview,
  trends,
  cohorts,
  context,
  recommendations,
}: CohortIntelligenceViewProps) {
  const [selectedCohortName, setSelectedCohortName] = useState<string | null>(null)

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
              <p>
                Transparent pattern detection with contextual reasoning rather than opaque
                predictive scores.
              </p>
            </div>
          </div>
          <div className="principle-item">
            <span className="principle-icon">🛡️</span>
            <div>
              <strong>Institutional Privacy Guarantee</strong>
              <p>
                Aggregated cohort metrics only. Zero individual ranking, risk scores, or intervention
                queues.
              </p>
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
                Across all monitored groups, check-in data is analyzed for meaningful multi-week shifts
                from baseline. Currently, {emergingCount} of {cohorts.length} cohort(s) exhibit early
                stress signals coinciding with peak academic calendar deadlines.
              </p>
            </div>

            <div className="cohort-prevalence-summary">
              <div className="summary-stat-box">
                <span className="stat-caption">Average Shift Prevalence</span>
                <strong className="stat-number">
                  {cohorts.length > 0
                    ? (
                        cohorts.reduce((acc, c) => acc + c.prevalence, 0) / cohorts.length
                      ).toFixed(1)
                    : 0}
                  %
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
                        <span className="concern-count">
                          {count} of {cohorts.length} cohorts ({pct}%)
                        </span>
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
              <p className="empty-panel-text">
                No specific recurring concerns recorded in this period.
              </p>
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
          Compare aggregate pattern dynamics across cohorts. Select any cohort card to inspect its
          deep-dive contextual evidence and why-now reasoning below.
        </p>

        <div className="cohort-cards-grid">
          {cohorts.map((cohort) => {
            const statusMeta = humanizeCohortStatus(cohort.status)
            const isSelected = selectedCohort?.cohort_name === cohort.cohort_name

            return (
              <div
                key={cohort.cohort_name}
                className={`cohort-card ${statusMeta.badgeClass} ${
                  isSelected ? 'active-selection' : ''
                }`}
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
                    <span className="cohort-size">
                      {cohort.sample_size} active students in sample
                    </span>
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
          PULSE contextualizes wellbeing shifts with active institutional milestones. We interpret
          signals in context without asserting single-variable causality.
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
              Observed wellbeing dips in engineering cohorts coincide with midterm assessment
              schedules. These calendar events provide vital explanatory context, ensuring
              leadership understands the surrounding environment rather than assuming isolated
              distress.
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
              <h2 className="section-main-heading">
                Why is this pattern worth paying attention to now?
              </h2>
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
              {selectedCohort.why_now ??
                'Evaluating cohort trajectory against historical baseline.'}
            </h3>

            <p className="why-now-narrative">{selectedCohort.explanation}</p>
          </div>

          <div className="three-pillar-grid">
            <div className="pillar-card">
              <span className="pillar-label">Signal Convergence</span>
              <p className="pillar-copy">
                {selectedCohort.concerns.length > 1
                  ? `Multiple distinct stress signals (${selectedCohort.concerns
                      .map(humanizeSignal)
                      .join(
                        ', ',
                      )}) are converging simultaneously, indicating a broader workload friction rather than an isolated outlier.`
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
                    ? `${selectedCohort.deviation > 0 ? '+' : ''}${selectedCohort.deviation.toFixed(
                        1,
                      )} points`
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
          Institutional recommendations are systemic options for departmental leadership and
          faculty consideration. They are designed for structural adjustments (e.g. deadline
          spacing, office hour availability), never automated individual student intervention.
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
                          ? `${
                              matchingCohort.wellbeing_trend === 'declining'
                                ? 'Downward shift'
                                : 'Stable pattern'
                            } observed (${matchingCohort.prevalence.toFixed(
                              1,
                            )}% prevalence), coinciding with ${humanizeContext(
                              matchingCohort.context,
                            ).toLowerCase()}.`
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
            <strong>Human Judgment Standard:</strong> PULSE preserves human leadership and faculty
            discretion. No automated alerts, disciplinary tracking, or student casework are created
            by this intelligence engine.
          </p>
        </div>
      </section>

      {/* Institutional Data Governance Footer */}
      <footer className="inst-card governance-footer">
        <div className="gov-footer-content">
          <div>
            <span className="small-label">Data Governance &amp; Ethics</span>
            <p className="gov-footer-text">
              PULSE University Intelligence operates exclusively on aggregated, de-identified cohort
              metrics. All student participation remains voluntary, confidential, and
              student-controlled.
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
  )
}
