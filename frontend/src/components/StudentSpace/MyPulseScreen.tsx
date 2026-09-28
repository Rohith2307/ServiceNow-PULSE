import { useEffect, useState } from 'react'
import type { EarlyWarning, Student, Trajectory } from '../../types'
import {
  API_BASE_URL,
  CONCERN_OPTIONS,
  SCORE_DESCRIPTORS,
  calculateNextWeek,
  formatError,
  humanizeSignal,
} from '../../utils/formatters'

interface MyPulseScreenProps {
  student: Student | null
  trajectory: Trajectory | null
  warning: EarlyWarning | null
  onPulseSubmitted: () => Promise<void>
  onNavigate: (screen: 'pulse' | 'journey' | 'support') => void
}

export default function MyPulseScreen({
  student,
  trajectory,
  warning,
  onPulseSubmitted,
  onNavigate,
}: MyPulseScreenProps) {
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
  onNavigate: (screen: 'pulse' | 'journey' | 'support') => void
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
      setDate(
        calculateNextWeek([
          ...(trajectory?.pulses ?? []),
          {
            pulse_id: 'new',
            student_id: student.student_id,
            date: submitted,
            wellbeing_level: wellbeingLevel,
            concerns: selectedConcerns,
            optional_note: optionalNote,
          },
        ]),
      )
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
