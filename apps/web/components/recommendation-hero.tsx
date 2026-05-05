"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles, RotateCcw, Star, Film, Tv, CheckCircle2 } from "lucide-react";

import type { RecommendationResult } from "@/lib/types";

type RecommendationHeroProps = {
  recommendation: RecommendationResult;
  onRestart: () => void;
};

export function RecommendationHero({ recommendation, onRestart }: RecommendationHeroProps) {
  const { hero, backups, reasons, confidence, summary } = recommendation;

  return (
    <motion.section 
      className="recommendation-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <style jsx>{`
        .recommendation-section {
          display: grid;
          gap: var(--space-6);
          margin-top: var(--space-6);
        }
        
        .hero-card {
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          display: grid;
          grid-template-columns: 340px minmax(0, 1fr);
          gap: var(--space-6);
        }
        
        @media (max-width: 900px) {
          .hero-card {
            grid-template-columns: 1fr;
          }
        }
        
        .hero-poster {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-lg);
          min-height: 500px;
          background: var(--surface);
        }
        
        .hero-poster img {
          transition: transform var(--transition-slow);
        }
        
        .hero-poster:hover img {
          transform: scale(1.02);
        }
        
        .confidence-badge {
          position: absolute;
          top: var(--space-4);
          left: var(--space-4);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          background: var(--accent);
          color: white;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(139, 124, 255, 0.4);
        }
        
        .hero-content {
          display: grid;
          gap: var(--space-5);
          align-content: start;
        }
        
        .hero-label {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
        }
        
        .hero-title {
          margin: 0;
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 15px;
        }
        
        .hero-synopsis {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 16px;
        }
        
        .reasons-container {
          display: grid;
          gap: var(--space-3);
        }
        
        .reason-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--line);
          transition: all var(--transition-fast);
        }
        
        .reason-card:hover {
          background: var(--surface-hover);
          border-color: var(--line-strong);
          transform: translateX(4px);
        }
        
        .reason-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--accent-soft);
          color: var(--accent);
          flex-shrink: 0;
        }
        
        .reason-content {
          display: grid;
          gap: var(--space-1);
        }
        
        .reason-label {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
        }
        
        .reason-detail {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 14px;
        }
        
        .summary-text {
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 15px;
          font-style: italic;
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--accent-soft);
          border-left: 3px solid var(--accent);
        }
        
        .backups-card {
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          display: grid;
          gap: var(--space-5);
        }
        
        .backups-header {
          display: grid;
          gap: var(--space-2);
        }
        
        .backups-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-4);
        }
        
        @media (max-width: 768px) {
          .backups-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .backup-card {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--line);
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        
        .backup-card:hover {
          background: var(--surface-hover);
          border-color: var(--line-strong);
          transform: translateY(-2px);
        }
        
        .backup-title {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: var(--space-2);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .backup-year {
          color: var(--text-secondary);
          font-weight: 400;
        }
        
        .backup-meta {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>

      <motion.div 
        className="hero-card glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="hero-poster">
          <Image 
            src={hero.posterUrl} 
            alt={hero.title} 
            fill 
            sizes="(max-width: 900px) 100vw, 340px" 
            style={{ objectFit: "cover" }}
            className="hero-poster-image"
            priority
          />
          <div className="confidence-badge">
            <Star size={14} fill="currentColor" />
            {Math.round(confidence * 100)}% match
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-label">
            <Sparkles size={14} />
            Best match for tonight
          </div>
          
          <h2 className="hero-title">{hero.title}</h2>
          
          <div className="hero-meta">
            {hero.year}
            <span className="meta-dot" />
            {hero.kind === "movie" ? `${hero.runtime} min` : `${hero.seasons} seasons`}
            <span className="meta-dot" />
            {hero.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}
            {hero.genres.join(" / ")}
          </div>
          
          <p className="hero-synopsis">{hero.synopsis}</p>
          
          <div className="reasons-container">
            {reasons.map((reason, index) => (
              <motion.div 
                key={reason.label} 
                className="reason-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <div className="reason-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div className="reason-content">
                  <div className="reason-label">{reason.label}</div>
                  <div className="reason-detail">{reason.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="summary-text">{summary}</div>
          
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <button onClick={onRestart} className="btn btn-primary btn-lg">
              <RotateCcw size={18} />
              Start over
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="backups-card glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="backups-header">
          <div className="section-label">Backup picks</div>
          <h3 className="section-title" style={{ fontSize: "24px" }}>If you want nearby alternatives</h3>
        </div>
        
        <div className="backups-grid">
          {backups.map((title, index) => (
            <motion.div 
              key={title.id} 
              className="backup-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <div className="backup-title">
                {title.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}
                {title.title}
                <span className="backup-year">({title.year})</span>
              </div>
              <div className="backup-meta">{title.genres.join(" · ")}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
