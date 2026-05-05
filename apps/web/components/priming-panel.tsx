"use client";

import { motion } from "framer-motion";
import { Film, Tv, Shuffle, Shield, Scale, Sparkles, Loader2, ArrowRight } from "lucide-react";
import type { AdventureLevel, ContentMode } from "@/lib/types";

type PrimingPanelProps = {
  contentMode: ContentMode;
  adventureLevel: AdventureLevel;
  onChange: (contentMode: ContentMode, adventureLevel: AdventureLevel) => void;
  onSubmit: () => void;
  loading: boolean;
};

const contentOptions: { value: ContentMode; label: string; icon: typeof Film; description: string }[] = [
  { value: "movie", label: "Movie", icon: Film, description: "2-3 hour stories" },
  { value: "series", label: "Series", icon: Tv, description: "Multi-episode journeys" },
  { value: "either", label: "Either", icon: Shuffle, description: "Surprise me" },
];

const adventureOptions: { value: AdventureLevel; label: string; icon: typeof Shield; caption: string }[] = [
  { value: "safe", label: "Safe picks", icon: Shield, caption: "Recognizable, accessible, polished" },
  { value: "balanced", label: "Mix it up", icon: Scale, caption: "Strong fit with some discovery" },
  { value: "surprise", label: "Surprise me", icon: Sparkles, caption: "Less obvious, more adventurous" },
];

export function PrimingPanel({
  contentMode,
  adventureLevel,
  onChange,
  onSubmit,
  loading,
}: PrimingPanelProps) {
  return (
    <section className="priming-panel">
      <style jsx>{`
        .priming-panel {
          margin-top: var(--space-6);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
          display: grid;
          gap: var(--space-6);
        }
        
        .priming-header {
          display: grid;
          gap: var(--space-2);
        }
        
        .priming-description {
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 640px;
          font-size: 15px;
          margin: 0;
        }
        
        .options-grid {
          display: grid;
          gap: var(--space-6);
        }
        
        .option-section {
          display: grid;
          gap: var(--space-3);
        }
        
        .option-label {
          font-weight: 600;
          font-size: 15px;
          color: var(--text);
        }
        
        .content-options {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
        
        .content-option {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-full);
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-weight: 500;
          font-size: 14px;
        }
        
        .content-option:hover {
          background: var(--surface-hover);
          border-color: var(--line-strong);
          color: var(--text);
        }
        
        .content-option.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
          box-shadow: 0 4px 20px rgba(139, 124, 255, 0.35);
        }
        
        .adventure-options {
          display: grid;
          gap: var(--space-3);
        }
        
        .adventure-option {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4) var(--space-5);
          border-radius: var(--radius-lg);
          border: 1px solid var(--line);
          background: var(--surface);
          color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        
        .adventure-option:hover {
          background: var(--surface-hover);
          border-color: var(--line-strong);
        }
        
        .adventure-option.active {
          background: var(--accent-soft);
          border-color: var(--accent);
        }
        
        .adventure-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--surface-strong);
          color: var(--accent);
          flex-shrink: 0;
        }
        
        .adventure-option.active .adventure-icon {
          background: var(--accent);
          color: white;
        }
        
        .adventure-text {
          display: grid;
          gap: var(--space-1);
        }
        
        .adventure-label {
          font-weight: 600;
          font-size: 15px;
        }
        
        .adventure-caption {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .adventure-option.active .adventure-caption {
          color: var(--text);
        }
        
        .submit-section {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          padding-top: var(--space-2);
        }
      `}</style>

      <motion.div 
        className="priming-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="section-label">Quick setup</div>
        <h2 className="section-title">Give the model a starting mood.</h2>
        <p className="priming-description">
          Just two choices. The recommender still learns mostly from your likes and dislikes.
        </p>
      </motion.div>

      <motion.div 
        className="options-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="option-section">
          <div className="option-label">What are you in the mood for?</div>
          <div className="content-options">
            {contentOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange(option.value, adventureLevel)}
                className={`content-option ${contentMode === option.value ? "active" : ""}`}
              >
                <option.icon size={16} strokeWidth={2} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-section">
          <div className="option-label">How adventurous should we be?</div>
          <div className="adventure-options">
            {adventureOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange(contentMode, option.value)}
                className={`adventure-option ${adventureLevel === option.value ? "active" : ""}`}
              >
                <div className="adventure-icon">
                  <option.icon size={20} strokeWidth={2} />
                </div>
                <div className="adventure-text">
                  <div className="adventure-label">{option.label}</div>
                  <div className="adventure-caption">{option.caption}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="submit-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <button onClick={onSubmit} disabled={loading} className="btn btn-primary btn-lg">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Calibrating...
            </>
          ) : (
            <>
              Start tasting
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </motion.div>
    </section>
  );
}
