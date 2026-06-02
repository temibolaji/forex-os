import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { API_URL } from '../store/authStore';
import { useTradeStore } from '../store/tradeStore';

export default function Coach() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'coach', text: string }[]>([
    { role: 'coach', text: "Hello! I'm ForexGPT, your AI trading coach. I have analyzed your recent trade history. What would you like to discuss today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const trades = useTradeStore(state => state.trades);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('forexos_token')}`
        },
        body: JSON.stringify({ 
          message: userMessage,
          trades: trades // Pass context so the AI knows how they trade
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'coach', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'coach', text: "I'm having trouble connecting to my neural network right now. Please check your API keys or try again later." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'coach', text: "Network error! Unable to reach the coaching server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] md:h-screen flex flex-col animate-in fade-in duration-500 font-sans">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center space-x-3">
          <span>AI Trading Coach</span>
          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles size={12} />
            <span>ForexGPT</span>
          </span>
        </h1>
        <p className="text-slate-400 mt-1 font-medium text-sm">Get personalized insights based on your actual journal data.</p>
      </div>

      <div className="flex-1 glass-panel bg-slate-900/60 rounded-3xl border border-white/10 shadow-xl flex flex-col overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'coach' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-700 text-slate-300'}`}>
                  {msg.role === 'coach' ? <Bot size={16} /> : <User size={16} />}
                </div>

                <div className={`mx-3 p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>

              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                  <Bot size={16} />
                </div>
                <div className="mx-3 p-4 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-sm shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/80 border-t border-white/10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium text-white placeholder-slate-500 shadow-inner"
              placeholder="Ask about your performance, risk management, or strategy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:hover:bg-indigo-500 disabled:shadow-none active:scale-95"
            >
              <Send size={20} className="transform translate-x-px -translate-y-px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
