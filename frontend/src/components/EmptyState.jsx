import { motion } from 'framer-motion';
import { Zap, TrendingUp, BarChart2, FileSearch } from 'lucide-react';

const STARTERS = [
  {
    icon: TrendingUp,
    title: 'Revenue trend analysis',
    prompt: 'What was the revenue trend across all quarters in FY2024-25?',
  },
  {
    icon: BarChart2,
    title: 'Margin comparison',
    prompt: 'Compare operating margins across Q1 to Q4 and export as Excel.',
  },
  {
    icon: FileSearch,
    title: 'Annual report summary',
    prompt: 'Summarize the key financial highlights from the annual report as a PDF.',
  },
];

export default function EmptyState({ onPrompt }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-8 text-center select-none"
    >
      {/* Logo mark */}
      <div
        className="flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
        style={{
          background: '#111',
          border: '1px solid #1f1f1f',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <Zap size={22} className="text-[#888]" strokeWidth={1.5} />
      </div>

      <h2
        className="text-[22px] font-semibold tracking-[-0.04em] text-[#e0e0e0] mb-2"
      >
        FinSight
      </h2>
      <p className="text-[13px] text-[#444] max-w-xs leading-relaxed mb-10">
        Your AI-powered financial analyst. Ask about earnings, margins, trends, or request formatted reports.
      </p>

      {/* Starter chips */}
      <div className="flex flex-col gap-2 w-full max-w-md">
        {STARTERS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={i}
              id={`starter-chip-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ backgroundColor: '#141414', borderColor: '#2a2a2a', y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onPrompt(s.prompt)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}
            >
              <div
                className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                style={{ background: '#1a1a1a', border: '1px solid #222' }}
              >
                <Icon size={13} className="text-[#666]" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#888]">{s.title}</p>
                <p className="text-[11px] text-[#3a3a3a] mt-0.5 truncate">{s.prompt}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
