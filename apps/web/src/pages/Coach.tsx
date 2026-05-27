import { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function Coach() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'coach', text: string }[]>([
    { role: 'coach', text: "Hello! I'm ForexGPT, your AI trading coach. I have analyzed your recent trade history. What would you like to discuss today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages([...messages, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    // Mock API call to /api/v1/coach/chat
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'coach', 
        text: "Based on your data, your win rate is solid at 58%, but I noticed your average loss is slightly larger than your average win when trading the Tokyo session. This is dragging your expectancy down. I recommend avoiding JPY pairs during low volatility periods." 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] md:h-screen flex flex-col animate-in fade-in duration-500">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center space-x-3">
          <span>AI Trading Coach</span>
          <span className="bg-brand/10 text-brand text-xs px-2 py-1 rounded-full font-bold flex items-center space-x-1">
            <Sparkles size={12} />
            <span>ForexGPT</span>
          </span>
        </h1>
        <p className="text-slate-500 mt-1">Get personalized insights based on your actual journal data.</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'coach' ? 'bg-brand text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {msg.role === 'coach' ? <Bot size={18} /> : <User size={18} />}
                </div>

                <div className={`mx-3 p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-brand text-white rounded-tr-none' 
                    : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>

              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-brand text-white">
                  <Bot size={18} />
                </div>
                <div className="mx-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 rounded-tl-none shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-sm"
              placeholder="Ask about your performance, risk management, or strategy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-brand text-white rounded-xl hover:bg-brand-light transition-colors shadow-md disabled:opacity-50 disabled:hover:bg-brand"
            >
              <Send size={20} className="transform translate-x-px -translate-y-px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
