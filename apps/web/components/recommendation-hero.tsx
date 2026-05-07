"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Film, RotateCcw, Sparkles, Star, Tv } from "lucide-react";

import type { RecommendationResult } from "@/lib/types";

type RecommendationHeroProps = {
  recommendation: RecommendationResult;
  onRestart: () => void;
};

export function RecommendationHero({ recommendation, onRestart }: RecommendationHeroProps) {
  const { hero, backups, reasons, confidence, summary } = recommendation;
  const confidencePercent = Math.round(confidence * 100);
  const runtimeLabel = hero.kind === "movie" ? `${hero.runtime} min` : `${hero.seasons ?? 0} seasons`;

  return (
    <motion.section
      className="recommendation-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42 }}
    >
      <style jsx>{`
        .recommendation-section {
          display: grid;
          gap: var(--space-5);
          padding-bottom: var(--space-8);
        }

        .hero-card {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(260px, 380px) minmax(0, 1fr);
          gap: clamp(24px, 4vw, 54px);
          min-height: 660px;
          padding: clamp(18px, 3vw, 36px);
          border: 1px solid var(--line);
          border-radius: var(--radius-2xl);
          background: var(--panel-strong);
          box-shadow: var(--shadow);
        }

        .hero-backdrop {
          position: absolute;
          inset: 0;
          opacity: 0.28;
          filter: blur(30px) saturate(1.25);
          transform: scale(1.1);
        }

        .hero-backdrop::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(7, 8, 13, 0.9), rgba(7, 8, 13, 0.52)),
            linear-gradient(180deg, rgba(7, 8, 13, 0.2), rgba(7, 8, 13, 0.96));
        }

        .poster-side,
        .hero-content {
          position: relative;
          z-index: 1;
        }

        .poster-side {
          display: grid;
          align-content: center;
          gap: var(--space-4);
        }

        .poster-shell {
          position: relative;
          overflow: hidden;
          width: min(100%, 360px);
          aspect-ratio: 2 / 3;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: var(--radius-2xl);
          background: #111420;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.48);
        }

        .match-badge {
          position: absolute;
          top: var(--space-4);
          left: var(--space-4);
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--gold), var(--accent-strong));
          color: #090a10;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 18px 34px rgba(246, 196, 107, 0.22);
        }

        .poster-note {
          width: min(100%, 360px);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.55;
        }

        .hero-content {
          display: grid;
          align-content: center;
          gap: var(--space-5);
          min-width: 0;
        }

        .hero-label {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 1px solid rgba(246, 196, 107, 0.26);
          border-radius: var(--radius-full);
          background: var(--gold-soft);
          color: #ffe2a8;
          font-size: 13px;
          font-weight: 900;
        }

        .hero-title {
          max-width: 820px;
          color: var(--text);
          font-size: clamp(44px, 7.5vw, 92px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.94;
        }

        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 800;
        }

        .hero-synopsis {
          max-width: 720px;
          color: var(--text-soft);
          font-size: clamp(15px, 1.6vw, 18px);
          line-height: 1.8;
        }

        .summary-text {
          max-width: 760px;
          padding: var(--space-4) var(--space-5);
          border: 1px solid rgba(77, 212, 189, 0.22);
          border-radius: var(--radius-lg);
          background: var(--teal-soft);
          color: #d8fff7;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.65;
        }

        .reasons-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .reason-card {
          display: grid;
          align-content: start;
          gap: var(--space-3);
          min-height: 170px;
          padding: var(--space-4);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.055);
        }

        .reason-icon {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border-radius: 13px;
          background: var(--accent-soft);
          color: var(--accent-strong);
        }

        .reason-label {
          color: var(--text);
          font-size: 13px;
          font-weight: 900;
        }

        .reason-detail {
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 650;
          line-height: 1.55;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
          padding-top: var(--space-1);
        }

        .backups-section {
          display: grid;
          gap: var(--space-4);
          padding: var(--space-5);
          border: 1px solid var(--line);
          border-radius: var(--radius-2xl);
          background: rgba(255, 255, 255, 0.045);
        }

        .backups-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: var(--space-4);
        }

        .backups-title {
          display: grid;
          gap: var(--space-1);
        }

        .backups-heading {
          color: var(--text);
          font-size: 24px;
          font-weight: 900;
        }

        .backups-copy {
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 700;
        }

        .backups-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-4);
        }

        .backup-card {
          overflow: hidden;
          display: grid;
          grid-template-columns: 82px 1fr;
          gap: var(--space-3);
          align-items: center;
          padding: var(--space-3);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.055);
        }

        .backup-poster {
          position: relative;
          overflow: hidden;
          width: 82px;
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-md);
          background: #111420;
        }

        .backup-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text);
          font-size: 14px;
          font-weight: 900;
          line-height: 1.25;
        }

        .backup-meta {
          margin-top: var(--space-2);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
        }

        @media (max-width: 1060px) {
          .hero-card {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .poster-side {
            justify-items: center;
            align-content: start;
          }

          .hero-content {
            align-content: start;
          }

          .reasons-grid,
          .backups-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .hero-card,
          .backups-section {
            border-radius: var(--radius-xl);
          }

          .poster-shell,
          .poster-note {
            width: min(82vw, 300px);
          }

          .hero-title {
            font-size: clamp(42px, 14vw, 64px);
          }

          .reason-card {
            min-height: auto;
          }

          .backups-header {
            align-items: start;
            flex-direction: column;
          }

          .backup-card {
            grid-template-columns: 68px 1fr;
          }

          .backup-poster {
            width: 68px;
          }
        }
      `}</style>

      <motion.div
        className="hero-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="hero-backdrop" aria-hidden="true">
          <Image src={hero.posterUrl} alt="" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
        </div>

        <div className="poster-side">
          <div className="poster-shell">
            <Image
              src={hero.posterUrl}
              alt={`${hero.title} poster`}
              fill
              sizes="(max-width: 1060px) 82vw, 360px"
              style={{ objectFit: "cover", objectPosition: "center top" }}
              priority
            />
            <div className="match-badge">
              <Star size={14} fill="currentColor" />
              {confidencePercent}% match
            </div>
          </div>
          <p className="poster-note">
            This is the strongest fit from your session, with nearby alternatives saved below.
          </p>
        </div>

        <div className="hero-content">
          <div className="hero-label">
            <Sparkles size={15} />
            Your best watch tonight
          </div>

          <h2 className="hero-title">{hero.title}</h2>

          <div className="hero-meta">
            <span>{hero.year}</span>
            <span className="meta-dot" />
            <span>{runtimeLabel}</span>
            <span className="meta-dot" />
            <span>{hero.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}</span>
            <span>{hero.genres.slice(0, 3).join(" / ")}</span>
          </div>

          <p className="hero-synopsis">{hero.synopsis}</p>

          <div className="summary-text">{summary}</div>

          <div className="reasons-grid">
            {reasons.slice(0, 3).map((reason, index) => (
              <motion.div
                key={reason.label}
                className="reason-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.12 + index * 0.06 }}
              >
                <div className="reason-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="reason-label">{reason.label}</div>
                  <div className="reason-detail">{reason.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="cta-row">
            <button onClick={onRestart} className="btn btn-primary btn-lg" data-testid="start-over">
              <RotateCcw size={18} />
              Start a new read
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="backups-section"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.12 }}
      >
        <div className="backups-header">
          <div className="backups-title">
            <div className="section-label">Backup picks</div>
            <h3 className="backups-heading">Still in the same taste lane</h3>
          </div>
          <p className="backups-copy">Use these when the hero pick is unavailable or you want another angle.</p>
        </div>

        <div className="backups-grid">
          {backups.map((title, index) => (
            <motion.div
              key={title.id}
              className="backup-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.18 + index * 0.06 }}
            >
              <div className="backup-poster">
                <Image
                  src={title.posterUrl}
                  alt={`${title.title} poster`}
                  fill
                  sizes="82px"
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                />
              </div>
              <div>
                <div className="backup-title">
                  {title.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}
                  {title.title}
                </div>
                <div className="backup-meta">
                  {title.year} - {title.genres.slice(0, 3).join(" / ")}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
