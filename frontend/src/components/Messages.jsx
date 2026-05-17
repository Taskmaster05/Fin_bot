import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, FileText, Table2, AlignLeft, BarChart2 } from 'lucide-react';
import { useState } from 'react';

// Thinking dots
export function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-4 px-6 py-4"
    >
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center gap-1.5 py-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#444]"
              style={{ animation: `thinking 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Format icon
function FormatIcon({ format }) {
  const icons = {
    pdf: <FileText size={11} />,
    excel: <Table2 size={11} />,
    table: <BarChart2 size={11} />,
    text: <AlignLeft size={11} />,
  };
  const labels = { pdf: 'PDF', excel: 'Excel', table: 'Table', text: 'Text' };
  return (
    <span className="flex items-center gap-1 text-[10px] text-[#444] border border-[#1f1f1f] rounded px-1.5 py-0.5">
      {icons[format] || icons.text}
      {labels[format] || 'Text'}
    </span>
  );
}

// Source badge
function SourceBadge({ source, index }) {
  return (
    <motion.span
      whileHover={{ borderColor: '#444', color: '#ccc' }}
      className="inline-flex items-center gap-1 text-[11px] text-[#666] border border-[#2a2a2a] bg-[#141414] rounded-full px-2 py-0.5 cursor-default transition-colors"
      title={source}
    >
      [{index + 1}] {source.length > 24 ? source.slice(0, 24) + '…' : source}
    </motion.span>
  );
}

// Copy button
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      id="copy-message-btn"
      className="flex items-center justify-center w-6 h-6 rounded text-[#444] hover:text-[#888] transition-colors"
      title="Copy"
    >
      {copied ? <Check size={11} className="text-[#888]" /> : <Copy size={11} />}
    </motion.button>
  );
}

// User message
export function UserMessage({ content, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex justify-end px-6 py-2"
    >
      <div
        className="max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm text-[13px] text-[#d0d0d0] leading-relaxed"
        style={{ background: '#1a1a1a', border: '1px solid #252525' }}
      >
        {content}
      </div>
    </motion.div>
  );
}

// Assistant message
export function AssistantMessage({ content, sources = [], format = 'text', index, isStreaming }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col px-6 py-3"
    >
      <div className="max-w-3xl w-full">
        <div className="prose-chat text-[13px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-[#555] ml-0.5 align-middle animate-pulse" />
          )}
        </div>

        {/* Footer row */}
        {!isStreaming && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {sources.map((src, i) => (
              <SourceBadge key={i} source={src} index={i} />
            ))}
            <div className="ml-auto flex items-center gap-2">
              <FormatIcon format={format} />
              <CopyButton text={content} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Error message
export function ErrorMessage({ error, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col px-6 py-2"
    >
      <div
        className="max-w-2xl px-4 py-3 rounded-xl text-[13px]"
        style={{ background: '#2a1a1a', border: '1px solid #3a2020' }}
      >
        <p className="text-[#ff6b6b] font-medium mb-1">Error</p>
        <p className="text-[#cc5555] text-[12px]">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-[11px] text-[#888] hover:text-[#ccc] underline transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}
