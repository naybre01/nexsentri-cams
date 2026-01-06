import React, { useState } from 'react';
import { FrigateEvent } from '../types';
import { Car, User, Clock, ShieldCheck, PlayCircle, Loader2 } from 'lucide-react';
import { analyzeEvent } from '../services/geminiService';

interface EventListProps {
  events: FrigateEvent[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{id: string, text: string} | null>(null);

  const handleAnalyze = async (event: FrigateEvent) => {
    setAnalyzingId(event.id);
    const result = await analyzeEvent(event);
    setAnalysisResult({ id: event.id, text: result });
    setAnalyzingId(null);
  };

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No security events detected recently.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
          <div className="flex flex-col sm:flex-row">
            {/* Thumbnail */}
            <div className="relative w-full sm:w-48 h-32 bg-slate-900 shrink-0 group">
              <img 
                src={event.thumbnail} 
                alt="Event thumbnail" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-mono">
                {Math.floor(event.score * 100)}%
              </div>
            </div>

            {/* Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    {event.label.toLowerCase() === 'person' ? (
                      <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg">
                        <Car className="w-4 h-4" />
                      </div>
                    )}
                    <h3 className="font-semibold text-slate-200 capitalize">{event.label} Detected</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(event.startTime * 1000).toLocaleTimeString()}
                  </span>
                </div>
                
                {/* AI Analysis Section */}
                {analysisResult && analysisResult.id === event.id ? (
                  <div className="mt-2 p-3 bg-brand-900/50 rounded-lg border border-slate-700/50 text-sm text-slate-300">
                    <div className="flex items-center mb-1 text-accent-500 text-xs font-bold uppercase tracking-wide">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Gemini Assessment
                    </div>
                    {analysisResult.text}
                  </div>
                ) : (
                   <p className="text-sm text-slate-400">
                    Motion detected on {event.camera}. Clip available for review.
                  </p>
                )}
              </div>

              <div className="mt-4 flex space-x-3">
                 <button 
                    onClick={() => handleAnalyze(event)}
                    disabled={analyzingId === event.id}
                    className="text-xs font-medium text-accent-500 hover:text-accent-400 disabled:opacity-50 flex items-center"
                 >
                    {analyzingId === event.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>Ask Gemini AI</>
                    )}
                 </button>
                 <button className="text-xs font-medium text-slate-500 hover:text-slate-300">
                    Send to Node-RED
                 </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;
