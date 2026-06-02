"use client";

import { motion, type PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { Eye, Heart, Info, Loader2, RotateCcw, ThumbsDown } from "lucide-react";

import { PosterImage } from "@/components/poster-image";
import type { FeedbackValue, SessionTitleResponse } from "@/lib/types";

type TitleCardProps = {
  payload: SessionTitleResponse;
  onFeedback: (value: FeedbackValue) => void;
  onStop: () => void;
  loading: boolean;
};

type DragIntent = FeedbackValue | null;

const actions: {
  value: FeedbackValue;
  label: string;
  icon: typeof Heart;
  variant: "like" | "dislike" | "skip";
}[] = [
  { value: "dislike", label: "Pass", icon: ThumbsDown, variant: "dislike" },
  { value: "not_seen", label: "Unseen", icon: Eye, variant: "skip" },
  { value: "like", label: "Lock in", icon: Heart, variant: "like" },
];

const SWIPE_X_THRESHOLD = 120;
const SWIPE_Y_THRESHOLD = 130;
const SWIPE_HINT_THRESHOLD = 36;

function resolveDragIntent(offsetX: number, offsetY: number): DragIntent {
  const horizontalStrength = Math.abs(offsetX) / SWIPE_X_THRESHOLD;
  const downwardStrength = Math.max(0, offsetY) / SWIPE_Y_THRESHOLD;

  if (horizontalStrength < SWIPE_HINT_THRESHOLD / SWIPE_X_THRESHOLD && downwardStrength < SWIPE_HINT_THRESHOLD / SWIPE_Y_THRESHOLD) {
    return null;
  }

  if (horizontalStrength >= downwardStrength) {
    return offsetX > 0 ? "like" : "dislike";
  }

  return offsetY > 0 ? "not_seen" : null;
}

export function TitleCard({ payload, onFeedback, onStop, loading }: TitleCardProps) {
  const { title, step } = payload;
  const runtimeLabel = title.kind === "movie" ? `${title.runtime} min` : `${title.seasons ?? 0} seasons`;
  const [dragIntent, setDragIntent] = useState<DragIntent>(null);
  const [dragStrength, setDragStrength] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-9, 9]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setDragIntent(null);
    setDragStrength(0);

    if (loading) {
      return;
    }

    if (info.offset.x > SWIPE_X_THRESHOLD) {
      onFeedback("like");
      return;
    }

    if (info.offset.x < -SWIPE_X_THRESHOLD) {
      onFeedback("dislike");
      return;
    }

    if (info.offset.y > SWIPE_Y_THRESHOLD) {
      onFeedback("not_seen");
    }
  }

  function handleDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const nextIntent = resolveDragIntent(info.offset.x, info.offset.y);
    const nextStrength = nextIntent === "like" || nextIntent === "dislike"
      ? Math.min(1, Math.abs(info.offset.x) / SWIPE_X_THRESHOLD)
      : nextIntent === "not_seen"
        ? Math.min(1, Math.max(0, info.offset.y) / SWIPE_Y_THRESHOLD)
        : 0;

    setDragIntent(nextIntent);
    setDragStrength(nextStrength);
  }

  return (
    <section className="deck-shell">
      <style jsx>{`
        .deck-shell {
          position: relative;
          display: grid;
          min-height: calc(100vh - 116px);
          place-items: center;
          padding: var(--space-4) 0 var(--space-8);
        }

        .deck-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: grid;
          width: min(100%, 980px);
          min-height: 700px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: var(--radius-sm);
          background: #0b0e16;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.54);
          touch-action: pan-y;
          user-select: none;
        }

        .deck-card.intent-like {
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.54),
            0 0 0 1px rgba(43, 214, 111, 0.24),
            0 0 0 10px rgba(43, 214, 111, 0.06);
        }

        .deck-card.intent-dislike {
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.54),
            0 0 0 1px rgba(255, 77, 93, 0.24),
            0 0 0 10px rgba(255, 77, 93, 0.06);
        }

        .deck-card.intent-not_seen {
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.54),
            0 0 0 1px rgba(97, 181, 255, 0.24),
            0 0 0 10px rgba(97, 181, 255, 0.07);
        }

        .deck-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            radial-gradient(ellipse 78% 56% at 34% 68%, rgba(7, 8, 13, 0.86) 0%, rgba(7, 8, 13, 0.62) 34%, rgba(7, 8, 13, 0.18) 62%, transparent 100%),
            linear-gradient(180deg, rgba(7, 8, 13, 0.78) 0%, rgba(7, 8, 13, 0.16) 22%, rgba(7, 8, 13, 0.1) 48%, rgba(7, 8, 13, 0.86) 100%),
            linear-gradient(90deg, rgba(7, 8, 13, 0.7) 0%, rgba(7, 8, 13, 0.24) 42%, rgba(7, 8, 13, 0.48) 100%);
        }

        .backdrop,
        .backdrop img {
          position: absolute;
          inset: 0;
        }

        .backdrop {
          z-index: 0;
          opacity: 0.44;
          filter: blur(24px) saturate(120%);
          transform: scale(1.08);
        }

        .backdrop::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(7, 8, 13, 0.82) 0%, rgba(7, 8, 13, 0.46) 45%, rgba(7, 8, 13, 0.72) 100%),
            linear-gradient(180deg, rgba(7, 8, 13, 0.4) 0%, rgba(7, 8, 13, 0.28) 34%, rgba(7, 8, 13, 0.82) 100%);
        }

        .poster-focus {
          position: absolute;
          top: 50%;
          right: clamp(24px, 5vw, 56px);
          overflow: hidden;
          width: clamp(220px, 30vw, 330px);
          aspect-ratio: 2 / 3;
          z-index: 3;
          transform: translateY(-52%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: var(--radius-sm);
          background: #10131d;
          box-shadow: 0 28px 78px rgba(0, 0, 0, 0.58);
        }

        .topbar {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-5);
        }

        .swipe-indicator {
          position: absolute;
          z-index: 4;
          display: grid;
          gap: 4px;
          min-width: 142px;
          padding: 12px 16px;
          border: 2px solid currentColor;
          border-radius: var(--radius-sm);
          background: rgba(7, 8, 13, 0.78);
          backdrop-filter: blur(14px);
          text-transform: uppercase;
          pointer-events: none;
          opacity: 0;
        }

        .swipe-indicator.like {
          top: var(--space-5);
          left: var(--space-5);
          color: #77f0a7;
          transform: rotate(-8deg);
        }

        .swipe-indicator.dislike {
          top: var(--space-5);
          right: var(--space-5);
          color: #ff9cab;
          transform: rotate(8deg);
          text-align: right;
        }

        .swipe-indicator.not_seen {
          bottom: 104px;
          left: 50%;
          color: #83c4ff;
          text-align: center;
          transform: translateX(-50%);
        }

        .indicator-label {
          font-size: 26px;
          font-weight: 950;
          letter-spacing: 0.04em;
          line-height: 0.94;
        }

        .indicator-copy {
          color: rgba(247, 243, 234, 0.88);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .scene-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: var(--radius-full);
          background: rgba(7, 8, 13, 0.52);
          color: var(--text-soft);
          font-size: 12px;
          font-weight: 900;
          backdrop-filter: blur(16px);
        }

        .pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--teal);
          box-shadow: 0 0 0 0 rgba(77, 212, 189, 0.42);
          animation: pulse 1.8s infinite;
        }

        .stop-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-height: 42px;
          padding: 0 var(--space-4);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: var(--radius-full);
          background: rgba(7, 8, 13, 0.52);
          color: var(--text);
          font-size: 13px;
          font-weight: 900;
          backdrop-filter: blur(16px);
          transition:
            transform var(--transition-fast),
            background var(--transition-fast),
            border-color var(--transition-fast);
        }

        .stop-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(246, 196, 107, 0.44);
          background: rgba(246, 196, 107, 0.16);
        }

        .copy-stack {
          position: relative;
          z-index: 3;
          align-self: end;
          display: grid;
          max-width: min(620px, calc(100% - clamp(260px, 38vw, 410px)));
          gap: var(--space-3);
          padding: var(--space-5) var(--space-5) 116px;
        }

        .copy-stack::before {
          content: "";
          position: absolute;
          inset: -20px -28px 82px -28px;
          z-index: -1;
          border-radius: var(--radius-lg);
          background:
            radial-gradient(ellipse at 28% 45%, rgba(7, 8, 13, 0.78) 0%, rgba(7, 8, 13, 0.58) 42%, rgba(7, 8, 13, 0.08) 74%, transparent 100%),
            linear-gradient(90deg, rgba(7, 8, 13, 0.66) 0%, rgba(7, 8, 13, 0.42) 58%, transparent 100%);
          filter: blur(0.2px);
          pointer-events: none;
        }

        .title-text {
          color: var(--text);
          font-size: 64px;
          font-weight: 900;
          letter-spacing: 0;
          line-height: 0.96;
          text-shadow:
            0 2px 22px rgba(0, 0, 0, 0.78),
            0 1px 2px rgba(0, 0, 0, 0.72);
          text-wrap: balance;
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 850;
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.72);
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          padding-top: var(--space-1);
        }

        // .synopsis {
        //   display: -webkit-box;
        //   max-width: 620px;
        //   overflow: hidden;
        //   color: var(--text-soft);
        //   font-size: 16px;
        //   font-weight: 600;
        //   line-height: 1.55;
        //   text-shadow: 0 1px 14px rgba(0, 0, 0, 0.78);
        //   -webkit-box-orient: vertical;
        //   -webkit-line-clamp: 2;
        // }

        .synopsis {
          display: -webkit-box;
          position: relative;
          max-width: 620px;
          overflow: hidden;
          color: var(--text-soft);
          font-size: 16px;
          font-weight: 600;
          line-height: 1.55;
          text-shadow: 0 1px 14px rgba(0, 0, 0, 0.78);
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .synopsis::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: 0;

          width: 35%;
          height: 1.6em;

          background: linear-gradient(
            to right,
            rgba(7, 8, 13, 0),
            rgba(7, 8, 13, 0.92)
          );

          pointer-events: none;
        }

        .details {
          width: fit-content;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 800;
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.7);
        }

        //.details summary {
        //   display: inline-flex;
        //   align-items: center;
        //   gap: var(--space-2);
        //   cursor: pointer;
        //   list-style: none;
        // }

        .details summary {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          list-style: none;
          transition:
            opacity 0.22s ease,
            transform 0.22s ease;
        }

        .details summary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .details summary::-webkit-details-marker {
          display: none;
        }

        // .details-panel {
        //   display: grid;
        //   max-width: 620px;
        //   gap: var(--space-2);
        //   margin-top: var(--space-3);
        //   padding: var(--space-3);
        //   border: 1px solid rgba(255, 255, 255, 0.12);
        //   border-radius: var(--radius-sm);
        //   background: rgba(7, 8, 13, 0.64);
        //   color: var(--text-soft);
        //   backdrop-filter: blur(16px);
        // }

        .details-panel {
          display: grid;
          max-width: 620px;
          gap: var(--space-4);
          margin-top: var(--space-3);
          padding: var(--space-4);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-sm);
          background: rgba(7, 8, 13, 0.64);
          color: var(--text-soft);
          backdrop-filter: blur(16px);
          animation: detailsReveal 0.28s ease;
        }

        .details-section {
          display: grid;
          gap: 6px;
        }

        .details-heading {
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .details-copy {
          color: var(--text-soft);
          line-height: 1.65;
          font-size: 14px;
        }

        .action-dock {
          position: absolute;
          right: auto;
          bottom: var(--space-5);
          left: 50%;
          z-index: 5;
          display: flex;
          width: fit-content;
          max-width: calc(100% - (var(--space-5) * 2));
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-3) var(--space-4) var(--space-2);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: var(--radius-full);
          background:
            radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.12), transparent 64%),
            rgba(7, 8, 13, 0.78);
          box-shadow:
            0 18px 48px rgba(0, 0, 0, 0.46),
            0 0 0 1px rgba(0, 0, 0, 0.22);
          transform: translateX(-50%);
          backdrop-filter: blur(22px) saturate(145%);
        }

        .action-wrap {
          display: grid;
          justify-items: center;
          gap: var(--space-2);
        }

        .action-button {
          display: grid;
          width: 68px;
          height: 68px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 50%;
          background: rgba(12, 14, 22, 0.88);
          color: var(--text);
          box-shadow:
            0 18px 36px rgba(0, 0, 0, 0.38),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.04);
        }

        .action-button.dislike:hover:not(:disabled) {
          border-color: rgba(255, 77, 93, 0.62);
          color: #ff9cab;
          box-shadow: 0 20px 42px rgba(255, 77, 93, 0.17);
        }

        .action-button.skip:hover:not(:disabled) {
          border-color: rgba(143, 123, 255, 0.62);
          color: var(--accent-strong);
          box-shadow: 0 20px 42px rgba(143, 123, 255, 0.18);
        }

        .action-button.like:hover:not(:disabled) {
          border-color: rgba(43, 214, 111, 0.62);
          color: #77f0a7;
          box-shadow: 0 20px 42px rgba(43, 214, 111, 0.18);
        }

        .action-label {
          color: var(--text);
          font-size: 12px;
          font-weight: 900;
          text-shadow:
            0 1px 10px rgba(0, 0, 0, 0.9),
            0 1px 2px rgba(0, 0, 0, 0.9);
        }

        .shortcut-note {
          position: absolute;
          left: 50%;
          bottom: calc(var(--space-5) + 94px);
          z-index: 5;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-full);
          background: rgba(7, 8, 13, 0.58);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.02em;
          transform: translateX(-50%);
          backdrop-filter: blur(14px);
        }

        @keyframes detailsReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          70% {
            box-shadow: 0 0 0 12px rgba(77, 212, 189, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(77, 212, 189, 0);
          }
        }

        @media (max-width: 980px) {
          .deck-card {
            min-height: 720px;
          }

          .deck-card::before {
            background:
              radial-gradient(ellipse 86% 58% at 34% 70%, rgba(7, 8, 13, 0.88) 0%, rgba(7, 8, 13, 0.64) 38%, rgba(7, 8, 13, 0.18) 68%, transparent 100%),
              linear-gradient(180deg, rgba(7, 8, 13, 0.78) 0%, rgba(7, 8, 13, 0.12) 30%, rgba(7, 8, 13, 0.88) 100%);
          }

          .poster-focus {
            top: 42%;
            right: 50%;
            width: min(58vw, 320px);
            transform: translate(50%, -56%);
          }

          .copy-stack {
            max-width: 100%;
          }

          .title-text {
            font-size: 50px;
          }
        }

        @media (max-width: 640px) {
          .deck-shell {
            min-height: calc(100vh - 94px);
            padding-top: 0;
          }

          .deck-card {
            min-height: min(760px, calc(100vh - 110px));
          }

          .topbar {
            padding: var(--space-3);
          }

          .swipe-indicator {
            min-width: 122px;
            padding: 10px 12px;
          }

          .swipe-indicator.like,
          .swipe-indicator.dislike {
            top: var(--space-3);
          }

          .indicator-label {
            font-size: 21px;
          }

          .scene-pill {
            font-size: 11px;
          }

          .stop-button {
            min-height: 38px;
            padding: 0 var(--space-3);
            font-size: 12px;
          }

          .poster-focus {
            top: 38%;
            width: min(68vw, 280px);
            transform: translate(50%, -56%);
          }

          .copy-stack {
            gap: var(--space-2);
            padding: var(--space-4) var(--space-4) 104px;
          }

          .copy-stack::before {
            inset: -18px -18px 74px -18px;
            background:
              radial-gradient(ellipse at 34% 48%, rgba(7, 8, 13, 0.8) 0%, rgba(7, 8, 13, 0.62) 48%, rgba(7, 8, 13, 0.1) 78%, transparent 100%),
              linear-gradient(180deg, transparent 0%, rgba(7, 8, 13, 0.52) 34%, rgba(7, 8, 13, 0.68) 100%);
          }

          .title-text {
            font-size: 34px;
            line-height: 1;
          }

          .synopsis {
            font-size: 14px;
          }

          .action-dock {
            gap: var(--space-3);
            bottom: var(--space-4);
            padding: var(--space-2) var(--space-3);
          }

          .shortcut-note {
            bottom: calc(var(--space-4) + 84px);
            width: calc(100% - 32px);
            text-align: center;
          }

          .action-button {
            width: 58px;
            height: 58px;
          }
        }
      `}</style>

      <motion.article
        className={`deck-card${dragIntent ? ` intent-${dragIntent}` : ""}`}
        drag={loading ? false : true}
        style={{ x, y, rotate }}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.18}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.985 }}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 80, rotate: 5, scale: 0.96 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="swipe-indicator like"
          aria-hidden="true"
          animate={{
            opacity: dragIntent === "like" ? 0.32 + dragStrength * 0.68 : 0,
            scale: dragIntent === "like" ? 0.94 + dragStrength * 0.06 : 0.88,
          }}
        >
          <div className="indicator-label">LIKE</div>
          <div className="indicator-copy">Swipe right to lock it in</div>
        </motion.div>

        <motion.div
          className="swipe-indicator dislike"
          aria-hidden="true"
          animate={{
            opacity: dragIntent === "dislike" ? 0.32 + dragStrength * 0.68 : 0,
            scale: dragIntent === "dislike" ? 0.94 + dragStrength * 0.06 : 0.88,
          }}
        >
          <div className="indicator-label">PASS</div>
          <div className="indicator-copy">Swipe left to skip it</div>
        </motion.div>

        <motion.div
          className="swipe-indicator not_seen"
          aria-hidden="true"
          animate={{
            opacity: dragIntent === "not_seen" ? 0.32 + dragStrength * 0.68 : 0,
            scale: dragIntent === "not_seen" ? 0.94 + dragStrength * 0.06 : 0.88,
          }}
        >
          <div className="indicator-label">UNSEEN</div>
          <div className="indicator-copy">Swipe down if you have not seen it</div>
        </motion.div>

        <div className="backdrop" aria-hidden="true">
          <PosterImage
            src={title.posterUrl}
            alt=""
            label={title.title}
            sizes="100vw"
            priority
            objectPosition="center center"
            showLabel={false}
          />
        </div>

        <motion.div
          className="poster-focus"
          aria-hidden="true"
          initial={{ y: 12, rotate: -1.5 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <PosterImage
            src={title.posterUrl}
            alt=""
            label={title.title}
            sizes="(max-width: 640px) 68vw, (max-width: 980px) 58vw, 360px"
            priority
            objectFit="contain"
            objectPosition="center center"
            showLabel={false}
          />
        </motion.div>

        <div className="topbar">
          <div className="scene-pill">
            <span className="pulse" aria-hidden="true" />
            Scene {step}
          </div>
          <button onClick={onStop} disabled={loading} className="stop-button" data-testid="stop-and-recommend">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
            Reveal pick
          </button>
        </div>

        <div className="copy-stack">
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

          <div className="tags-container">
            {title.genres.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
            {title.tone.slice(0, 2).map((tag) => (
              <span key={tag} className="tag tag-accent">
                {tag}
              </span>
            ))}
          </div>

          <p className="synopsis">{title.synopsis}</p>

          {/* <details className="details">
            <summary>
              <Info size={14} />
              Details
            </summary>
            <div className="details-panel">
              <div>{title.cast.slice(0, 4).join(", ")}</div>
              <div>{title.style.slice(0, 3).join(" / ")}</div>
            </div>
          </details> */}

            <details
              className="details"
              onToggle={(e) => {
                const summary = e.currentTarget.querySelector("summary span");

                if (summary) {
                  summary.textContent = e.currentTarget.open
                    ? "Hide details"
                    : "Details";
                }
              }}
            >
              <summary>
                <Info size={14} />
                <span>Details</span>
              </summary>

              <div className="details-panel">
                <div className="details-section">
                  <div className="details-heading">Synopsis</div>

                  <div className="details-copy">
                    {title.synopsis}
                  </div>
                </div>

                <div className="details-section">
                  <div className="details-heading">Cast</div>

                  <div className="details-copy">
                    {title.cast.slice(0, 4).join(", ")}
                  </div>
                </div>

                <div className="details-section">
                  <div className="details-heading">Style</div>

                  <div className="details-copy">
                    {title.style.slice(0, 3).join(" / ")}
                  </div>
                </div>
              </div>
          </details>

        </div>

        <div className="shortcut-note">Swipe or use arrows: left pass, down unseen, right like.</div>

        <div className="action-dock">
          {actions.map((action) => (
            <div key={action.value} className="action-wrap">
              <motion.button
                type="button"
                onClick={() => onFeedback(action.value)}
                disabled={loading}
                className={`action-button ${action.variant}`}
                data-testid={`feedback-${action.value}`}
                aria-label={action.label}
                title={action.label}
                whileTap={{ scale: 0.92 }}
              >
                {loading ? <Loader2 size={22} className="animate-spin" /> : <action.icon size={24} />}
              </motion.button>
              <div className="action-label">{action.label}</div>
            </div>
          ))}
        </div>
      </motion.article>
    </section>
  );
}
