"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clapperboard, Film, Flame, Loader2, Moon, Shuffle, Sparkles, Tv } from "lucide-react";

import type { AdventureLevel, ContentMode } from "@/lib/types";

type PrimingPanelProps = {
  contentMode: ContentMode;
  adventureLevel: AdventureLevel;
  onChange: (contentMode: ContentMode, adventureLevel: AdventureLevel) => void;
  onSubmit: () => void;
  loading: boolean;
};

const contentOptions: { value: ContentMode; label: string; icon: typeof Film }[] = [
  { value: "movie", label: "Movie", icon: Film },
  { value: "series", label: "Series", icon: Tv },
  { value: "either", label: "Surprise me", icon: Shuffle },
];

const adventureOptions: { value: AdventureLevel; label: string; icon: typeof Moon; accent: string }[] = [
  { value: "safe", label: "Familiar", icon: Moon, accent: "calm" },
  { value: "balanced", label: "Electric", icon: Flame, accent: "hot" },
  { value: "surprise", label: "Wild card", icon: Sparkles, accent: "wild" },
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
          max-width: 760px;
          gap: var(--space-4);
        }

        .setup-title {
          color: var(--text);
          font-size: 56px;
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.98;
          text-wrap: balance;
        }

        .setup-copy {
          max-width: 560px;
          color: var(--text-secondary);
          font-size: 18px;
          font-weight: 650;
          line-height: 1.55;
        }

        .setup-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
          gap: var(--space-4);
          align-items: stretch;
        }

        .setup-panel {
          display: grid;
          gap: var(--space-4);
          padding: var(--space-5);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.055);
          backdrop-filter: blur(20px);
        }

        .panel-title {
          color: var(--text);
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .format-options {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .format-button,
        .range-button {
          position: relative;
          overflow: hidden;
          display: grid;
          align-content: end;
          min-height: 150px;
          gap: var(--space-4);
          padding: var(--space-4);
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.045);
          text-align: left;
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
        }

        .format-button::before,
        .range-button::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0;
          background:
            linear-gradient(135deg, rgba(246, 196, 107, 0.16), transparent 42%),
            linear-gradient(315deg, rgba(77, 212, 189, 0.14), transparent 46%);
          transition: opacity var(--transition-fast);
        }

        .format-button:hover,
        .range-button:hover {
          transform: translateY(-2px);
          border-color: var(--line-strong);
        }

        .format-button.active,
        .range-button.active {
          border-color: rgba(247, 243, 234, 0.58);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 22px 54px rgba(0, 0, 0, 0.34);
        }

        .format-button.active::before,
        .range-button.active::before {
          opacity: 1;
        }

        .option-icon,
        .range-icon {
          position: relative;
          z-index: 1;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.1);
          color: var(--text);
        }

        .option-label,
        .range-label {
          position: relative;
          z-index: 1;
          color: var(--text);
          font-size: 17px;
          font-weight: 900;
          line-height: 1.15;
        }

        .range-options {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .range-button {
          min-height: 210px;
        }

        .range-button.calm .range-icon {
          color: var(--teal);
        }

        .range-button.hot .range-icon {
          color: var(--gold);
        }

        .range-button.wild .range-icon {
          color: var(--rose);
        }

        .submit-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding-top: var(--space-2);
        }

        .deck-line {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 850;
        }

        @media (max-width: 980px) {
          .setup-grid {
            grid-template-columns: 1fr;
          }

          .setup-title {
            font-size: 46px;
          }
        }

        @media (max-width: 680px) {
          .priming-panel {
            padding-top: var(--space-5);
          }

          .setup-title {
            font-size: 34px;
          }

          .setup-copy {
            font-size: 16px;
          }

          .format-options,
          .range-options {
            grid-template-columns: 1fr;
          }

          .format-button,
          .range-button {
            min-height: 92px;
            grid-template-columns: auto 1fr;
            align-content: center;
            align-items: center;
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
        <div className="section-label">Tonight</div>
        <h2 className="setup-title">Set the scene.</h2>
        <p className="setup-copy">Two taps, then the deck starts moving.</p>
      </motion.div>

      <div className="setup-grid">
        <motion.div
          className="setup-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.06 }}
        >
          <div className="panel-title">Format</div>
          <div className="format-options">
            {contentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value, adventureLevel)}
                className={`format-button ${contentMode === option.value ? "active" : ""}`}
                aria-pressed={contentMode === option.value}
              >
                <div className="option-icon">
                  <option.icon size={20} strokeWidth={2.2} />
                </div>
                <div className="option-label">{option.label}</div>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="setup-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12 }}
        >
          <div className="panel-title">Range</div>
          <div className="range-options">
            {adventureOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(contentMode, option.value)}
                className={`range-button ${option.accent} ${adventureLevel === option.value ? "active" : ""}`}
                aria-pressed={adventureLevel === option.value}
              >
                <div className="range-icon">
                  <option.icon size={20} strokeWidth={2.2} />
                </div>
                <div className="range-label">{option.label}</div>
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
        <div className="deck-line">
          <Clapperboard size={16} />
          React fast. Stop whenever it clicks.
        </div>
        <button onClick={onSubmit} disabled={loading} className="btn btn-primary btn-lg" data-testid="start-tasting">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Opening deck
            </>
          ) : (
            <>
              Open the deck
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </motion.div>
    </section>
  );
}
