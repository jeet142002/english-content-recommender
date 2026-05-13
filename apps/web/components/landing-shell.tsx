"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

import { PosterImage } from "@/components/poster-image";

type LandingShellProps = {
  onStart: () => void;
};

const posters = [
  "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
  "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
  "https://image.tmdb.org/t/p/w500/27vEYsRKaDCR1j6NqN8j2p1LSfa.jpg",
  "https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
  "https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9tBihxotX0Awh.jpg",
];

export function LandingShell({ onStart }: LandingShellProps) {
  return (
    <section className="landing-section">
      <style jsx>{`
        .landing-section {
          position: relative;
          overflow: hidden;
          display: grid;
          min-height: calc(100vh - 88px);
          align-items: center;
          padding: var(--space-8) 0 var(--space-12);
        }

        .landing-stage {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(320px, 0.72fr);
          gap: var(--space-12);
          align-items: center;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          display: grid;
          max-width: 700px;
          gap: var(--space-6);
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
          font-size: 92px;
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.93;
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
          padding-top: var(--space-3);
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
          height: 620px;
          align-items: center;
          justify-items: center;
          pointer-events: none;
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

        .swipe-hint {
          position: absolute;
          right: 38px;
          bottom: 82px;
          z-index: 7;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-full);
          background: rgba(7, 8, 13, 0.72);
          color: var(--text-soft);
          font-size: 12px;
          font-weight: 900;
          backdrop-filter: blur(18px);
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
            font-size: 72px;
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
          <div className="kicker">
            <Play size={14} fill="currentColor" />
            CineSwipe
          </div>

          <h1 className="hero-title">
            Stop scrolling.
            <span>Start watching.</span>
          </h1>

          <p className="subtitle">Swipe through a few titles. CineSwipe locks onto the one worth pressing play on.</p>

          <div className="cta-row">
            <button onClick={onStart} className="primary-cta" data-testid="landing-start">
              Start swiping
              <ArrowRight size={18} />
            </button>
            <span className="quick-note">No account. No quiz. Just momentum.</span>
          </div>
        </motion.div>

        <motion.div
          className="poster-field"
          aria-hidden="true"
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {posters.map((poster, index) => (
            <div
              key={poster}
              className="poster-card"
            >
              <motion.div
                className="poster-float"
                animate={{ y: index % 2 === 0 ? [0, -10, 0] : [0, 8, 0] }}
                transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
              >
                <PosterImage
                  src={poster}
                  alt=""
                  label={index === 0 ? "Tonight" : index === 1 ? "CineSwipe" : "Press play"}
                  sizes="300px"
                  priority={index < 2}
                />
              </motion.div>
            </div>
          ))}
          <div className="swipe-hint">Swipe the deck</div>
        </motion.div>
      </div>
    </section>
  );
}
