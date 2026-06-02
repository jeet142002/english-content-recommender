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

const contentOptions: { value: ContentMode; label: string; description: string; icon: typeof Film }[] = [
  {
    value: "movie",
    label: "Movie",
    description: "One great film.",
    icon: Film,
  },
  {
    value: "series",
    label: "Series",
    description: "Something to binge.",
    icon: Tv,
  },
  {
    value: "either",
    label: "Surprise me",
    description: "Anything goes.",
    icon: Shuffle,
  },
];


const adventureOptions: { value: AdventureLevel; label: string; description: string; icon: typeof Moon; accent: string }[] = [
  {
    value: "safe",
    label: "Familiar",
    description: "Crowd favourites.",
    icon: Moon,
    accent: "calm",
  },
  {
    value: "balanced",
    label: "Fresh",
    description: "Popular with a twist.",
    icon: Flame,
    accent: "hot",
  },
  {
    value: "surprise",
    label: "Wild card",
    description: "Unexpected gems.",
    icon: Sparkles,
    accent: "wild",
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
          gap: var(--space-6);
        }

        .setup-hero {
          display: grid;
          max-width: 620px;
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
          max-width: 650px;
          color: var(--text-secondary);
          font-size: 18px;
          font-weight: 650;
          line-height: 1.55;
        }

        .setup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          align-items: stretch;
        }

        .setup-panel {
          display: grid;
          gap: var(--space-4);
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
          border-color: rgba(247,243,234,0.75);
          background: rgba(255,255,255,0.11);

          box-shadow:
            0 24px 60px rgba(0,0,0,0.38),
            0 0 0 1px rgba(255,255,255,0.04) inset;
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

        .option-copy,
        .range-copy {
          position: relative;
          z-index: 1;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
        }

        .range-options {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .range-button {
          min-height: 130px;
        }
        
        .format-button {
          min-height: 145px;
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
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          margin-top: -2px;
        }

        .deck-line {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(247,243,234,0.72);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
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

        }
      `}</style>

      <motion.div
        className="setup-hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >

        <div className="section-label">Tonight</div>
        <h2 className="setup-title">What are you in the mood for?</h2>
        <p className="setup-copy">
          Pick a format and how adventurous you're feeling. We'll take it from there.
        </p>

      </motion.div>

      <div className="setup-grid">
        <motion.div
          className="setup-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.06 }}
        >
          <div className="panel-title">What are you watching?</div>
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
                <div className="option-copy">{option.description}</div>
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
          <div className="panel-title">How adventurous?</div>
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
                <div className="range-copy">{option.description}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
      <motion.div
        className="submit-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.22
        }}
      >
        <button
          onClick={onSubmit}
          disabled={loading}
          className="btn btn-primary btn-lg"
          data-testid="start-tasting"
        >
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

        <div className="deck-line">
          <Clapperboard size={16} />
          You'll see one title at a time. Stop when something clicks.
        </div>
      </motion.div>

    </section>
  );
}
