import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Square } from 'lucide-react';

const MAX_CHARS = 4000;

export default function InputBar({ onSend, isStreaming, onStop, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const remaining = MAX_CHARS - value.length;
  const nearLimit = remaining < 200;

  return (
    <motion.div
      animate={{ y: focused ? -2 : 0 }}
      transition={{ duration: 0.15 }}
      className="px-4 pb-4 pt-2"
    >
      <div
        className="flex items-end gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
        style={{
          background: '#0f0f0f',
          border: focused
            ? '1px solid rgba(255,255,255,0.2)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focused
            ? '0 0 0 3px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything about the financials…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[#d0d0d0] text-[13px] leading-relaxed placeholder:text-[#333] outline-none resize-none py-0.5"
          style={{ maxHeight: 140 }}
        />

        {/* Char count */}
        {value.length > 0 && (
          <span
            className="text-[10px] pb-0.5 shrink-0 tabular-nums"
            style={{ color: nearLimit ? '#cc5555' : '#333' }}
          >
            {remaining}
          </span>
        )}

        {/* Send / Stop button */}
        <motion.button
          id={isStreaming ? 'stop-btn' : 'send-btn'}
          onClick={isStreaming ? onStop : handleSend}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          disabled={!isStreaming && (!value.trim() || disabled)}
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200"
          style={{
            background: isStreaming
              ? '#1a1a1a'
              : value.trim() && !disabled
              ? '#f0f0f0'
              : '#1a1a1a',
            border: isStreaming ? '1px solid #333' : 'none',
            cursor: !isStreaming && (!value.trim() || disabled) ? 'default' : 'pointer',
          }}
        >
          {isStreaming ? (
            <Square size={13} className="text-[#888]" fill="#888" />
          ) : (
            <Send
              size={13}
              strokeWidth={2}
              style={{ color: value.trim() && !disabled ? '#080808' : '#444' }}
            />
          )}
        </motion.button>
      </div>

      <p className="text-center text-[10px] text-[#252525] mt-2">
        FinSight may make mistakes. Verify important financial data.
      </p>
    </motion.div>
  );
}
