import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Table2, Download, X, Hash, MessageSquare, Trash2, ChevronRight } from 'lucide-react';

// Shimmer download card
function DownloadCard({ file }) {
  if (!file) return null;
  const isPdf = file.format === 'pdf';
  const Icon = isPdf ? FileText : Table2;
  const sizeLabel =
    file.size < 1024
      ? `${file.size} B`
      : file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  const handleDownload = () => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #1f1f1f' }}
    >
      {/* Shimmer top bar */}
      <div className="h-0.5 shimmer-card" />

      <div
        className="p-3 flex items-center gap-3"
        style={{ background: '#111111' }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: '#1a1a1a', border: '1px solid #222' }}
        >
          <Icon size={16} className="text-[#888]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-[#d0d0d0] truncate">{file.filename}</p>
          <p className="text-[10px] text-[#444] mt-0.5">{sizeLabel} · {isPdf ? 'PDF Document' : 'Excel Spreadsheet'}</p>
        </div>

        {/* Download btn */}
        <motion.button
          id="download-file-btn"
          whileHover={{ backgroundColor: '#f0f0f0', color: '#080808', scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#888] transition-all"
          style={{ border: '1px solid #2a2a2a', background: 'transparent' }}
        >
          <Download size={11} />
          Download
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function RightPanel({ isOpen, onToggle, sources, downloadFile, sessionId, messageCount, onClearSession }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="hidden lg:flex flex-col h-full border-l border-[#1f1f1f] overflow-y-auto"
          style={{ width: 320, minWidth: 320, background: '#0a0a0a' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#141414]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">Context</h2>
            <button
              id="collapse-right-panel-btn"
              onClick={onToggle}
              className="text-[#333] hover:text-[#777] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Sources */}
          <div className="px-4 py-4 border-b border-[#141414]">
            <p className="text-[10px] uppercase tracking-[0.07em] text-[#333] font-semibold mb-3">Cited Sources</p>
            {sources.length === 0 ? (
              <p className="text-[11px] text-[#2a2a2a] italic">No sources cited yet</p>
            ) : (
              <ul className="space-y-1.5">
                {sources.map((src, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-[#666] group"
                  >
                    <span className="mt-0.5 text-[10px] text-[#333] font-mono">[{i + 1}]</span>
                    <span className="group-hover:text-[#999] transition-colors truncate">{src}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Output / Download */}
          <div className="px-4 py-4 border-b border-[#141414]">
            <p className="text-[10px] uppercase tracking-[0.07em] text-[#333] font-semibold mb-3">Output</p>
            {downloadFile ? (
              <DownloadCard file={downloadFile} />
            ) : (
              <p className="text-[11px] text-[#2a2a2a] italic">No file generated yet</p>
            )}
          </div>

          {/* Session info */}
          <div className="px-4 py-4 mt-auto">
            <p className="text-[10px] uppercase tracking-[0.07em] text-[#333] font-semibold mb-3">Session</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash size={11} className="text-[#333]" />
                <span className="text-[11px] text-[#444] font-mono truncate">
                  {sessionId ? sessionId.slice(0, 18) + '…' : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare size={11} className="text-[#333]" />
                <span className="text-[11px] text-[#444]">{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <motion.button
              id="clear-session-btn"
              whileHover={{ borderColor: '#cc4444', color: '#cc4444' }}
              whileTap={{ scale: 0.97 }}
              onClick={onClearSession}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] text-[#444] transition-all"
              style={{ border: '1px solid #222', background: 'transparent' }}
            >
              <Trash2 size={11} />
              Clear session
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
