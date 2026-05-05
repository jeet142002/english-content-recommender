"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Activity, Trophy, AlertCircle } from "lucide-react";

import { LandingShell } from "@/components/landing-shell";
import { PrimingPanel } from "@/components/priming-panel";
import { RecommendationHero } from "@/components/recommendation-hero";
import { TitleCard } from "@/components/title-card";
import { startSession, stopSession, submitFeedback } from "@/lib/api-client";
import { useSessionStore } from "@/lib/session-store";
import type { AdventureLevel, ContentMode, FeedbackValue } from "@/lib/types";

const phases = [
  { id: "landing", label: "Start" },
  { id: "priming", label: "Setup" },
  { id: "rating", label: "Rating" },
  { id: "result", label: "Result" },
] as const;

export default function HomePage() {
  const [phase, setPhase] = useState<"landing" | "priming" | "rating" | "result">("landing");
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

  const statusLine = useMemo(() => {
    if (recommendation) {
      return { icon: Trophy, text: "Final recommendation" };
    }
    if (currentTitle) {
      return { icon: Activity, text: `Reading your taste · ${Math.round(currentTitle.confidence * 100)}% confidence` };
    }
    return { icon: Sparkles, text: "Premium English-only recommender" };
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-2) 0 var(--space-6);
          margin-bottom: var(--space-4);
          border-bottom: 1px solid var(--line);
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-weight: 700;
          font-size: 16px;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        
        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--accent);
          color: white;
        }
        
        .status-line {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .progress-container {
          display: grid;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }
        
        .progress-steps {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .progress-step {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          transition: color var(--transition-fast);
        }
        
        .progress-step.active {
          color: var(--accent);
        }
        
        .progress-step.completed {
          color: var(--success);
        }
        
        .error-banner {
          margin-top: var(--space-5);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--error-soft);
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.3);
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
      `}</style>

      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          English Content Recommender
        </div>
        <div className="status-line">
          <statusLine.icon size={16} />
          {statusLine.text}
        </div>
      </header>

      {phase !== "landing" && (
        <motion.div 
          className="progress-container"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="progress-steps">
            {phases.map((p, index) => (
              <div 
                key={p.id} 
                className={`progress-step ${index === currentPhaseIndex ? "active" : ""} ${index < currentPhaseIndex ? "completed" : ""}`}
              >
                {p.label}
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <motion.div 
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {phase === "landing" && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingShell onStart={() => setPhase("priming")} />
          </motion.div>
        )}

        {phase === "priming" && (
          <motion.div 
            key="priming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
            key="rating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TitleCard 
              payload={currentTitle} 
              onFeedback={handleFeedback} 
              onStop={handleStop} 
              loading={loading} 
            />
          </motion.div>
        )}

        {phase === "result" && recommendation && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RecommendationHero 
              recommendation={recommendation} 
              onRestart={handleRestart} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div 
          className="error-banner"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}
    </main>
  );
}
