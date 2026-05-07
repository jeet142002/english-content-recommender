"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Eye,
  Loader2,
  Palette,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TimerReset,
  Users,
} from "lucide-react";

import type { FeedbackValue, SessionTitleResponse } from "@/lib/types";

type TitleCardProps = {
  payload: SessionTitleResponse;
  onFeedback: (value: FeedbackValue) => void;
  onStop: () => void;
  loading: boolean;
};

const actions: {
  value: FeedbackValue;
  label: string;
  sublabel: string;
  icon: typeof ThumbsUp;
  variant: "like" | "dislike" | "skip";
}[] = [
  { value: "like", label: "Loved the vibe", sublabel: "More like this", icon: ThumbsUp, variant: "like" },
  { value: "dislike", label: "Not for me", sublabel: "Move away", icon: ThumbsDown, variant: "dislike" },
  { value: "not_seen", label: "Haven't seen it", sublabel: "Keep it neutral", icon: Eye, variant: "skip" },
];

function confidenceCopy(confidence: number) {
  if (confidence < 0.28) {
    return "First signal";
  }
  if (confidence < 0.58) {
    return "Taste forming";
  }
  return "Strong read";
}

export function TitleCard({ payload, onFeedback, onStop, loading }: TitleCardProps) {
  const { title, step, confidence } = payload;
  const runtimeLabel = title.kind === "movie" ? `${title.runtime} min` : `${title.seasons ?? 0} seasons`;
  const matchPercent = Math.round(confidence * 100);

  return (
    <motion.section
      className="rating-shell"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
    >
      <style jsx>{`
        .rating-shell {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.1fr);
          gap: var(--space-8);
          min-height: 620px;
          padding: var(--space-6);
          border: 1px solid var(--line);
          border-radius: var(--radius-2xl);
          background: var(--panel-strong);
          box-shadow: var(--shadow);
        }

        .backdrop {
          position: absolute;
          inset: 0;
          opacity: 0.22;
          filter: blur(26px) saturate(1.2);
          transform: scale(1.08);
        }

        .backdrop::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(7, 8, 13, 0.96), rgba(7, 8, 13, 0.66)),
            linear-gradient(180deg, transparent, rgba(7, 8, 13, 0.94));
        }

        .poster-column,
        .content-column {
          position: relative;
          z-index: 1;
        }

        .poster-column {
          display: grid;
          align-content: center;
          justify-items: center;
          gap: var(--space-4);
        }

        .poster-wrap {
          position: relative;
          width: min(100%, 360px);
          overflow: hidden;
          aspect-ratio: 2 / 3;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: var(--radius-2xl);
          background: #10131d;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
        }

        .poster-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: inherit;
          pointer-events: none;
        }

        .poster-caption {
          display: flex;
          width: min(100%, 360px);
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 800;
        }

        .signal-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 1px solid rgba(143, 123, 255, 0.36);
          border-radius: var(--radius-full);
          background: var(--accent-soft);
          color: #dcd4ff;
        }

        .content-column {
          display: grid;
          align-content: center;
          gap: var(--space-5);
          min-width: 0;
        }

        .topline {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
        }

        .taste-step {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--gold);
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stop-button {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          min-height: 40px;
          padding: 0 var(--space-4);
          border: 1px solid var(--line);
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 900;
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);
        }

        .stop-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(246, 196, 107, 0.32);
          background: var(--gold-soft);
          color: #ffe2a8;
        }

        .title-block {
          display: grid;
          gap: var(--space-3);
        }

        .title-text {
          max-width: 760px;
          color: var(--text);
          font-size: clamp(38px, 6vw, 72px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.98;
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 800;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .synopsis {
          max-width: 720px;
          color: var(--text-soft);
          font-size: clamp(15px, 1.7vw, 18px);
          line-height: 1.8;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .detail-card {
          display: grid;
          gap: var(--space-2);
          min-width: 0;
          padding: var(--space-4);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.055);
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .detail-value {
          overflow-wrap: anywhere;
          color: var(--text);
          font-size: 14px;
          font-weight: 700;
          line-height: 1.5;
        }

        .actions-panel {
          display: grid;
          gap: var(--space-3);
          padding-top: var(--space-2);
        }

        .actions-label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .actions-container {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .action-button {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-3);
          align-items: center;
          min-height: 74px;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.06);
          text-align: left;
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .action-button.like:hover:not(:disabled) {
          border-color: rgba(43, 214, 111, 0.55);
          background: rgba(43, 214, 111, 0.13);
          box-shadow: 0 18px 36px rgba(43, 214, 111, 0.14);
        }

        .action-button.dislike:hover:not(:disabled) {
          border-color: rgba(255, 77, 93, 0.55);
          background: rgba(255, 77, 93, 0.13);
          box-shadow: 0 18px 36px rgba(255, 77, 93, 0.14);
        }

        .action-button.skip:hover:not(:disabled) {
          border-color: rgba(143, 123, 255, 0.55);
          background: rgba(143, 123, 255, 0.13);
          box-shadow: 0 18px 36px rgba(143, 123, 255, 0.14);
        }

        .action-icon {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
        }

        .action-button.like .action-icon {
          color: var(--success);
        }

        .action-button.dislike .action-icon {
          color: var(--error);
        }

        .action-button.skip .action-icon {
          color: var(--accent-strong);
        }

        .action-copy {
          display: grid;
          gap: 2px;
        }

        .action-label {
          color: var(--text);
          font-size: 14px;
          font-weight: 900;
        }

        .action-sublabel {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 980px) {
          .rating-shell {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: var(--space-4);
          }

          .poster-column {
            align-content: start;
          }

          .poster-wrap,
          .poster-caption {
            width: min(100%, 320px);
          }

          .content-column {
            align-content: start;
          }
        }

        @media (max-width: 720px) {
          .rating-shell {
            gap: var(--space-5);
            border-radius: var(--radius-xl);
          }

          .topline {
            align-items: flex-start;
          }

          .stop-button {
            width: 100%;
            justify-content: center;
          }

          .details-grid,
          .actions-container {
            grid-template-columns: 1fr;
          }

          .action-button {
            min-height: 64px;
          }

          .poster-wrap,
          .poster-caption {
            width: min(82vw, 300px);
          }
        }
      `}</style>

      <div className="backdrop" aria-hidden="true">
        <Image src={title.posterUrl} alt="" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
      </div>

      <div className="poster-column">
        <div className="poster-wrap">
          <Image
            src={title.posterUrl}
            alt={`${title.title} poster`}
            fill
            sizes="(max-width: 980px) 82vw, 360px"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            priority
          />
        </div>
        <div className="poster-caption">
          <span className="signal-pill">
            <Sparkles size={13} />
            {confidenceCopy(confidence)}
          </span>
          <span>{matchPercent}% read</span>
        </div>
      </div>

      <div className="content-column">
        <div className="topline">
          <div className="taste-step">
            <BadgeCheck size={15} />
            Taste card {step}
          </div>
          <button onClick={onStop} disabled={loading} className="stop-button" data-testid="stop-and-recommend">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <TimerReset size={15} />}
            Reveal my pick
          </button>
        </div>

        <div className="title-block">
          <h2 className="title-text">{title.title}</h2>
          <div className="meta-row">
            <span>{title.year}</span>
            <span className="meta-dot" />
            <span>{runtimeLabel}</span>
            <span className="meta-dot" />
            <span>{title.certification}</span>
            {title.tmdbRating ? (
              <>
                <span className="meta-dot" />
                <span>{title.tmdbRating.toFixed(1)} TMDB</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="tags-container">
          {title.genres.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {title.tone.slice(0, 3).map((tag) => (
            <span key={tag} className="tag tag-accent">
              {tag}
            </span>
          ))}
        </div>

        <p className="synopsis">{title.synopsis}</p>

        <div className="details-grid">
          <div className="detail-card">
            <div className="detail-label">
              <Users size={13} />
              People
            </div>
            <div className="detail-value">{title.cast.slice(0, 4).join(", ")}</div>
          </div>
          <div className="detail-card">
            <div className="detail-label">
              <Palette size={13} />
              Texture
            </div>
            <div className="detail-value">{title.style.slice(0, 3).join(" / ")}</div>
          </div>
        </div>

        <div className="actions-panel">
          <div className="actions-label">React honestly</div>
          <div className="actions-container">
            {actions.map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => onFeedback(action.value)}
                disabled={loading}
                className={`action-button ${action.variant}`}
                data-testid={`feedback-${action.value}`}
              >
                <div className="action-icon">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <action.icon size={18} />}
                </div>
                <div className="action-copy">
                  <div className="action-label">{action.label}</div>
                  <div className="action-sublabel">{action.sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
