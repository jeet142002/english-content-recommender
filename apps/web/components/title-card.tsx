"use client";

import { motion, type PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Film, Heart, Loader2, Play, RotateCcw, ThumbsDown, Tv, X } from "lucide-react";

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

  if (
    horizontalStrength < SWIPE_HINT_THRESHOLD / SWIPE_X_THRESHOLD &&
    downwardStrength < SWIPE_HINT_THRESHOLD / SWIPE_Y_THRESHOLD
  ) {
    return null;
  }

  if (horizontalStrength >= downwardStrength) {
    return offsetX > 0 ? "like" : "dislike";
  }

  return offsetY > 0 ? "not_seen" : null;
}

function formatTag(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function TitleCard({ payload, onFeedback, onStop, loading }: TitleCardProps) {
  const { title, step } = payload;
  const runtimeLabel = title.kind === "movie" ? `${title.runtime} min` : `${title.seasons ?? 0} seasons`;
  const [dragIntent, setDragIntent] = useState<DragIntent>(null);
  const [dragStrength, setDragStrength] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-7, 7]);
  const synopsisRef = useRef<HTMLParagraphElement>(null);
  const [showSynopsisButton, setShowSynopsisButton] = useState(false);

  const decisionTags = useMemo(
    () => [
      ...title.genres.slice(0, 2),
      ...title.tone.slice(0, 1).map(formatTag),
    ].slice(0, 3),
    [title.genres, title.tone]
  );

  useEffect(() => {
  const timeout = setTimeout(() => {
    const el = synopsisRef.current;

    if (!el) return;

    setShowSynopsisButton(
      el.scrollHeight > el.clientHeight + 1
    );
  }, 0);

  return () => clearTimeout(timeout);
}, [title.synopsis]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setDragIntent(null);
    setDragStrength(0);

    if (loading || showTrailer || showSynopsis) {
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
    const nextStrength =
      nextIntent === "like" || nextIntent === "dislike"
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
          display: flex;
          flex: 1 1 auto;
          align-items: stretch;
          justify-content: center;
          width: 100%;
          max-width: 100%;
          min-height: 0;
          padding: 0;
          overflow-x: clip;
        }

        .deck-card-motion {
          width: 100%;
          max-width: 100%;
          min-height: 0;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          touch-action: none;
          user-select: none;
        }

        .deck-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          min-height: 0;
          flex: 1 1 auto;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: #090c14;
          box-shadow: 0 32px 96px rgba(0, 0, 0, 0.56);
        }

        .deck-card.intent-like {
          box-shadow:
            0 32px 96px rgba(0, 0, 0, 0.56),
            0 0 0 1px rgba(43, 214, 111, 0.2),
            0 0 0 10px rgba(43, 214, 111, 0.05);
        }

        .deck-card.intent-dislike {
          box-shadow:
            0 32px 96px rgba(0, 0, 0, 0.56),
            0 0 0 1px rgba(255, 77, 93, 0.2),
            0 0 0 10px rgba(255, 77, 93, 0.05);
        }

        .deck-card.intent-not_seen {
          box-shadow:
            0 32px 96px rgba(0, 0, 0, 0.56),
            0 0 0 1px rgba(97, 181, 255, 0.2),
            0 0 0 10px rgba(97, 181, 255, 0.05);
        }

        .deck-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(6, 8, 13, 0.22) 0%, rgba(6, 8, 13, 0.58) 100%),
            radial-gradient(circle at 18% 24%, rgba(255, 255, 255, 0.08), transparent 32%);
        }

        .backdrop,
        .backdrop img {
          position: absolute;
          inset: 0;
        }

        .backdrop {
          z-index: 0;
          opacity: 0.5;
          filter: blur(26px) saturate(118%);
          transform: scale(1.08);
        }

        .backdrop::after {
          content: "";
          //position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(8, 10, 17, 0.98) 0%, rgba(8, 10, 17, 0.82) 34%, rgba(8, 10, 17, 0.34) 64%, rgba(8, 10, 17, 0.86) 100%),
            linear-gradient(180deg, rgba(8, 10, 17, 0.12) 0%, rgba(8, 10, 17, 0.88) 100%);
        }

        .card-grid {
          position: relative;
          z-index: 2;
          display: grid;
          flex: 1 1 auto;
          grid-template-columns: minmax(0, 1fr) minmax(200px, 260px);
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px 20px;
          min-height: 0;
          overflow: hidden;
          padding: 10px 16px 8px;
        }

        .topbar {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
        }

        .scene-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(9, 12, 20, 0.52);
          color: var(--text-soft);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          backdrop-filter: blur(14px);
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
          gap: 8px;
          min-height: 36px;
          padding: 0 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(9, 12, 20, 0.52);
          color: var(--text);
          font-size: 13px;
          font-weight: 900;
          backdrop-filter: blur(14px);
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast);
        }

        .stop-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(246, 196, 107, 0.38);
          background: rgba(246, 196, 107, 0.12);
        }

        .copy-column {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          min-height: 0;
        }

        .synopsis-block {
          display: grid;
          gap: 6px;
          flex-shrink: 0;
        }

        .eyebrow {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(247, 243, 234, 0.82);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .title-link {
          display: inline-block;
          width: fit-content;
          max-width: 100%;
          color: inherit;
          text-decoration: none;
        }

        .title-link:visited,
        .title-link:active,
        .title-link:focus {
          color: inherit;
          text-decoration: none;
        }

        .title-link:focus-visible {
          outline: 2px solid rgba(133, 205, 255, 0.72);
          outline-offset: 8px;
          border-radius: 14px;
        }

        .title-text {
          color: var(--text);
          font-size: clamp(26px, 3vw, 40px);
          font-weight: 900;
          line-height: 0.96;
          letter-spacing: -0.02em;
          text-wrap: balance;
          text-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
          transition: opacity 0.2s ease;
          flex-shrink: 0;
        }

        .title-link:hover .title-text {
          opacity: 0.92;
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          color: rgba(247, 243, 234, 0.76);
          font-size: 12px;
          font-weight: 800;
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.68);
          flex-shrink: 0;
        }

        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 28px;
          padding: 0 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
        }

        .rating-chip {
          color: #f7f3ea;
        }

        .decision-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          flex-shrink: 0;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(247, 243, 234, 0.92);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .tag-accent {
          background: rgba(77, 212, 189, 0.12);
          color: #d8fff7;
        }

        .hook {
          display: -webkit-box;
          max-width: 58ch;
          overflow: hidden;
          color: rgba(247, 243, 234, 0.9);
          font-size: 13px;
          font-weight: 650;
          line-height: 1.4;
          letter-spacing: -0.01em;
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.64);
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          flex-shrink: 0;
          min-height: calc(1.4em * 3);
        }

        .copy-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .supporting-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          max-width: 100%;
          flex-shrink: 0;
        }

        .support-card {
          display: grid;
          gap: 4px;
          min-height: 58px;
          padding: 9px 11px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
        }

        .support-label {
          color: rgba(247, 243, 234, 0.58);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .support-value {
          display: -webkit-box;
          overflow: hidden;
          color: var(--text);
          font-size: 12px;
          font-weight: 750;
          line-height: 1.38;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast);
        }

        .secondary-button:hover {
          transform: translateY(-1px);
          border-color: rgba(133, 205, 255, 0.36);
          background: rgba(255, 255, 255, 0.09);
        }

        .poster-column {
          position: relative;
          display: flex;
          align-items: stretch;
          justify-content: flex-end;
          min-height: 0;
          height: 100%;
        }

        :global(.poster-motion) {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          width: 100%;
          height: 100%;
          max-height: 100%;
        }

        .poster-frame {
          position: relative;
          overflow: hidden;
          width: auto;
          height: 100%;
          max-width: 260px;
          min-width: 180px;
          aspect-ratio: 2 / 3;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 18px;
          background: #10131d;
          box-shadow: 0 20px 56px rgba(0, 0, 0, 0.5);
        }

        .poster-glow {
          position: absolute;
          inset: auto 20px 16px 20px;
          height: 22%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(77, 212, 189, 0.22) 0%, transparent 72%);
          filter: blur(18px);
          pointer-events: none;
        }

        .poster-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          padding: 0;
          appearance: none;
          background: rgba(7, 8, 13, 0.18);
          color: white;
          cursor: pointer;
          opacity: 0;
          transition:
            opacity 0.28s ease,
            background 0.28s ease;
        }

        .poster-frame:hover .poster-overlay {
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
          transform: scale(0.92);
          transition:
            transform 0.28s ease,
            background 0.28s ease,
            border-color 0.28s ease;
        }

        .poster-frame:hover .poster-play {
          transform: scale(1);
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.32);
        }

        :global(.swipe-indicator) {
          position: absolute;
          z-index: 4;
          display: grid;
          gap: 4px;
          min-width: 142px;
          padding: 12px 16px;
          border: 2px solid currentColor;
          border-radius: 16px;
          background: rgba(7, 8, 13, 0.8);
          backdrop-filter: blur(14px);
          text-transform: uppercase;
          pointer-events: none;
          opacity: 0;
        }

        :global(.swipe-indicator.like) {
          top: 22px;
          left: 22px;
          color: #77f0a7;
          transform: rotate(-8deg);
        }

        :global(.swipe-indicator.dislike) {
          top: 22px;
          right: 22px;
          color: #ff9cab;
          transform: rotate(8deg);
          text-align: right;
        }

        :global(.swipe-indicator.not_seen) {
          bottom: 118px;
          left: 50%;
          color: #83c4ff;
          text-align: center;
          transform: translateX(-50%);
        }

        .card-footer {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-shrink: 0;
          padding: 10px 18px 14px;
          background: transparent;
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

        .action-dock {
          display: flex;
          width: fit-content;
          max-width: 100%;
          justify-content: center;
          gap: 12px;
          padding: 8px 14px 6px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(16px) saturate(140%);
          flex-shrink: 0;
        }

        .action-wrap {
          display: grid;
          justify-items: center;
          gap: 4px;
        }

        :global(.action-button) {
          display: grid;
          width: 50px;
          height: 50px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          background: rgba(12, 14, 22, 0.88);
          color: var(--text);
          box-shadow:
            0 12px 28px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
        }

        :global(.action-button:hover:not(:disabled)) {
          transform: translateY(-2px) scale(1.03);
        }

        :global(.action-button.dislike:hover:not(:disabled)) {
          border-color: rgba(255, 77, 93, 0.54);
          color: #ff9cab;
          box-shadow: 0 16px 36px rgba(255, 77, 93, 0.16);
        }

        :global(.action-button.skip:hover:not(:disabled)) {
          border-color: rgba(97, 181, 255, 0.54);
          color: #83c4ff;
          box-shadow: 0 16px 36px rgba(97, 181, 255, 0.16);
        }

        :global(.action-button.like:hover:not(:disabled)) {
          border-color: rgba(43, 214, 111, 0.54);
          color: #77f0a7;
          box-shadow: 0 16px 36px rgba(43, 214, 111, 0.16);
        }

        .action-label {
          color: var(--text);
          font-size: 10px;
          font-weight: 900;
          text-shadow:
            0 1px 10px rgba(0, 0, 0, 0.9),
            0 1px 2px rgba(0, 0, 0, 0.9);
        }

        .shortcut-note {
          padding: 6px 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(247, 243, 234, 0.68);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-align: left;
          backdrop-filter: blur(12px);
          flex: 1 1 auto;
          min-width: 0;
        }

        .overlay-modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(4, 5, 8, 0.82);
          backdrop-filter: blur(14px);
          z-index: 1000;
          animation: overlayFade 0.28s ease;
        }

        .trailer-dialog {
          position: relative;
          width: min(1100px, 100%);
          overflow: hidden;
          border-radius: 18px;
          background: #0b0e16;
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.72);
          animation: overlayPop 0.32s ease;
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

        .synopsis-dialog {
          position: relative;
          display: grid;
          gap: 16px;
          width: min(760px, 100%);
          max-height: min(78vh, 760px);
          padding: 24px;
          border-radius: 20px;
          background: #0b0e16;
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.72);
          animation: overlayPop 0.32s ease;
        }

        .synopsis-header {
          display: grid;
          gap: 8px;
          padding-right: 48px;
        }

        .synopsis-label {
          color: rgba(247, 243, 234, 0.58);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .synopsis-title {
          color: var(--text);
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 900;
          line-height: 1;
        }

        .synopsis-copy {
          overflow: auto;
          color: rgba(247, 243, 234, 0.88);
          font-size: 16px;
          font-weight: 600;
          line-height: 1.7;
          padding-right: 8px;
        }

        .overlay-close {
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

        .overlay-close:hover {
          transform: scale(1.06);
          background: rgba(0, 0, 0, 0.78);
        }

        @keyframes overlayFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes overlayPop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
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

        @media (max-width: 960px) {
          .card-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto minmax(0, 1fr);
            gap: 10px;
          }

          .copy-column {
            order: 2;
          }

          .poster-column {
            order: 3;
            justify-content: flex-start;
            height: auto;
          }

          :global(.poster-motion) {
            height: auto;
          }

          .poster-frame {
            width: min(42vw, 200px);
            height: auto;
            min-width: 0;
            max-width: 200px;
          }

          .supporting-grid {
            max-width: none;
          }
        }

        @media (max-width: 640px) {
          .deck-card {
            border-radius: 20px;
          }

          .card-grid {
            gap: 8px;
            padding: 10px 12px 6px;
          }

          .card-footer {
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 8px 12px 10px;
          }

          .shortcut-note {
            width: 100%;
            text-align: center;
          }

          .topbar {
            align-items: start;
          }

          .stop-button {
            min-height: 34px;
            padding: 0 10px;
            font-size: 11px;
          }

          .scene-pill {
            font-size: 10px;
            padding: 7px 10px;
          }

          .title-text {
            font-size: 28px;
            line-height: 0.98;
          }

          .meta-row,
          .decision-tags,
          .copy-actions {
            gap: 6px;
          }

          .meta-chip,
          .tag {
            min-height: 26px;
            padding: 0 8px;
            font-size: 10px;
          }

          .hook {
            font-size: 12px;
            -webkit-line-clamp: 3;
            min-height: calc(1.4em * 3);
          }

          .supporting-grid {
            grid-template-columns: 1fr;
          }

          .poster-frame {
            width: min(44vw, 180px);
            height: auto;
            min-width: 0;
            max-width: 180px;
          }

          :global(.swipe-indicator) {
            min-width: 110px;
            padding: 8px 10px;
          }

          :global(.swipe-indicator.like),
          :global(.swipe-indicator.dislike) {
            top: 14px;
          }

          :global(.swipe-indicator.like) {
            left: 14px;
          }

          :global(.swipe-indicator.dislike) {
            right: 14px;
          }

          .indicator-label {
            font-size: 18px;
          }

          .shortcut-note {
            width: 100%;
            font-size: 9px;
          }

          .action-dock {
            gap: 10px;
            padding: 8px 10px 5px;
          }

          :global(.action-button) {
            width: 46px;
            height: 46px;
          }

          .action-label {
            font-size: 9px;
          }

          .overlay-modal {
            padding: 16px;
          }

          .synopsis-dialog {
            max-height: 82vh;
            padding: 20px;
          }

          .synopsis-copy {
            font-size: 15px;
          }
        }
      `}</style>

      <motion.article
        className="deck-card-motion"
        drag={loading || showTrailer || showSynopsis ? false : true}
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
        <div className={`deck-card${dragIntent ? ` intent-${dragIntent}` : ""}`}>
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

        <div className="card-grid">
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

          <div className="copy-column">
            <div className="eyebrow">
              {title.kind === "movie" ? <Film size={14} /> : <Tv size={14} />}
              Decide in a glance
            </div>

            {title.imdbUrl ? (
              <a
                href={title.imdbUrl}
                className="title-link"
                title={`Watch IMDb page for ${title.title}.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h2 className="title-text">{title.title}</h2>
              </a>
            ) : (
              <h2 className="title-text">{title.title}</h2>
            )}

            <div className="meta-row">
              <span className="meta-chip">{title.year}</span>
              <span className="meta-chip">{runtimeLabel}</span>
              <span className="meta-chip">{title.certification}</span>
              {title.tmdbRating ? <span className="meta-chip rating-chip">{title.tmdbRating.toFixed(1)} TMDB</span> : null}
            </div>

            <div className="decisionTags decision-tags">
              {decisionTags.map((tag, index) => (
                <span key={`${tag}-${index}`} className={`tag${index === decisionTags.length - 1 && title.tone.length > 0 ? " tag-accent" : ""}`}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="synopsis-block">
              <p ref={synopsisRef} className="hook">
                {title.synopsis}
              </p>

              {showSynopsisButton ? (
                <div className="copy-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowSynopsis(true)}
                    title={`Read full synopsis for ${title.title}`}
                  >
                    Read full synopsis
                  </button>
                </div>
              ) : null}
            </div>

            <div className="supporting-grid">
              <div className="support-card">
                <div className="support-label">Starring</div>
                <div className="support-value">{title.cast.slice(0, 3).join(" / ") || "Cast unavailable"}</div>
              </div>

              <div className="support-card">
                <div className="support-label">Why You'll Like It</div>
                <div className="support-value">
                  {title.style.slice(0, 2).map(formatTag).join(" / ") || title.subgenres.slice(0, 2).map(formatTag).join(" / ") || "No extra details"}
                </div>
              </div>
            </div>
          </div>

          <div className="poster-column">
            <motion.div
              className="poster-motion"
              initial={{ y: 12, rotate: -1.5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="poster-frame">
                <PosterImage
                  src={title.posterUrl}
                  alt=""
                  label={title.title}
                  sizes="(max-width: 640px) 34vw, (max-width: 960px) 36vw, 260px"
                  priority
                  objectFit="contain"
                  objectPosition="center center"
                  showLabel={false}
                />

                {title.trailerKey ? (
                  <button
                    type="button"
                    className="poster-overlay"
                    onClick={() => setShowTrailer(true)}
                    aria-label={`Watch trailer for ${title.title}`}
                    title={`Watch YouTube trailer for ${title.title}`}
                  >
                    <div className="poster-play">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </button>
                ) : null}

                <div className="poster-glow" aria-hidden="true" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="card-footer">
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
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <action.icon size={22} />}
                </motion.button>
                <div className="action-label">{action.label}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </motion.article>

      {showTrailer && title.trailerKey ? (
        <div className="overlay-modal" onClick={() => setShowTrailer(false)}>
          <div className="trailer-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="overlay-close" onClick={() => setShowTrailer(false)} aria-label="Close trailer">
              <X size={20} />
            </button>

            <div className="trailer-frame">
              <iframe
                src={`https://www.youtube.com/embed/${title.trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${title.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}

      {showSynopsis ? (
        <div className="overlay-modal" onClick={() => setShowSynopsis(false)}>
          <div className="synopsis-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="overlay-close" onClick={() => setShowSynopsis(false)} aria-label="Close synopsis">
              <X size={20} />
            </button>

            <div className="synopsis-header">
              <div className="synopsis-label">Full synopsis</div>
              <h3 className="synopsis-title">{title.title}</h3>
            </div>

            <div className="synopsis-copy">{title.synopsis}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
