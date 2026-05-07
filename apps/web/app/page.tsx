"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertCircle, Sparkles, Trophy } from "lucide-react";

import { LandingShell } from "@/components/landing-shell";
import { PrimingPanel } from "@/components/priming-panel";
import { RecommendationHero } from "@/components/recommendation-hero";
import { TitleCard } from "@/components/title-card";
import { startSession, stopSession, submitFeedback } from "@/lib/api-client";
import { useSessionStore } from "@/lib/session-store";
import type { AdventureLevel, ContentMode, FeedbackValue } from "@/lib/types";

const phases = [
  { id: "landing", label: "Start" },
  { id: "priming", label: "Mood" },
  { id: "rating", label: "Taste" },
  { id: "result", label: "Pick" },
] as const;

type Phase = (typeof phases)[number]["id"];

function confidenceMood(confidence?: number) {
  if (!confidence) {
    return "Ready to read your taste";
  }
  if (confidence < 0.32) {
    return "Finding the first signal";
  }
  if (confidence < 0.62) {
    return "Your taste is taking shape";
  }
  return "A sharp pick is coming together";
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("landing");
  const {
    contentMode,
    adventureLevel,
    currentTitle,
    recommendation,
    loading,
    error,
    sessionId,
    setPreferences,
    setCurrentTitle,
    setRecommendation,
    setLoading,
    setError,
    reset,
  } = useSessionStore();

  const currentPhaseIndex = phases.findIndex((p) => p.id === phase);
  const progress = ((currentPhaseIndex + 1) / phases.length) * 100;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, currentTitle?.title.id]);

  const statusLine = useMemo(() => {
    if (recommendation) {
      return { icon: Trophy, text: "Your pick is ready" };
    }
    if (currentTitle) {
      return {
        icon: Activity,
        text: `${confidenceMood(currentTitle.confidence)} - ${Math.round(currentTitle.confidence * 100)}%`,
      };
    }
    return { icon: Sparkles, text: "English-only movie and series picks" };
  }, [currentTitle, recommendation]);

  async function beginSession() {
    try {
      setLoading(true);
      setError(null);
      const payload = await startSession({ contentMode, adventureLevel });
      setCurrentTitle(payload);
      setPhase("rating");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start the session.");
    } finally {
      setLoading(false);
    }
  }

  async function revealRecommendation(activeSessionId: string) {
    const result = await stopSession(activeSessionId);
    setRecommendation(result);
    setPhase("result");
  }

  async function handleFeedback(value: FeedbackValue) {
    if (!sessionId || !currentTitle) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payload = await submitFeedback({
        sessionId,
        titleId: currentTitle.title.id,
        value,
      });
      setCurrentTitle(payload);
    } catch (cause) {
      if (cause instanceof Error && cause.message === "No more titles available") {
        try {
          await revealRecommendation(sessionId);
          return;
        } catch (stopCause) {
          setError(stopCause instanceof Error ? stopCause.message : "Unable to produce recommendation.");
          return;
        }
      }
      setError(cause instanceof Error ? cause.message : "Unable to register feedback.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    if (!sessionId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await revealRecommendation(sessionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to produce recommendation.");
    } finally {
      setLoading(false);
    }
  }

  function updatePreferences(nextContentMode: ContentMode, nextAdventureLevel: AdventureLevel) {
    setPreferences(nextContentMode, nextAdventureLevel);
  }

  function handleRestart() {
    reset();
    setPhase("landing");
  }

  return (
    <main className="page-shell">
      <style jsx>{`
        .app-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-3) 0 var(--space-5);
          background: linear-gradient(180deg, rgba(7, 8, 13, 0.96), rgba(7, 8, 13, 0));
          backdrop-filter: blur(10px);
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: var(--space-3);
          min-width: 0;
          color: var(--text);
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .logo-icon {
          display: grid;
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent));
          color: #07080d;
          box-shadow: 0 14px 30px rgba(143, 123, 255, 0.28);
        }

        .status-line {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .journey {
          display: grid;
          gap: var(--space-3);
          margin: var(--space-1) 0 var(--space-6);
        }

        .journey-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-2);
        }

        .journey-step {
          display: grid;
          gap: var(--space-2);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .journey-step::before {
          content: "";
          height: 3px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.08);
        }

        .journey-step.active,
        .journey-step.completed {
          color: var(--text);
        }

        .journey-step.completed::before {
          background: linear-gradient(90deg, var(--teal), var(--accent));
        }

        .journey-step.active::before {
          background: linear-gradient(90deg, var(--accent), var(--gold));
          box-shadow: 0 0 20px rgba(143, 123, 255, 0.32);
        }

        .journey-progress {
          height: 1px;
          overflow: hidden;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.08);
        }

        .journey-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--teal), var(--accent), var(--gold));
        }

        .error-banner {
          position: fixed;
          right: var(--space-5);
          bottom: var(--space-5);
          z-index: 40;
          display: flex;
          max-width: min(460px, calc(100vw - 32px));
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          border: 1px solid rgba(255, 77, 93, 0.34);
          border-radius: var(--radius-lg);
          background: rgba(54, 15, 24, 0.96);
          box-shadow: var(--shadow-soft);
          color: #ffd5dc;
          font-size: 14px;
          font-weight: 700;
        }

        @media (max-width: 720px) {
          .app-header {
            grid-template-columns: 1fr;
            gap: var(--space-2);
            padding-bottom: var(--space-4);
          }

          .status-line {
            justify-content: flex-start;
            font-size: 12px;
          }

          .logo {
            font-size: 14px;
          }

          .journey-step {
            font-size: 10px;
          }
        }
      `}</style>

      <header className="app-header">
        <div className="logo" aria-label="English Content Recommender">
          <div className="logo-icon">
            <Sparkles size={20} strokeWidth={2.4} />
          </div>
          English Content Recommender
        </div>
        <div className="status-line">
          <statusLine.icon size={15} />
          {statusLine.text}
        </div>
      </header>

      {phase !== "landing" && (
        <motion.div
          className="journey"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="journey-steps">
            {phases.map((p, index) => (
              <div
                key={p.id}
                className={`journey-step ${index === currentPhaseIndex ? "active" : ""} ${
                  index < currentPhaseIndex ? "completed" : ""
                }`}
              >
                {p.label}
              </div>
            ))}
          </div>
          <div className="journey-progress" aria-hidden="true">
            <motion.div
              className="journey-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {phase === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32 }}
          >
            <LandingShell onStart={() => setPhase("priming")} />
          </motion.div>
        )}

        {phase === "priming" && (
          <motion.div
            key="priming"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.32 }}
          >
            <PrimingPanel
              contentMode={contentMode}
              adventureLevel={adventureLevel}
              onChange={updatePreferences}
              onSubmit={beginSession}
              loading={loading}
            />
          </motion.div>
        )}

        {phase === "rating" && currentTitle && (
          <motion.div
            key={currentTitle.title.id}
            initial={{ opacity: 0, scale: 0.985, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: -14 }}
            transition={{ duration: 0.34 }}
          >
            <TitleCard payload={currentTitle} onFeedback={handleFeedback} onStop={handleStop} loading={loading} />
          </motion.div>
        )}

        {phase === "result" && recommendation && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.38 }}
          >
            <RecommendationHero recommendation={recommendation} onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          className="error-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          role="alert"
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}
    </main>
  );
}
