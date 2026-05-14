"use client";

import { motion } from "framer-motion";
import { Check, Film, RotateCcw, Sparkles, Star, Tv } from "lucide-react";

import { PosterImage } from "@/components/poster-image";
import type { RecommendationResult } from "@/lib/types";

type RecommendationHeroProps = {
  recommendation: RecommendationResult;
  onRestart: () => void;
};

export function RecommendationHero({ recommendation, onRestart }: RecommendationHeroProps) {
  const { hero, backups, reasons, summary } = recommendation;
  const runtimeLabel = hero.kind === "movie" ? `${hero.runtime} min` : `${hero.seasons ?? 0} seasons`;

  return (
    <motion.section
      className="recommendation-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42 }}
    >
      <style jsx global>{`
        .recommendation-section {
          display: grid;
          gap: var(--space-5);
          padding: var(--space-4) 0 var(--space-8);
        }

        .hero-card {
          position: relative;
          overflow: hidden;
          display: grid;
          min-height: 720px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: var(--radius-sm);
          background: #0b0e16;
          box-shadow: 0 32px 90px rgba(0, 0, 0, 0.54);
        }

        .hero-backdrop {
          position: absolute;
          inset: 0;
          opacity: 0.8;
        }

        .hero-backdrop::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(7, 8, 13, 0.96) 0%, rgba(7, 8, 13, 0.5) 48%, rgba(7, 8, 13, 0.78) 100%),
            linear-gradient(180deg, rgba(7, 8, 13, 0.12) 0%, rgba(7, 8, 13, 0.96) 100%);
        }

        .hero-layout {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(250px, 360px) minmax(0, 1fr);
          gap: clamp(28px, 5%, 64px);
          align-items: end;
          padding: var(--space-8);
        }

        .poster-shell {
          position: relative;
          overflow: hidden;
          width: min(100%, 350px);
          aspect-ratio: 2 / 3;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: var(--radius-sm);
          background: #111420;
          box-shadow: 0 28px 78px rgba(0, 0, 0, 0.58);
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
          background: #f7f3ea;
          color: #07080d;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 18px 40px rgba(247, 243, 234, 0.18);
        }

        .hero-content {
          display: grid;
          align-content: end;
          gap: var(--space-4);
          min-width: 0;
          padding-bottom: var(--space-2);
        }

        .hero-label {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: var(--space-2);
          color: var(--gold);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .hero-title {
          max-width: 820px;
          color: var(--text);
          font-size: 78px;
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.94;
          text-wrap: balance;
        }

        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 850;
        }

        .hero-synopsis {
          display: -webkit-box;
          max-width: 700px;
          overflow: hidden;
          color: var(--text-soft);
          font-size: 17px;
          font-weight: 600;
          line-height: 1.65;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .summary-text {
          max-width: 720px;
          color: #d8fff7;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.55;
        }

        .reasons-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
          padding-top: var(--space-2);
        }

        .reason-card {
          display: grid;
          gap: var(--space-3);
          min-height: 136px;
          padding: var(--space-4);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-sm);
          background: rgba(7, 8, 13, 0.58);
          backdrop-filter: blur(18px);
        }

        .reason-icon {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border-radius: 50%;
          background: rgba(77, 212, 189, 0.16);
          color: var(--teal);
        }

        .reason-label {
          color: var(--text);
          font-size: 13px;
          font-weight: 900;
        }

        .reason-detail {
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
          padding-top: var(--space-2);
        }

        .backups-section {
          display: grid;
          gap: var(--space-4);
          padding: var(--space-5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.045);
        }

        .backups-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: var(--space-4);
        }

        .backups-heading {
          color: var(--text);
          font-size: 24px;
          font-weight: 900;
        }

        .backups-copy {
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 800;
        }

        .backups-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .backup-card {
          overflow: hidden;
          display: grid;
          grid-template-columns: 76px 1fr;
          gap: var(--space-3);
          align-items: center;
          padding: var(--space-3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
        }

        .backup-poster {
          position: relative;
          overflow: hidden;
          width: 76px;
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-sm);
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
          font-weight: 750;
          line-height: 1.5;
        }

        @media (max-width: 1060px) {
          .hero-layout {
            grid-template-columns: 1fr;
            align-items: start;
          }

          .poster-shell {
            width: min(70vw, 310px);
          }

          .hero-title {
            font-size: 58px;
          }

          .reasons-grid,
          .backups-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .hero-card {
            min-height: auto;
          }

          .hero-layout {
            gap: var(--space-5);
            padding: var(--space-4);
          }

          .poster-shell {
            width: min(72vw, 260px);
          }

          .hero-title {
            font-size: 40px;
            line-height: 1;
          }

          .hero-synopsis {
            font-size: 15px;
          }

          .reason-card {
            min-height: auto;
          }

          .backups-header {
            align-items: start;
            flex-direction: column;
          }

          .backup-card {
            grid-template-columns: 64px 1fr;
          }

          .backup-poster {
            width: 64px;
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
          <PosterImage src={hero.posterUrl} alt="" label={hero.title} sizes="100vw" priority showLabel={false} />
        </div>

        <div className="hero-layout">
          <motion.div
            className="poster-shell"
            initial={{ opacity: 0, y: 18, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.46, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <PosterImage
              src={hero.posterUrl}
              alt=""
              label={hero.title}
              sizes="(max-width: 680px) 72vw, (max-width: 1060px) 70vw, 350px"
              priority
            />
            <div className="match-badge">
              <Star size={14} fill="currentColor" />
              Top match
            </div>
          </motion.div>

          <div className="hero-content">
            <div className="hero-label">
              <Sparkles size={15} />
              Press play tonight
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
                    <Check size={16} />
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
                Start over
              </button>
            </div>
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
          <div>
            <div className="section-label">Shortlist</div>
            <h3 className="backups-heading">Also worth queueing</h3>
          </div>
          <p className="backups-copy">Nearby picks with the same pull.</p>
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
                <PosterImage
                  src={title.posterUrl}
                  alt=""
                  label={title.title}
                  sizes="76px"
                  showLabel={false}
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
