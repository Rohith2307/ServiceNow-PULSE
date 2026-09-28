interface LandingPageProps {
  onSelectStudent: () => void
  onSelectUniversity: () => void
}

export default function LandingPage({ onSelectStudent, onSelectUniversity }: LandingPageProps) {
  return (
    <main className="landing-container">
      <div className="landing-content">
        <header className="landing-brand-header">
          <div className="landing-badge-wrap">
            <span className="landing-dot">●</span>
            <span className="landing-badge">CONFIDENTIAL &amp; CONTEXTUAL WELLBEING</span>
          </div>
          <h1 className="landing-title">PULSE</h1>
          <p className="landing-tagline">
            Understand change.<br />
            Support when it matters.
          </p>
          <p className="landing-subtext">
            A longitudinal wellbeing platform connecting private personal reflection
            with contextual institutional intelligence.
          </p>
        </header>

        <section className="landing-choices-row" aria-label="Select portal">
          <button
            type="button"
            className="landing-card-button student-card"
            onClick={onSelectStudent}
            aria-label="Enter student space"
          >
            <div className="landing-card-icon">🌱</div>
            <div className="landing-card-text">
              <span className="landing-card-eyebrow">Personal &amp; Private</span>
              <h2 className="landing-card-title">For Student</h2>
              <p className="landing-card-desc">
                Weekly check-ins, personal trajectory tracking, and voluntary, student-controlled support.
              </p>
            </div>
            <span className="landing-card-cta">
              Enter Student Space <span className="cta-arrow">→</span>
            </span>
          </button>

          <button
            type="button"
            className="landing-card-button university-card"
            onClick={onSelectUniversity}
            aria-label="Open university intelligence"
          >
            <div className="landing-card-icon">🏛️</div>
            <div className="landing-card-text">
              <span className="landing-card-eyebrow">Institutional &amp; Analytical</span>
              <h2 className="landing-card-title">For University</h2>
              <p className="landing-card-desc">
                Cohort-level dynamics, academic calendar context, and student trajectory inspection.
              </p>
            </div>
            <span className="landing-card-cta">
              Open University Intelligence <span className="cta-arrow">→</span>
            </span>
          </button>
        </section>

        <footer className="landing-footer">
          <div className="landing-pillars">
            <span className="landing-pillar-item">
              <span className="pillar-dot">✓</span> Student Autonomy
            </span>
            <span className="landing-pillar-item">
              <span className="pillar-dot">✓</span> Explainable Intelligence
            </span>
            <span className="landing-pillar-item">
              <span className="pillar-dot">✓</span> Zero Surveillance
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}
