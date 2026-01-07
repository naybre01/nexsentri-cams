import React from 'react';
import { AppStateSnapshot } from '../types';
import { History, CheckCircle, GitCommit } from 'lucide-react';

interface HistoryManagerProps {
  history: AppStateSnapshot[];
  onRestore: (snapshot: AppStateSnapshot) => void;
}

const HistoryManager: React.FC<HistoryManagerProps> = ({ history, onRestore }) => {
  // Show history in reverse chronological order
  const reversedHistory = [...history].reverse();

  if (history.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No configuration history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reversedHistory.map((snapshot, index) => {
        const isCurrent = index === 0;
        return (
          <div 
            key={snapshot.timestamp} 
            className={`p-4 rounded-lg border transition-all ${isCurrent ? 'bg-slate-700/50 border-accent-600/50' : 'bg-slate-900/50 border-slate-700'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className={`font-semibold flex items-center mb-1 ${isCurrent ? 'text-accent-400' : 'text-slate-300'}`}>
                  {isCurrent ? <CheckCircle className="w-4 h-4 mr-2" /> : <GitCommit className="w-4 h-4 mr-2 text-slate-500" />}
                  {new Date(snapshot.timestamp).toLocaleString()}
                </div>
                <p className="text-sm text-slate-400 italic">
                  "{snapshot.note}"
                </p>
                <span className="text-xs text-slate-500 font-mono mt-2 block">
                  v{snapshot.version}
                </span>
              </div>
              {!isCurrent && (
                <button 
                  onClick={() => onRestore(snapshot)}
                  className="px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-800/50 hover:bg-indigo-700/50 border border-indigo-700 rounded-md transition-colors shrink-0"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryManager;