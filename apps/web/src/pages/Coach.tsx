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
        text: "The AI coach backend is currently under construction. Please check back later!" 
      }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] md:h-screen flex flex-col animate-in fade-in duration-500 font-inter">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center space-x-3">
          <span>AI Trading Coach</span>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold flex items-center space-x-1">
            <Sparkles size={12} />
            <span>ForexGPT</span>
          </span>
        </h1>
        <p className="text-slate-500 mt-1">Get personalized insights based on your actual journal data.</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'coach' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'}`}>
                  {msg.role === 'coach' ? <Bot size={18} /> : <User size={18} />}
                </div>

                <div className={`mx-3 p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>

              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 text-white shadow-md">
                  <Bot size={18} />
                </div>
                <div className="mx-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-none shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium"
              placeholder="Ask about your performance, risk management, or strategy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:shadow-none"
            >
              <Send size={20} className="transform translate-x-px -translate-y-px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
