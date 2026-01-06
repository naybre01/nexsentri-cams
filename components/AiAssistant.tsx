import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SystemStats } from '../types';
import { chatWithSystem } from '../services/geminiService';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface AiAssistantProps {
  currentStats: SystemStats;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ currentStats }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: 'Hello. I am NexSentri AI. I am monitoring your Raspberry Pi 4 dashcam system. How can I assist you?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Prepare context
    const context = `CPU: ${currentStats.cpuUsage}%, Temp: ${currentStats.temp}C, RAM: ${currentStats.memoryUsage}MB`;
    const responseText = await chatWithSystem(input, context);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 border-b border-slate-700 flex items-center">
        <div className="p-2 bg-indigo-500 rounded-lg mr-3 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
            <h3 className="font-bold text-slate-100">NexSentri Intelligence</h3>
            <p className="text-xs text-indigo-300">Powered by Gemini 3 Flash</p>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-accent-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-50 text-xs font-mono uppercase">
                 {msg.role === 'user' ? <User className="w-3 h-3"/> : <Bot className="w-3 h-3"/>}
                 <span>{msg.role === 'user' ? 'You' : 'AI System'}</span>
              </div>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex justify-start">
             <div className="bg-slate-700 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
               <Bot className="w-4 h-4 text-slate-400" />
               <div className="flex space-x-1">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-0"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
               </div>
             </div>
           </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask system status or about detection logs..."
            className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiAssistant;
