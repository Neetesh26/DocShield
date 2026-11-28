
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { documentService } from '../../services';

const QUICK_ACTIONS = [
  { label: 'Summary', prompt: 'Provide a concise summary of this document.' },
  { label: 'Key points', prompt: 'List the key points of this document.' },
  { label: 'Critical parameters', prompt: 'Summarize the critical control points and parameters of this document.' },
  { label: 'Training quiz', prompt: 'Generate a 3-question training quiz based on this procedure.' }
];

const getSuggestedQuestions = (doc) => {
  const typeOrNum = `${doc?.documentType || ''} ${doc?.documentNumber || ''}`.toUpperCase();

  if (typeOrNum.includes('BMR') || typeOrNum.includes('BPR')) {
    return [
      'What is the batch size?',
      'Which equipment is used in granulation?',
      'What is the % yield?',
      'Koi deviation hua tha kya?'
    ];
  }

  return [
    'What is the purpose & scope?',
    'Who prepared and approved this?',
    'What are the critical control points?',
    'Is document mein kya precautions hain?'
  ];
};

export const AiDocumentAssistant = ({ documentId, doc }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollEndRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [documentId]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submitPrompt = async (rawPrompt) => {
    const promptText = (rawPrompt || '').trim();
    if (!promptText || loading || !documentId) return;

    setMessages((prev) => [...prev, { sender: 'user', text: promptText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await documentService.askAssistant(documentId, promptText);

      if (res?.success && res?.data) {
        const reply = !res.data.configured
          ? `${res.data.message}\n(Document Context: ${res.data.documentContext?.documentNumber || doc?.documentNumber || ''})`
          : res.data.response;

        setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'assistant', text: 'Unable to retrieve response from AI Document Assistant.' }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: err?.response?.data?.message || 'Error connecting to AI Document Assistant.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    submitPrompt(input);
  };

  const suggestedQuestions = getSuggestedQuestions(doc);

  return (
    <div className="bg-orange-50 dark:bg-slate-900 rounded-2xl border  border-orange-300 dark:border-slate-900 shadow-lg flex flex-col h-[740px] overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-orange-100 dark:border-slate-800 bg-orange-50/50 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <Sparkles className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0" />
          <span>AI Document Assistant</span>
        </div>
    
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Ask in English or Hinglish · Document-grounded AI
        </p>
      </div>

      {/* Top Quick Action Pills */}
      <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={loading}
            onClick={() => submitPrompt(action.prompt)}
            className="px-2.5 py-1.5 rounded-lg border border-orange-200 dark:border-orange-500/20 bg-orange-50/70 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-500/10 hover:border-orange-300 dark:hover:border-orange-500/40 text-orange-800 dark:text-orange-300 text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Conversation / Empty State Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {messages.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 select-none">

            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-orange-500 dark:text-orange-400 stroke-[1.5]" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[230px]">
              Answers use document metadata &amp; PDF content. Click a prompt or ask below.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] px-3 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none'
                      : 'bg-orange-50/70 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 italic py-1">
                <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing document...</span>
              </div>
            )}

            <div ref={scrollEndRef} />
          </>
        )}
      </div>

      {/* Suggested Question Chips */}
      <div className="px-4 pb-2.5 flex flex-wrap gap-1.5">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={loading}
            onClick={() => submitPrompt(question)}
            className="px-2.5 py-1.5 rounded-lg border border-dashed border-orange-300 dark:border-orange-500/30 bg-white dark:bg-slate-800/70 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-400 text-orange-800 dark:text-orange-300 text-[11px] font-medium transition-all duration-200 text-left cursor-pointer disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      {/* Bottom Input Bar */}
      <form
        onSubmit={handleFormSubmit}
        className="p-3 border-t border-orange-100 dark:border-slate-800 flex items-center gap-2 bg-orange-50/30 dark:bg-slate-900"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document..."
          className="flex-1 px-3 py-2.5 text-xs border border-orange-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          title="Ask AI Document Assistant"
          className="w-10 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-500/20"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default AiDocumentAssistant;
