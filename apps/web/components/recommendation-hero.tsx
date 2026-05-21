"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ExternalLink, Film, RotateCcw, Sparkles, Star, Tv, X } from "lucide-react";

import { PosterImage } from "@/components/poster-image";
import type { RecommendationResult } from "@/lib/types";

type RecommendationHeroProps = {
  recommendation: RecommendationResult;
  onRestart: () => void;
};

export function RecommendationHero({ recommendation, onRestart }: RecommendationHeroProps) {
  const { hero, backups, reasons, summary } = recommendation;
  console.log(hero);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const runtimeLabel = hero.kind === "movie" ? `${hero.runtime} min` : `${hero.seasons ?? 0} seasons`;

  const normalizeProviderName = (provider: string) => {
    if (provider.includes("Amazon Prime")) return "Prime Video";
    if (provider.includes("Netflix")) return "Netflix";
    if (provider.includes("HBO")) return "HBO Max";
    if (provider.includes("Disney")) return "Disney+";
    if (provider.includes("Hulu")) return "Hulu";
    if (provider.includes("Apple TV")) return "Apple TV+";
    if (provider.includes("Peacock")) return "Peacock";

    return provider;
  };

  const deduplicatedProviders = Array.from(
    new Map(
      (hero.watchProviders ?? []).map((provider) => {
        const normalized = normalizeProviderName(provider);

        return [normalized, normalized];
      })
    ).values()
  );

  const visibleProviders = showAllProviders
    ? deduplicatedProviders
    : deduplicatedProviders.slice(0, 3);

  const tmdbUrl = `https://www.themoviedb.org/${hero.kind === "movie" ? "movie" : "tv"
    }/${hero.tmdbId}`;

  const formatTag = (value: string) =>
  value
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

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
          align-items: start;
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

        .poster-overlay {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;
          padding: 0;
          appearance: none;
          cursor: pointer;

          background: rgba(7, 8, 13, 0.18);

          opacity: 0;

          transition:
            opacity 0.28s ease,
            background 0.28s ease;

          z-index: 1;
        }

        .poster-shell:hover .poster-overlay {
          opacity: 1;
          background: rgba(7, 8, 13, 0.42);
        }

        .poster-play {
          display: grid;
          place-items: center;

          width: 78px;
          height: 78px;

          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 50%;

          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);

          color: white;

          font-size: 30px;

          transform: scale(0.92);

          transition:
            transform 0.28s ease,
            background 0.28s ease,
            border-color 0.28s ease;
        }

        .poster-shell:hover .poster-play {
          transform: scale(1);
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.32);
        }

        .trailer-modal {
          position: fixed;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          background: rgba(4, 5, 8, 0.82);
          backdrop-filter: blur(14px);

          z-index: 1000;

          animation: trailerFade 0.28s ease;
        }

        .trailer-dialog {
          position: relative;

          width: min(1100px, 100%);
          border-radius: 18px;

          overflow: hidden;

          background: #0b0e16;

          box-shadow:
            0 40px 120px rgba(0, 0, 0, 0.72);

          animation: trailerPop 0.32s ease;
        }

        .trailer-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
        }

        .trailer-frame iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .trailer-close {
          position: absolute;
          top: 16px;
          right: 16px;

          z-index: 2;

          display: grid;
          place-items: center;

          width: 42px;
          height: 42px;

          border: 0;
          border-radius: 50%;

          background: rgba(0, 0, 0, 0.58);

          color: white;

          cursor: pointer;

          backdrop-filter: blur(10px);

          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .trailer-close:hover {
          transform: scale(1.06);
          background: rgba(0, 0, 0, 0.78);
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

        .meta-link {
          display: inline-flex;
          align-items: center;

          color: inherit;
          text-decoration: none;

          transition:
            color 0.22s ease,
            opacity 0.22s ease,
            transform 0.22s ease,
            text-shadow 0.22s ease;
        }

        .meta-link:hover {
          color: rgba(255, 255, 255, 0.98);
          transform: translateY(-1px);

          text-shadow:
            0 0 12px rgba(255, 255, 255, 0.18);
        }

        .meta-link:visited,
        .meta-link:active,
        .meta-link:focus {
          color: inherit;
          text-decoration: none;
        }

        .meta-link:focus-visible {
          outline: 2px solid rgba(133, 205, 255, 0.7);
          outline-offset: 3px;
          border-radius: 6px;
        }

        // .hero-synopsis {
        //   display: -webkit-box;
        //   max-width: 700px;
        //   overflow: hidden;
        //   color: var(--text-soft);
        //   font-size: 17px;
        //   font-weight: 600;
        //   line-height: 1.65;
        //   -webkit-box-orient: vertical;
        //   -webkit-line-clamp: 3;
        // }

        .hero-synopsis-wrapper {
          max-width: 700px;
        }

        .hero-synopsis {
          position: relative;
          color: var(--text-soft);
          font-size: 17px;
          font-weight: 600;
          line-height: 1.65;

          transition:
            max-height 0.35s ease,
            opacity 0.25s ease;
        }

        .hero-synopsis.collapsed {
          display: -webkit-box;
          overflow: hidden;

          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;

          mask-image: linear-gradient(
            to bottom,
            black 72%,
            transparent 100%
          );
        }

        .hero-synopsis.expanded {
          display: block;
        }

        .hero-synopsis-toggle {
          margin-top: 6px;

          border: 0;
          padding: 0;

          background: transparent;

          color: var(--text);

          font-size: 14px;
          font-weight: 800;

          cursor: pointer;

          opacity: 0.82;

          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        .about-pick-panel {
          margin-top: 18px;

          width: fit-content;
          max-width: 620px;

          padding: 18px;

          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 14px;

          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(18px);
        }

        .about-pick-grid {
          display: grid;

          grid-template-columns:
            minmax(220px, 1fr)
            minmax(220px, 1fr);

          gap: 20px 28px;

          align-items: start;
        }
        
        .about-pick-title {
          margin-bottom: 16px;

          color: var(--text);

          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.02em;

          text-transform: uppercase;
        }

        .about-pick-item {
          margin-bottom: 18px;
        }

        .about-pick-item:last-child {
          margin-bottom: 0;
        }

        .about-pick-label {
          display: block;

          margin-bottom: 6px;

          color: var(--text-secondary);

          font-size: 12px;
          font-weight: 800;

          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .about-pick-value {
          color: var(--text);

          font-size: 14px;
          font-weight: 700;

          line-height: 1.6;
        }

        .about-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .about-chip {
          padding: 6px 12px;

          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px;

          background: rgba(255,255,255,0.05);

          color: rgba(255,255,255,0.92);

          font-size: 12px;
          font-weight: 700;
        }

        .hero-synopsis-toggle:hover {
          opacity: 1;
        }

        .hero-synopsis-toggle:active {
          transform: translateY(1px);
        }

        .summary-text {
          max-width: 720px;
          color: #d8fff7;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.55;
        }

        .providers-section {
          display: grid;
          gap: 10px;
          margin-top: 14px;
          margin-bottom: 18px;
        }

        .providers-label {
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .providers-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .provider-chip,
        .providers-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.9);
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          backdrop-filter: blur(14px);
          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease,
            box-shadow 0.22s ease,
            color 0.22s ease;
        }

        .provider-chip svg {
          opacity: 0.62;
          transition:
            opacity 0.22s ease,
            transform 0.22s ease;
        }

        .provider-chip:hover,
        .providers-toggle:hover {
          transform: translateY(-1px);
          border-color: rgba(133, 205, 255, 0.34);
          background: rgba(255, 255, 255, 0.1);
          box-shadow:
            0 8px 24px rgba(40, 120, 255, 0.12),
            0 0 0 1px rgba(133, 205, 255, 0.08);
        }

        .provider-chip:hover svg {
          opacity: 1;
          transform: translate(1px, -1px);
        }

        .providers-toggle {
          cursor: pointer;
        }

        .providers-toggle:focus-visible,
        .provider-chip:focus-visible {
          outline: 2px solid rgba(133, 205, 255, 0.7);
          outline-offset: 2px;
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

        .hero-title-link {
            text-decoration: none;
            color: inherit;
            display: inline-block;
          }

          .hero-title-link:hover .hero-title {
            opacity: 0.92;
          }

          .hero-title-link:visited,
          .hero-title-link:active,
          .hero-title-link:focus {
            color: inherit;
            text-decoration: none;
          }
          .backup-title-link {
              text-decoration: none;
              color: inherit;
              display: inline-block;
            }

            .backup-title-link:hover .backup-title {
              opacity: 0.92;
            }

            .backup-title-link:visited,
            .backup-title-link:active,
            .backup-title-link:focus {
              color: inherit;
              text-decoration: none;
            }
            .backup-title {
              transition: opacity 0.2s ease;
            }
            .hero-title {
              transition: opacity 0.2s ease;
            }

            @keyframes trailerFade {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            @keyframes trailerPop {
              from {
                opacity: 0;
                transform: scale(0.96) translateY(10px);
              }

              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
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

            {/* <div className="poster-overlay">
              <div className="poster-play">
                ▶
              </div>
            </div> */}

            {/* <button
              className="poster-overlay"
              onClick={() => setShowTrailer(true)}
              aria-label={`Watch trailer for ${hero.title}`}
            ></button> */}

            <button
              className="poster-overlay"
              onClick={() => setShowTrailer(true)}
              aria-label={`Watch trailer for ${hero.title}`}
            >
              <div className="poster-play">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>

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

            {/* <h2 className="hero-title">{hero.title}</h2> */}

            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(hero.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-title-link"
              title={`Search "${hero.title}" on Google`}
            >
              <h2 className="hero-title">{hero.title}</h2>
            </a>

            <div className="hero-meta">
              <span>{hero.year}</span>
              <span className="meta-dot" />
              <span>{runtimeLabel}</span>
              <span className="meta-dot" />
              <span>{hero.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}</span>
              <span>{hero.genres.slice(0, 3).join(" / ")}</span>

              {hero.tmdbRating ? (
                <>
                  <span className="meta-dot" />

                  <a
                    href={tmdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meta-link"
                    title={`View "${hero.title}" on TMDB`}
                  >
                    {hero.tmdbRating.toFixed(1)} TMDB
                  </a>
                </>
              ) : null}

              {hero.imdbUrl ? (
                <>
                  <span className="meta-dot" />

                  <a
                    href={hero.imdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meta-link"
                    title={`View "${hero.title}" on IMDb`}
                  >
                    IMDb
                  </a>
                </>
              ) : null}



            </div>

            {/* <p className="hero-synopsis">{hero.synopsis}</p> */}

            <div className="hero-synopsis-wrapper">

              <p
                className={`hero-synopsis ${
                  isSynopsisExpanded ? "expanded" : "collapsed"
                }`}
              >
                {hero.synopsis}
              </p>

              {isSynopsisExpanded && (
                <div className="about-pick-panel">

                  <div className="about-pick-title">
                    About this pick
                  </div>

                  {hero.director && (
                    <div className="about-pick-item">
                      <span className="about-pick-label">
                        {hero.kind === "movie"
                          ? "Directed by"
                          : "Created by"}
                      </span>

                      <span className="about-pick-value">
                        {hero.director}
                      </span>
                    </div>
                  )}

                  {hero.cast?.length ? (
                    <div className="about-pick-item">
                      <span className="about-pick-label">
                        Starring
                      </span>

                      <span className="about-pick-value">
                        {hero.cast.slice(0, 3).join(" • ")}
                      </span>
                    </div>
                  ) : null}

                  {hero.tone?.length ? (
                    <div className="about-pick-item">
                      <span className="about-pick-label">
                        Mood
                      </span>

                      <div className="about-chip-row">
                        {hero.tone.map((tone) => (
                          <span
                            key={tone}
                            className="about-chip"
                          >
                            {formatTag(tone)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {hero.style?.length ? (
                    <div className="about-pick-item">
                      <span className="about-pick-label">
                        Style
                      </span>

                      <div className="about-chip-row">
                        {hero.style.map((style) => (
                          <span
                            key={style}
                            className="about-chip"
                          >
                            {formatTag(style)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {hero.subgenres?.length ? (
                    <div className="about-pick-item">
                      <span className="about-pick-label">
                        Themes
                      </span>

                      <div className="about-chip-row">
                        {hero.subgenres.slice(0, 4).map((theme) => (
                          <span
                            key={theme}
                            className="about-chip"
                          >
                            {formatTag(theme)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                </div>
              )}

              <button
                type="button"
                className="hero-synopsis-toggle"
                onClick={() =>
                  setIsSynopsisExpanded((prev) => !prev)
                }
              >
                {isSynopsisExpanded
                  ? "show less"
                  : "...more"}
              </button>

            </div>

            {deduplicatedProviders.length > 0 && (
              <div className="providers-section">
                <div className="providers-label">
                  Stream on
                </div>

                <div className="providers-row">
                  {visibleProviders.map((provider) => (
                    <a
                      key={provider}
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        `${hero.title} ${provider}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="provider-chip"
                      title={`Search "${hero.title}" on ${provider}`}
                    >
                      <span>{provider}</span>

                      <ExternalLink size={13} />
                    </a>
                  ))}

                  {deduplicatedProviders.length > 3 && (
                    <button
                      type="button"
                      className="providers-toggle"
                      onClick={() =>
                        setShowAllProviders((prev) => !prev)
                      }
                    >
                      {showAllProviders
                        ? "Show less"
                        : `+${deduplicatedProviders.length - 3} more`}
                    </button>
                  )}
                </div>
              </div>
            )}

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

      {showTrailer && hero.trailerKey && (
        <div
          className="trailer-modal"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="trailer-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="trailer-close"
              onClick={() => setShowTrailer(false)}
              aria-label="Close trailer"
            >
              <X size={20} />
            </button>

            <div className="trailer-frame">
              <iframe
                src={`https://www.youtube.com/embed/${hero.trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${hero.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

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
                {/* <div className="backup-title">
                  {title.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}
                  {title.title}
                </div> */}

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(title.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="backup-title-link"
                  title={`Search "${title.title}" on Google`}
                >
                  <div className="backup-title">
                    {title.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}
                    {title.title}
                  </div>
                </a>

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
