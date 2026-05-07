"use client";

import { motion } from "framer-motion";
import { ArrowRight, Film, Loader2, Scale, Shield, Shuffle, Sparkles, Tv } from "lucide-react";

import type { AdventureLevel, ContentMode } from "@/lib/types";

type PrimingPanelProps = {
  contentMode: ContentMode;
  adventureLevel: AdventureLevel;
  onChange: (contentMode: ContentMode, adventureLevel: AdventureLevel) => void;
  onSubmit: () => void;
  loading: boolean;
};

const contentOptions: { value: ContentMode; label: string; icon: typeof Film; description: string }[] = [
  { value: "movie", label: "Movie", icon: Film, description: "One complete story for tonight." },
  { value: "series", label: "Series", icon: Tv, description: "A world you can stay inside." },
  { value: "either", label: "Either", icon: Shuffle, description: "Let the best match win." },
];

const adventureOptions: { value: AdventureLevel; label: string; icon: typeof Shield; caption: string; hint: string }[] = [
  {
    value: "safe",
    label: "Comfort fit",
    icon: Shield,
    caption: "Recognizable and easy to trust.",
    hint: "Best when you want low-risk satisfaction.",
  },
  {
    value: "balanced",
    label: "Sweet spot",
    icon: Scale,
    caption: "A strong match with room for discovery.",
    hint: "The default for most nights.",
  },
  {
    value: "surprise",
    label: "Deep cut",
    icon: Sparkles,
    caption: "Less obvious, more adventurous.",
    hint: "Best when you want a fresher lane.",
  },
];

export function PrimingPanel({
  contentMode,
  adventureLevel,
  onChange,
  onSubmit,
  loading,
}: PrimingPanelProps) {
  return (
    <section className="priming-panel">
      <style jsx>{`
        .priming-panel {
          display: grid;
          gap: var(--space-8);
          padding: var(--space-8) 0 var(--space-12);
        }

        .setup-hero {
          display: grid;
          max-width: 780px;
          gap: var(--space-3);
        }

        .setup-copy {
          max-width: 640px;
          color: var(--text-secondary);
          font-size: 17px;
          line-height: 1.7;
        }

        .setup-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
          gap: var(--space-5);
          align-items: start;
        }

        .panel {
          display: grid;
          gap: var(--space-5);
          padding: var(--space-6);
          border-radius: var(--radius-2xl);
        }

        .panel-heading {
          display: grid;
          gap: var(--space-1);
        }

        .panel-title {
          color: var(--text);
          font-size: 18px;
          font-weight: 900;
        }

        .panel-subtitle {
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 700;
        }

        .content-options {
          display: grid;
          gap: var(--space-3);
        }

        .content-option {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-4);
          align-items: center;
          padding: var(--space-4);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.045);
          text-align: left;
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast);
        }

        .content-option:hover {
          transform: translateY(-1px);
          border-color: var(--line-strong);
          background: rgba(255, 255, 255, 0.07);
        }

        .content-option.active {
          border-color: rgba(77, 212, 189, 0.58);
          background: var(--teal-soft);
        }

        .option-icon {
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
        }

        .content-option.active .option-icon {
          background: var(--teal);
          color: #04120f;
        }

        .option-label {
          color: var(--text);
          font-size: 15px;
          font-weight: 900;
        }

        .option-description {
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.45;
        }

        .adventure-options {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .adventure-option {
          display: grid;
          min-height: 220px;
          align-content: space-between;
          gap: var(--space-5);
          padding: var(--space-5);
          border: 1px solid var(--line);
          border-radius: var(--radius-xl);
          background: rgba(255, 255, 255, 0.045);
          text-align: left;
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
        }

        .adventure-option:hover {
          transform: translateY(-2px);
          border-color: var(--line-strong);
          background: rgba(255, 255, 255, 0.07);
        }

        .adventure-option.active {
          border-color: rgba(143, 123, 255, 0.72);
          background:
            linear-gradient(145deg, rgba(143, 123, 255, 0.22), rgba(246, 196, 107, 0.06)),
            rgba(255, 255, 255, 0.055);
          box-shadow: 0 18px 44px rgba(143, 123, 255, 0.16);
        }

        .adventure-icon {
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--accent-strong);
        }

        .adventure-option.active .adventure-icon {
          background: var(--accent);
          color: #080911;
        }

        .adventure-copy {
          display: grid;
          gap: var(--space-2);
        }

        .adventure-label {
          color: var(--text);
          font-size: 17px;
          font-weight: 900;
        }

        .adventure-caption {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.5;
        }

        .adventure-hint {
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .submit-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding-top: var(--space-2);
        }

        .submit-note {
          max-width: 430px;
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 980px) {
          .setup-grid,
          .adventure-options {
            grid-template-columns: 1fr;
          }

          .adventure-option {
            min-height: auto;
          }
        }

        @media (max-width: 680px) {
          .priming-panel {
            padding-top: var(--space-5);
          }

          .panel {
            padding: var(--space-4);
            border-radius: var(--radius-xl);
          }

          .submit-section {
            align-items: stretch;
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <motion.div
        className="setup-hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >
        <div className="section-label">Set the vibe</div>
        <h2 className="section-title">Tell it what kind of night this is.</h2>
        <p className="setup-copy">
          Two light choices are enough. The real learning happens when you react to titles.
        </p>
      </motion.div>

      <div className="setup-grid">
        <motion.div
          className="panel glass"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.06 }}
        >
          <div className="panel-heading">
            <div className="panel-title">Format</div>
            <div className="panel-subtitle">What do you want to commit to?</div>
          </div>

          <div className="content-options">
            {contentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value, adventureLevel)}
                className={`content-option ${contentMode === option.value ? "active" : ""}`}
                aria-pressed={contentMode === option.value}
              >
                <div className="option-icon">
                  <option.icon size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="option-label">{option.label}</div>
                  <div className="option-description">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="panel glass"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12 }}
        >
          <div className="panel-heading">
            <div className="panel-title">Discovery range</div>
            <div className="panel-subtitle">How far should the recommendation reach?</div>
          </div>

          <div className="adventure-options">
            {adventureOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(contentMode, option.value)}
                className={`adventure-option ${adventureLevel === option.value ? "active" : ""}`}
                aria-pressed={adventureLevel === option.value}
              >
                <div className="adventure-icon">
                  <option.icon size={20} strokeWidth={2.2} />
                </div>
                <div className="adventure-copy">
                  <div className="adventure-label">{option.label}</div>
                  <div className="adventure-caption">{option.caption}</div>
                  <div className="adventure-hint">{option.hint}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="submit-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.18 }}
      >
        <p className="submit-note">
          No account, no long questionnaire. You can stop as soon as the pick feels ready.
        </p>
        <button onClick={onSubmit} disabled={loading} className="btn btn-primary btn-lg" data-testid="start-tasting">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Finding the first title
            </>
          ) : (
            <>
              Start tasting
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </motion.div>
    </section>
  );
}
