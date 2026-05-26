"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import type { LandingFeaturedTitle } from "@/lib/types";
import { getLandingPosters } from "@/lib/api-client";

import { PosterImage } from "@/components/poster-image";

type LandingShellProps = {
  onStart: () => void;
};


export function LandingShell({ onStart }: LandingShellProps) {

  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
  let cancelled = false;

  async function loadPosters() {
    try {
      const data = await getLandingPosters();

      if (!cancelled) {
        setPosters(data.posters);
      }
    } catch (error) {
      console.error("Failed to load landing posters", error);
    }
  }

  loadPosters();

  return () => {
    cancelled = true;
  };
}, []);

  //console.log(featuredTitle);

  return (
    <section className="landing-section">
      <style jsx>{`

        .landing-section {
          position: relative;
          display: grid;
          align-items: center;
        }

        .landing-stage {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
          gap: var(--space-12);
          align-items: center;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          max-width: 700px;
          gap: var(--space-7);
          display: flex;
          flex-direction: column;
        }

        .hero-message {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .hero-description-group {
          margin-top: 28px;
        }

        .hero-actions {
          margin-top: 34px;

          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .kicker {
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
          color: var(--text);
          font-size: 76px;
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.95;
          text-wrap: balance;
        }

        .hero-title span {
          display: block;
          color: var(--text-soft);
        }

        .subtitle {
          max-width: 520px;
          color: var(--text-secondary);
          font-size: 20px;
          font-weight: 600;
          line-height: 1.55;
          text-wrap: balance;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-4);
          // padding-top: var(--space-5);
        }

        .cta-note {
          color: var(--text-secondary);
          font-size: 15px;
          font-weight: 700;
        }

        .primary-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          min-height: 60px;
          padding: 0 var(--space-8);
          border-radius: var(--radius-full);
          background: #f7f3ea;
          color: #07080d;
          font-size: 16px;
          font-weight: 900;
          box-shadow: 0 18px 44px rgba(247, 243, 234, 0.16);
          transition:
            transform var(--transition-fast),
            box-shadow var(--transition-fast);
        }

        .primary-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 58px rgba(247, 243, 234, 0.24);
        }

        .quick-note {
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 800;
        }

        .poster-field {
          position: relative;
          display: grid;
          height: 420px;
          align-items: center;
          justify-items: center;
          pointer-events: none;
        }

        .poster-placeholder {
          display: grid;
          place-items: center;
          width: 100%;
          height: 420px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          font-size: 20px;
          font-weight: 800;
        }

        .queued-card {
          width: 340px;
          display: flex;
          flex-direction: column;
          gap: 14px;

          padding: 18px;

          border-radius: 28px;

          text-decoration: none;
          color: inherit;

          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);

          transition: all 0.25s ease;
        }

        .queued-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.18);
        }

        .queued-label {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--gold);
        }

        .queued-poster-wrap {
          overflow: hidden;
          border-radius: 18px;
        }

        .queued-content h3 {
          margin: 0;
          font-size: 22px;
        }

        .queued-content p {
          margin: 4px 0;
          color: var(--text-secondary);
        }

        .queued-content span {
          display: block;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .poster-card {
          position: absolute;
          overflow: hidden;
          width: 260px;
          aspect-ratio: 2 / 3;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: var(--radius-sm);
          background: #11141e;
          box-shadow: 0 26px 70px rgba(0, 0, 0, 0.45);
        }

        .poster-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 54%, rgba(7, 8, 13, 0.82));
          pointer-events: none;
        }

        .poster-float {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .poster-card:nth-child(1) {
          z-index: 4;
          transform: translate(-96px, 12px) rotate(-7deg);
        }

        .poster-card:nth-child(2) {
          z-index: 5;
          width: 300px;
          transform: translate(18px, -10px) rotate(3deg);
        }

        .poster-card:nth-child(3) {
          z-index: 3;
          transform: translate(118px, 72px) rotate(9deg);
        }

        .poster-card:nth-child(4) {
          z-index: 2;
          width: 226px;
          transform: translate(140px, -142px) rotate(13deg);
          opacity: 0.72;
        }

        .poster-card:nth-child(5) {
          z-index: 1;
          width: 220px;
          transform: translate(-130px, -154px) rotate(-13deg);
          opacity: 0.66;
        }
        
        .poster-stack {
          position: relative;
          width: 100%;
          max-width: 420px;
          height: 420px;
          margin: 0 auto;
        }

        .queued-pill {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;

          padding: 10px 18px;
          border-radius: 999px;

          background: rgba(12, 18, 30, 0.85);
          border: 1px solid rgba(255,255,255,0.08);

          color: rgba(255,255,255,0.92);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;

          backdrop-filter: blur(12px);
        }

        .stack-poster {
          position: absolute;
          width: 190px;
          aspect-ratio: 2 / 3;

          overflow: hidden;
          border-radius: 20px;

          border: 1px solid rgba(255,255,255,0.08);

          box-shadow:
            0 30px 60px rgba(0,0,0,0.45);
        }

        .stack-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .stack-poster-0 {
          left: 40px;
          top: 110px;
          transform: rotate(-12deg);
          z-index: 1;
          opacity: 0.75;
        }

        .stack-poster-1 {
          left: 145px;
          top: 65px;
          transform: rotate(8deg);
          z-index: 3;
          opacity: 1;
        }

        .stack-poster-2 {
          left: 250px;
          top: 120px;
          transform: rotate(-3deg);
          z-index: 2;
          opacity: 0.75;
        }



        @media (max-width: 980px) {
          .landing-stage {
            grid-template-columns: 1fr;
            gap: var(--space-6);
          }

          .hero-copy {
            justify-items: center;
            max-width: none;
            text-align: center;
          }

          .hero-title {
            font-size: 60px;
          }

          .subtitle {
            max-width: 560px;
          }

          .poster-field {
            height: 430px;
            order: -1;
            transform: scale(0.82);
          }
        }

        @media (max-width: 620px) {
          .landing-section {
            min-height: calc(100vh - 78px);
            align-items: start;
            padding-top: var(--space-3);
          }

          .hero-copy {
            gap: var(--space-5);
          }

          .hero-title {
            font-size: 48px;
            line-height: 0.98;
          }

          .subtitle {
            font-size: 16px;
          }

          .cta-row,
          .primary-cta {
            width: 100%;
          }

          .quick-note {
            width: 100%;
            text-align: center;
          }

          .poster-field {
            height: 340px;
            transform: scale(0.64);
            transform-origin: center top;
          }
        }
      `}</style>

      <div className="landing-stage">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
        >

          <div className="hero-message">
            <div className="kicker">
              <Play size={14} fill="currentColor" />
              CineSwipe
            </div>

            <h1 className="hero-title">
              Stop scrolling.
              <span>Start watching.</span>
            </h1>

          </div>

          <div className="hero-description-group">

            <p className="subtitle">
              Swipe through a few titles. CineSwipe locks onto the one worth pressing play on.
            </p>

          </div>

          <div className="hero-actions">

            <div className="cta-row">
              <button
                onClick={onStart}
                className="primary-cta"
                data-testid="landing-start"
              >
                Start swiping
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="cta-note">
              <span className="quick-note">
                No signup • No setup • 30 seconds
              </span>
            </div>

          </div>
        </motion.div>

        <div className="poster-stack">
          <div className="queued-pill">Queued Up</div>

          {posters.map((poster, index) => (
            <div
              key={index}
              className={`stack-poster stack-poster-${index}`}
            >
              <img src={poster} alt="" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
