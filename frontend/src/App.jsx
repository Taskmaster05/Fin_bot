import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PanelRight } from 'lucide-react';

import { useApi } from './hooks/useApi';
import Sidebar from './components/Sidebar';
import InputBar from './components/InputBar';
import RightPanel from './components/RightPanel';
import EmptyState from './components/EmptyState';
import LoadingOverlay from './components/LoadingOverlay';
import {
  UserMessage,
  AssistantMessage,
  ThinkingIndicator,
  ErrorMessage,
} from './components/Messages';

// ─── Helpers ───────────────────────────────────────────────────────────────

let _convCounter = 0;
function newConversation() {
  _convCounter += 1;
  return { id: `conv-${Date.now()}`, title: '', messages: [], sessionId: null, updatedAt: Date.now() };
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const { apiStatus, checkHealth, sendMessage, streamMessage, stopStream, clearSession } = useApi();

  // Conversations
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('finsight-convs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Strip blobs (not serializable); keep text messages only
        return parsed.map(c => ({
          ...c,
          messages: c.messages.filter(m => m.type !== 'file'),
        }));
      } catch { return []; }
    }
    return [];
  });
  const [activeId, setActiveId] = useState(null);
  const [rightOpen, setRightOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [downloadFile, setDownloadFile] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');

  const messagesEndRef = useRef(null);
  const stopStreamRef = useRef(null);

  // ── Health check on mount + retry ──────────────────────────────────────
  useEffect(() => {
    checkHealth();
    const iv = setInterval(checkHealth, 15000);
    return () => clearInterval(iv);
  }, [checkHealth]);

  // ── Persist conversations (no blobs) ───────────────────────────────────
  useEffect(() => {
    const toSave = conversations.map(c => ({
      ...c,
      messages: c.messages.filter(m => m.type !== 'file'),
    }));
    localStorage.setItem('finsight-convs', JSON.stringify(toSave));
  }, [conversations]);

  // ── Scroll to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isThinking, streamingContent]);

  // ── Active conversation ────────────────────────────────────────────────
  const activeConv = conversations.find(c => c.id === activeId) || null;
  const messages = activeConv?.messages || [];
  const allSources = activeConv
    ? [...new Set(activeConv.messages.flatMap(m => m.sources || []))]
    : [];

  // ── Helpers to mutate conversation state ──────────────────────────────
  const patchConv = useCallback((id, fn) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...fn(c), updatedAt: Date.now() } : c));
  }, []);

  const appendMsg = useCallback((convId, msg) => {
    patchConv(convId, c => ({ ...c, messages: [...c.messages, msg] }));
  }, [patchConv]);

  const replaceLastMsg = useCallback((convId, msg) => {
    patchConv(convId, c => {
      const msgs = [...c.messages];
      msgs[msgs.length - 1] = msg;
      return { ...c, messages: msgs };
    });
  }, [patchConv]);

  // ── New conversation ───────────────────────────────────────────────────
  const handleNew = useCallback(() => {
    const conv = newConversation();
    setConversations(prev => [conv, ...prev]);
    setActiveId(conv.id);
    setDownloadFile(null);
    setStreamingContent('');
  }, []);

  // ── Select conversation ────────────────────────────────────────────────
  const handleSelect = useCallback((id) => {
    setActiveId(id);
    setDownloadFile(null);
    setStreamingContent('');
  }, []);

  // ── Clear session ──────────────────────────────────────────────────────
  const handleClearSession = useCallback(async () => {
    if (!activeConv) return;
    if (activeConv.sessionId) {
      await clearSession(activeConv.sessionId).catch(() => {});
    }
    patchConv(activeId, c => ({ ...c, messages: [], sessionId: null }));
    setDownloadFile(null);
    setStreamingContent('');
  }, [activeConv, activeId, clearSession, patchConv]);

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    // Ensure an active conversation exists
    let convId = activeId;
    if (!convId) {
      const conv = newConversation();
      setConversations(prev => [conv, ...prev]);
      setActiveId(conv.id);
      convId = conv.id;
    }

    // Set title from first message
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return {
        ...c,
        title: c.title || text.slice(0, 48),
        updatedAt: Date.now(),
      };
    }));

    // Add user message
    appendMsg(convId, { id: Date.now(), type: 'user', content: text });
    setIsThinking(true);
    setDownloadFile(null);

    try {
      const conv = conversations.find(c => c.id === convId) || { sessionId: null };
      const result = await sendMessage(conv.sessionId, text);

      setIsThinking(false);

      if (result.isFile) {
        // Update sessionId if provided
        appendMsg(convId, {
          id: Date.now(),
          type: 'assistant',
          content: `Your report has been generated. Download it from the Output panel.`,
          sources: [],
          format: result.format,
        });
        setDownloadFile(result);
      } else {
        // Update sessionId
        patchConv(convId, c => ({ ...c, sessionId: result.session_id }));

        if (result.format === 'pdf' || result.format === 'excel') {
          // Should not happen with text response but guard
          appendMsg(convId, {
            id: Date.now(),
            type: 'assistant',
            content: result.answer,
            sources: result.sources || [],
            format: result.format,
          });
        } else {
          appendMsg(convId, {
            id: Date.now(),
            type: 'assistant',
            content: result.answer,
            sources: result.sources || [],
            format: result.format || 'text',
          });
        }
      }
    } catch (err) {
      setIsThinking(false);
      appendMsg(convId, {
        id: Date.now(),
        type: 'error',
        content: err.message || 'Something went wrong',
        retryText: text,
      });
    }
  }, [activeId, conversations, appendMsg, patchConv, sendMessage]);

  // ── Retry ──────────────────────────────────────────────────────────────
  const handleRetry = useCallback((text) => {
    // Remove last error message then retry
    if (activeConv) {
      patchConv(activeId, c => ({
        ...c,
        messages: c.messages.slice(0, -1),
      }));
    }
    handleSend(text);
  }, [activeConv, activeId, patchConv, handleSend]);

  // ── Loading overlay ────────────────────────────────────────────────────
  const showOverlay = apiStatus === 'connecting';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080808' }}>
      {/* Loading overlay */}
      <AnimatePresence>
        {showOverlay && <LoadingOverlay status={apiStatus} />}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        apiStatus={apiStatus}
      />

      {/* Center panel */}
      <main className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-5 py-3 border-b border-[#141414] shrink-0"
          style={{ background: '#080808' }}
        >
          <div>
            <h1 className="text-[13px] font-semibold tracking-[-0.02em] text-[#d0d0d0]">
              {activeConv?.title || 'New conversation'}
            </h1>
            {activeConv?.sessionId && (
              <p className="text-[10px] text-[#2a2a2a] font-mono mt-0.5">
                {activeConv.sessionId.slice(0, 16)}…
              </p>
            )}
          </div>
          <button
            id="toggle-right-panel-btn"
            onClick={() => setRightOpen(o => !o)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[#333] hover:text-[#777] hover:bg-[#111] transition-all"
            title="Toggle context panel"
          >
            <PanelRight size={14} />
          </button>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-4">
          {messages.length === 0 && !isThinking ? (
            <EmptyState onPrompt={handleSend} />
          ) : (
            <div className="pb-4">
              {messages.map((msg, i) => {
                if (msg.type === 'user') {
                  return <UserMessage key={msg.id} content={msg.content} index={i} />;
                }
                if (msg.type === 'assistant') {
                  return (
                    <AssistantMessage
                      key={msg.id}
                      content={msg.content}
                      sources={msg.sources}
                      format={msg.format}
                      index={i}
                      isStreaming={false}
                    />
                  );
                }
                if (msg.type === 'error') {
                  return (
                    <ErrorMessage
                      key={msg.id}
                      error={msg.content}
                      onRetry={msg.retryText ? () => handleRetry(msg.retryText) : null}
                    />
                  );
                }
                return null;
              })}

              {/* Thinking indicator */}
              <AnimatePresence>
                {isThinking && <ThinkingIndicator key="thinking" />}
              </AnimatePresence>

              {/* Streaming message */}
              {isStreaming && streamingContent && (
                <AssistantMessage
                  content={streamingContent}
                  sources={[]}
                  format="text"
                  index={messages.length}
                  isStreaming
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <InputBar
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStream}
          disabled={isThinking}
        />
      </main>

      {/* Right panel */}
      <RightPanel
        isOpen={rightOpen}
        onToggle={() => setRightOpen(false)}
        sources={allSources}
        downloadFile={downloadFile}
        sessionId={activeConv?.sessionId || null}
        messageCount={messages.filter(m => m.type !== 'error').length}
        onClearSession={handleClearSession}
      />
    </div>
  );
}
