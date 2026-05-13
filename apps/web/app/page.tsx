"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Clapperboard } from "lucide-react";

import { LandingShell } from "@/components/landing-shell";
import { PrimingPanel } from "@/components/priming-panel";
import { RecommendationHero } from "@/components/recommendation-hero";
import { TitleCard } from "@/components/title-card";
import { startSession, stopSession, submitFeedback } from "@/lib/api-client";
import { useSessionStore } from "@/lib/session-store";
import type { AdventureLevel, ContentMode, FeedbackValue } from "@/lib/types";

type Phase = "landing" | "priming" | "rating" | "result";

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, currentTitle?.title.id]);

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
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: var(--space-4) 0;
          background: linear-gradient(180deg, rgba(7, 8, 13, 0.98) 0%, rgba(7, 8, 13, 0) 100%);
          backdrop-filter: blur(10px);
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text);
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .logo-icon {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--gold), var(--teal));
          color: #07080d;
          box-shadow: 0 8px 24px rgba(77, 212, 189, 0.22);
        }

        .error-banner {
          position: fixed;
          right: var(--space-5);
          bottom: var(--space-5);
          z-index: 60;
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
          backdrop-filter: blur(12px);
        }
      `}</style>

      <header className="app-header">
        <div className="logo" aria-label="CineSwipe">
          <div className="logo-icon">
            <Clapperboard size={17} />
          </div>
          CineSwipe
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <LandingShell onStart={() => setPhase("priming")} />
          </motion.div>
        )}

        {phase === "priming" && (
          <motion.div
            key="priming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <TitleCard payload={currentTitle} onFeedback={handleFeedback} onStop={handleStop} loading={loading} />
          </motion.div>
        )}

        {phase === "result" && recommendation && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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

