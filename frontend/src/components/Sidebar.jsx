import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Plus, Zap } from 'lucide-react';

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, apiStatus }) {
  return (
    <aside
      className="hidden md:flex flex-col h-full border-r border-[#1f1f1f]"
      style={{ width: 260, minWidth: 260, background: '#0a0a0a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1f1f1f]">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#111] border border-[#2a2a2a]">
          <Zap size={15} className="text-[#e0e0e0]" strokeWidth={2.5} />
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{
              background: apiStatus === 'ok' ? '#e0e0e0' : apiStatus === 'connecting' ? '#666' : '#cc4444',
              animation: apiStatus === 'ok' ? 'pulseDot 2s ease-in-out infinite' : 'none',
            }}
          />
        </div>
        <div>
          <h1 className="text-[13px] font-semibold tracking-[-0.03em] text-[#f0f0f0]">FinSight</h1>
          <p className="text-[10px] text-[#444] tracking-[0.02em] uppercase font-medium">
            {apiStatus === 'ok' ? 'Connected' : apiStatus === 'connecting' ? 'Connecting…' : 'Offline'}
          </p>
        </div>
      </div>

      {/* New Conversation */}
      <div className="px-3 pt-4 pb-2">
        <motion.button
          id="new-conversation-btn"
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#2a2a2a] text-[#888] hover:text-[#e0e0e0] transition-colors text-[12px] font-medium tracking-[-0.01em]"
          style={{ background: 'transparent' }}
        >
          <Plus size={13} strokeWidth={2} />
          New conversation
        </motion.button>
      </div>

      {/* History */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.08em] text-[#333] font-semibold">
          History
        </p>
        <AnimatePresence initial={false}>
          {conversations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 py-6 text-center"
            >
              <MessageSquare size={20} className="mx-auto mb-2 text-[#2a2a2a]" />
              <p className="text-[11px] text-[#444]">No conversations yet</p>
            </motion.div>
          )}
          {conversations.map((conv, i) => {
            const isActive = conv.id === activeId;
            return (
              <motion.button
                key={conv.id}
                id={`conv-${conv.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                onClick={() => onSelect(conv.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all group relative"
                style={{
                  background: isActive ? '#161616' : 'transparent',
                  borderLeft: isActive ? '2px solid rgba(255,255,255,0.25)' : '2px solid transparent',
                }}
                whileHover={{ backgroundColor: isActive ? '#161616' : '#111' }}
              >
                <p className={`text-[12px] font-medium truncate leading-snug ${isActive ? 'text-[#e0e0e0]' : 'text-[#777] group-hover:text-[#bbb]'}`}>
                  {conv.title || 'New conversation'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={9} className="text-[#333]" />
                  <span className="text-[10px] text-[#333]">{formatTime(conv.updatedAt)}</span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* Footer badge */}
      <div className="px-5 py-4 border-t border-[#141414]">
        <p className="text-[10px] text-[#2e2e2e] tracking-[0.02em]">
          Powered by <span className="text-[#3a3a3a]">Gemini</span> +{' '}
          <span className="text-[#3a3a3a]">Neo4j</span>
        </p>
      </div>
    </aside>
  );
}
