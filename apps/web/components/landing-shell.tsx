"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock3, Eye, Sparkles, ThumbsUp } from "lucide-react";

type LandingShellProps = {
  onStart: () => void;
};

const cues = [
  { icon: ThumbsUp, label: "Taste over genres", text: "A few reactions say more than a long survey." },
  { icon: Eye, label: "Unseen is neutral", text: "Skip unfamiliar titles without hurting the read." },
  { icon: Sparkles, label: "One confident pick", text: "Get a final choice with human-readable reasons." },
];

export function LandingShell({ onStart }: LandingShellProps) {
  return (
    <section className="landing-section">
      <style jsx>{`
        .landing-section {
          display: grid;
          min-height: calc(100vh - 92px);
          align-items: center;
          padding: var(--space-8) 0 var(--space-12);
        }

        .landing-grid {
          display: grid;
          gap: var(--space-8);
          align-items: start;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          display: grid;
          gap: var(--space-6);
          max-width: 980px;
        }

        .eyebrow {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 1px solid rgba(246, 196, 107, 0.22);
          border-radius: var(--radius-full);
          background: var(--gold-soft);
          color: #ffe2a8;
          font-size: 13px;
          font-weight: 900;
        }

        .hero-title {
          max-width: 760px;
          color: var(--text);
          font-size: clamp(48px, 8.5vw, 104px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.94;
        }

        .hero-title span {
          display: block;
          color: var(--text-soft);
        }

        .subtitle {
          max-width: 610px;
          color: var(--text-secondary);
          font-size: clamp(17px, 2vw, 21px);
          line-height: 1.7;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-4);
        }

        .time-hint {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 700;
        }

        .cue-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
          padding-top: var(--space-3);
        }

        .cue {
          display: grid;
          gap: var(--space-2);
          padding: var(--space-4);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.045);
        }

        .cue-icon {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 12px;
          background: var(--teal-soft);
          color: var(--teal);
        }

        .cue-label {
          color: var(--text);
          font-size: 13px;
          font-weight: 900;
        }

        .cue-text {
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .taste-card {
          display: grid;
          gap: var(--space-3);
          padding: var(--space-5);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: var(--radius-xl);
          background: rgba(11, 13, 21, 0.88);
          box-shadow: var(--shadow-soft);
          backdrop-filter: blur(18px);
        }

        .taste-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          color: var(--text-soft);
          font-size: 13px;
          font-weight: 900;
        }

        .signal-bar {
          height: 9px;
          overflow: hidden;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.09);
        }

        .signal-fill {
          width: 72%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--teal), var(--accent), var(--gold));
        }

        .taste-copy {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.55;
        }

        @media (max-width: 1400px) {
          .landing-grid {
            grid-template-columns: 1fr;
          }

          .hero-copy {
            max-width: none;
          }
        }

        @media (max-width: 680px) {
          .landing-section {
            align-items: start;
            padding-top: var(--space-4);
          }

          .hero-title {
            font-size: clamp(42px, 15vw, 70px);
          }

          .cta-row,
          .time-hint {
            width: 100%;
          }

          .cue-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="landing-grid">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="eyebrow">
            <Sparkles size={15} />
            Built for tonight&apos;s English-only watch
          </div>

          <h1 className="hero-title">
            Find the one.
            <span>Skip the scroll.</span>
          </h1>

          <p className="subtitle">
            React to a handful of movies and series. In under a minute, get one confident pick
            that feels like it came from your taste, not a generic top-ten list.
          </p>

          <div className="cta-row">
            <button
              onClick={onStart}
              onPointerDown={onStart}
              className="btn btn-primary btn-lg"
              data-testid="landing-start"
            >
              Start the taste test
              <ArrowRight size={18} />
            </button>
            <span className="time-hint">
              <Clock3 size={16} />
              Usually 5 to 7 quick reactions
            </span>
          </div>

          <div className="cue-row" aria-label="How it works">
            {cues.map((cue) => (
              <div key={cue.label} className="cue">
                <div className="cue-icon">
                  <cue.icon size={17} />
                </div>
                <div className="cue-label">{cue.label}</div>
                <div className="cue-text">{cue.text}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
