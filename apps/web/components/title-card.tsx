"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, Eye, Sparkles, Users, Palette, Loader2, XCircle } from "lucide-react";

import type { FeedbackValue, SessionTitleResponse } from "@/lib/types";

type TitleCardProps = {
  payload: SessionTitleResponse;
  onFeedback: (value: FeedbackValue) => void;
  onStop: () => void;
  loading: boolean;
};

const actions: { value: FeedbackValue; label: string; icon: typeof ThumbsUp; variant: "success" | "danger" | "neutral" }[] = [
  { value: "like", label: "Like", icon: ThumbsUp, variant: "success" },
  { value: "dislike", label: "Dislike", icon: ThumbsDown, variant: "danger" },
  { value: "not_seen", label: "Not seen", icon: Eye, variant: "neutral" },
];

export function TitleCard({ payload, onFeedback, onStop, loading }: TitleCardProps) {
  const { title, step, confidence } = payload;

  return (
    <motion.section 
      className="title-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <style jsx>{`
        .title-card {
          margin-top: var(--space-6);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: var(--space-6);
        }
        
        @media (max-width: 900px) {
          .title-card {
            grid-template-columns: 1fr;
          }
        }
        
        .poster-container {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-lg);
          aspect-ratio: 2 / 3;
          max-width: 300px;
          width: 100%;
          background: var(--surface);
          margin: 0 auto;
        }
        
        .poster-image {
          transition: transform var(--transition-slow);
          object-position: center top;
        }
        
        .poster-container:hover .poster-image {
          transform: scale(1.03);
        }
        
        .content-section {
          display: grid;
          gap: var(--space-5);
          align-content: start;
        }
        
        .header-row {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          flex-wrap: wrap;
          align-items: flex-start;
        }
        
        .title-info {
          display: grid;
          gap: var(--space-1);
        }
        
        .step-indicator {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
        }
        
        .title-text {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        
        .meta-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 15px;
          margin-top: var(--space-2);
        }
        
        .meta-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--text-secondary);
        }
        
        .stop-button {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-full);
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        
        .stop-button:hover:not(:disabled) {
          background: var(--surface-hover);
          border-color: var(--line-strong);
        }
        
        .tags-container {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        
        .synopsis {
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 16px;
          margin: 0;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-4);
        }
        
        @media (max-width: 600px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .detail-card {
          display: grid;
          gap: var(--space-2);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--line);
        }
        
        .detail-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .detail-value {
          font-size: 15px;
          line-height: 1.5;
        }
        
        .actions-container {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
          padding-top: var(--space-2);
        }
        
        .action-button {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4) var(--space-5);
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all var(--transition-fast);
          min-width: 130px;
          justify-content: center;
        }
        
        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .action-button.success {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
        }
        
        .action-button.success:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(34, 197, 94, 0.4);
        }
        
        .action-button.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
        }
        
        .action-button.danger:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(239, 68, 68, 0.4);
        }
        
        .action-button.neutral {
          background: var(--surface-strong);
          color: var(--text);
          border: 1px solid var(--line);
        }
        
        .action-button.neutral:hover:not(:disabled) {
          background: var(--surface-hover);
          border-color: var(--line-strong);
        }
      `}</style>

      <div className="poster-container">
        <Image 
          src={title.posterUrl} 
          alt={title.title} 
          fill 
          sizes="(max-width: 900px) 100vw, 300px" 
          className="poster-image"
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      <div className="content-section">
        <div className="header-row">
          <div className="title-info">
            <div className="step-indicator">
              <Sparkles size={14} />
              Step {step} · {Math.round(confidence * 100)}% confidence
            </div>
            <h2 className="title-text">{title.title}</h2>
            <div className="meta-row">
              {title.year}
              <span className="meta-dot" />
              {title.kind === "movie" ? `${title.runtime} min` : `${title.seasons} seasons`}
              <span className="meta-dot" />
              {title.certification}
            </div>
          </div>
          <button onClick={onStop} disabled={loading} className="stop-button">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            Stop and recommend
          </button>
        </div>

        <div className="tags-container">
          {title.genres.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {title.tone.slice(0, 3).map((tag) => (
            <span key={tag} className="tag" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {tag}
            </span>
          ))}
        </div>

        <p className="synopsis">{title.synopsis}</p>

        <div className="details-grid">
          <div className="detail-card">
            <div className="detail-label">
              <Users size={14} />
              Cast
            </div>
            <div className="detail-value">{title.cast.slice(0, 4).join(", ")}</div>
          </div>
          <div className="detail-card">
            <div className="detail-label">
              <Palette size={14} />
              Style
            </div>
            <div className="detail-value">{title.style.join(" · ")}</div>
          </div>
        </div>

        <div className="actions-container">
          {actions.map((action) => (
            <button
              key={action.value}
              onClick={() => onFeedback(action.value)}
              disabled={loading}
              className={`action-button ${action.variant}`}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <action.icon size={18} />
              )}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
