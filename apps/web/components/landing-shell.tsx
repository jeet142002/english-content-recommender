// "use client";

// import { motion } from "framer-motion";
// import { Sparkles, ThumbsUp, Eye, Lightbulb, ArrowRight, Clock } from "lucide-react";

// type LandingShellProps = {
//   onStart: () => void;
// };

// const steps = [
//   { icon: ThumbsUp, text: "Like or reject one title at a time" },
//   { icon: Eye, text: "Treat not seen as unfamiliar, not negative" },
//   { icon: Lightbulb, text: "Get one confident recommendation with reasons" },
// ];

// const containerVariants = {
//   hidden: { opacity: 0 },
//   visible: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.1,
//       delayChildren: 0.2,
//     },
//   },
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
//   },
// };

// export function LandingShell({ onStart }: LandingShellProps) {
//   return (
//     <section className="landing-section">
//       <style jsx>{`
//         .landing-section {
//           display: grid;
//           gap: var(--space-8);
//           min-height: calc(100vh - 160px);
//           align-items: center;
//         }
        
//         .landing-grid {
//           display: grid;
//           grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
//           gap: var(--space-6);
//           align-items: stretch;
//         }
        
//         @media (max-width: 900px) {
//           .landing-grid {
//             grid-template-columns: 1fr;
//           }
//         }
        
//         .badge {
//           display: inline-flex;
//           align-items: center;
//           gap: var(--space-2);
//           padding: var(--space-2) var(--space-3);
//           border-radius: var(--radius-full);
//           background: var(--accent-soft);
//           color: var(--text);
//           font-size: 13px;
//           font-weight: 500;
//           letter-spacing: 0.02em;
//           margin-bottom: var(--space-5);
//         }
        
//         .main-title {
//           font-size: clamp(2.5rem, 6vw, 4.5rem);
//           font-weight: 800;
//           line-height: 1.05;
//           letter-spacing: -0.03em;
//           margin: 0;
//           max-width: 680px;
//           background: linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//         }
        
//         .subtitle {
//           margin-top: var(--space-5);
//           margin-bottom: 0;
//           max-width: 520px;
//           font-size: 17px;
//           line-height: 1.7;
//           color: var(--text-secondary);
//         }
        
//         .cta-group {
//           display: flex;
//           gap: var(--space-4);
//           align-items: center;
//           margin-top: var(--space-8);
//           flex-wrap: wrap;
//         }
        
//         .cta-hint {
//           display: inline-flex;
//           align-items: center;
//           gap: var(--space-2);
//           color: var(--text-secondary);
//           font-size: 14px;
//         }
        
//         .steps-container {
//           display: grid;
//           gap: var(--space-4);
//           align-content: start;
//         }
        
//         .step-card {
//           display: flex;
//           align-items: flex-start;
//           gap: var(--space-4);
//           padding: var(--space-4);
//           border-radius: var(--radius-lg);
//           background: var(--surface);
//           border: 1px solid var(--line);
//           transition: all var(--transition-base);
//         }
        
//         .step-card:hover {
//           background: var(--surface-hover);
//           border-color: var(--line-strong);
//           transform: translateY(-2px);
//         }
        
//         .step-icon {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           width: 40px;
//           height: 40px;
//           border-radius: var(--radius-md);
//           background: var(--accent-soft);
//           color: var(--accent);
//           flex-shrink: 0;
//         }
        
//         .step-number {
//           font-size: 12px;
//           font-weight: 700;
//           color: var(--accent);
//           margin-bottom: var(--space-1);
//         }
        
//         .step-text {
//           font-size: 15px;
//           line-height: 1.5;
//           color: var(--text);
//         }
//       `}</style>

//       <div className="landing-grid">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
//           className="glass"
//           style={{ padding: "var(--space-8)", borderRadius: "var(--radius-xl)" }}
//         >
//           <div className="badge">
//             <Sparkles size={14} />
//             English movies and series only
//           </div>
          
//           <h1 className="main-title">
//             Let&apos;s find your next obsession.
//           </h1>
          
//           <p className="subtitle">
//             Rate a handful of titles. The recommender reads your taste in real time and returns one
//             sharp English-only pick for tonight.
//           </p>
          
//           <div className="cta-group">
//             <button onClick={onStart} className="btn btn-primary btn-lg">
//               Recommend me something great
//               <ArrowRight size={18} />
//             </button>
//             <span className="cta-hint">
//               <Clock size={14} />
//               Usually takes about 30 seconds
//             </span>
//           </div>
//         </motion.div>

//         <motion.div
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//           className="glass"
//           style={{ padding: "var(--space-6)", borderRadius: "var(--radius-xl)" }}
//         >
//           <div className="steps-container">
//             {steps.map((step, index) => (
//               <motion.div key={step.text} variants={itemVariants} className="step-card">
//                 <div className="step-icon">
//                   <step.icon size={20} strokeWidth={2} />
//                 </div>
//                 <div>
//                   <div className="step-number">Step 0{index + 1}</div>
//                   <div className="step-text">{step.text}</div>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }

<h1 style={{ color: "red" }}>
  THIS IS NEW BUILD TEST
</h1>

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

type LandingShellProps = {
  onStart: () => void;
};

export function LandingShell({ onStart }: LandingShellProps) {
  return (
    <section className="flex flex-col justify-center items-center text-center min-h-[70vh] px-4">
      
      {/* Badge */}
      <div className="flex items-center gap-2 text-sm text-white/50 mb-6">
        <Sparkles size={16} />
        English-only smart recommender
      </div>

      {/* Headline */}
      <h1 className="text-5xl md:text-6xl font-semibold leading-tight max-w-3xl">
        Stop scrolling. <br />
        <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Start watching.
        </span>
      </h1>

      {/* Subtext */}
      <p className="mt-6 text-white/60 max-w-xl text-lg">
        Tell us what you like. We’ll pick something you’ll actually enjoy tonight.
      </p>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="mt-10 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 
        text-white font-medium shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
      >
        Find my next show
        <ArrowRight size={16} />
      </motion.button>

      {/* Hint */}
      <p className="mt-4 text-sm text-white/40">
        Takes ~30 seconds
      </p>
    </section>
  );
}