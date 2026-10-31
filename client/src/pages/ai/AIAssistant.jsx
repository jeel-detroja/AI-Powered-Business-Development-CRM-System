import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService } from '../../services/index';
import { getErrorMessage } from '../../utils/index';
import { toast } from 'sonner';
import {
  Bot, Send, Sparkles, User, AlertCircle, RefreshCw, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Which leads should I prioritize today?',
  'Summarize my hottest leads and their requirements.',
  'What is my overall sales performance and conversion rate?',
  'Are there any overdue follow-ups or activities?',
  'Which deals in my pipeline need immediate attention?',
  'Suggest a conversion strategy for high-priority enterprise leads.',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your Nexora AI Sales Intelligence Assistant powered by Google Gemini. I have real-time access to your leads, deals, tasks, and follow-ups. How can I help you accelerate sales today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (msg) => aiService.chat({ message: msg, conversationId }),
    onSuccess: (res) => {
      const data = res.data.data;
      if (data.conversationId) setConversationId(data.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Analysis completed.',
          functionResults: data.functionResults,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
    onError: (err) => {
      const errMsg = getErrorMessage(err);
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Unable to process request: ${errMsg}. Please verify that GEMINI_API_KEY is configured in your backend environment.`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
  });

  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || chatMutation.isPending) return;

    const userMsg = {
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    chatMutation.mutate(text);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Sales Assistant</h1>
            <p className="text-xs text-gray-500">Autonomous CRM agent powered by Google Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active & Grounded to Workspace</span>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="card flex-1 flex flex-col overflow-hidden bg-white">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-100">
                  <Bot size={18} />
                </div>
              )}

              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : m.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-50 text-gray-800 border border-gray-100'
              }`}>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                  {m.content}
                </div>

                {/* Show function call results if present */}
                {m.functionResults && m.functionResults.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200/60 text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700">Function Execution:</p>
                    {m.functionResults.map((fr, fIdx) => (
                      <div key={fIdx} className="bg-white/80 p-1.5 rounded border border-gray-200 font-mono text-[11px]">
                        ✓ Executed <strong>{fr.name}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] mt-1 text-right ${m.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {m.time}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 items-center text-gray-400 text-xs py-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100 animate-pulse">
                <Sparkles size={16} />
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-gray-500 text-xs">Analyzing CRM database records...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Queries */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex gap-2 overflow-x-auto text-xs">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600 flex-shrink-0 transition-colors shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              className="input flex-1 py-2.5 bg-gray-50 focus:bg-white"
              placeholder="Ask anything about your pipeline, leads, deals, or sales advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="btn-primary py-2.5 px-4"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
