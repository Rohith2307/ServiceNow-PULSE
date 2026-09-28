import { useState } from 'react'
import type { EarlyWarning, SupportOption, Trajectory } from '../../types'
import { humanizeContext } from '../../utils/formatters'

interface MySupportScreenProps {
  warning: EarlyWarning | null
  trajectory: Trajectory | null
  supportOptions: SupportOption[]
  onNavigate: (screen: 'pulse' | 'journey' | 'support') => void
}

export default function MySupportScreen({
  warning,
  supportOptions,
  onNavigate,
}: MySupportScreenProps) {
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
                          Confidential support contacts are available whenever you wish to speak
                          with someone:
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
                              Self-service criteria and instructions for short-term assignment
                              adjustments.
                            </p>
                          </div>
                          <div className="contact-item-card">
                            <strong>Study Planning Templates</strong>
                            <p>Self-paced milestone schedules and weekly time-blocking worksheets.</p>
                          </div>
                        </div>
                        <p className="subtle-reassurance-text">
                          Note: Extension requests remain voluntary and can be submitted via the
                          student portal when you choose.
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
            Done exploring support options? You can return to your longitudinal timeline or record a
            new check-in anytime.
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
