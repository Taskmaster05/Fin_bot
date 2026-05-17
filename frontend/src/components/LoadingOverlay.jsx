import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function LoadingOverlay({ status }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#080808' }}
    >
      {/* Spinner ring */}
      <div className="relative mb-8">
        <div
          className="w-14 h-14 rounded-full"
          style={{
            border: '1px solid #1f1f1f',
            background: '#111',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
          }}
        />
        <svg
          className="absolute inset-0 w-14 h-14 -rotate-90"
          style={{ animation: 'spin 1.4s linear infinite' }}
          viewBox="0 0 56 56"
        >
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="100 52"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap size={18} className="text-[#555]" strokeWidth={1.5} />
        </div>
      </div>

      <h2 className="text-[15px] font-semibold tracking-[-0.03em] text-[#e0e0e0] mb-1.5">
        Connecting to FinSight
      </h2>
      <p className="text-[12px] text-[#333]">
        {status === 'error' ? 'Cannot reach the backend — retrying…' : 'Establishing connection…'}
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
