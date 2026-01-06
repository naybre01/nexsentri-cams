import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CameraFeed from './components/CameraFeed';
import SystemStatsWidget from './components/SystemStatsWidget';
import EventList from './components/EventList';
import Settings from './components/Settings';
import AiAssistant from './components/AiAssistant';
import { AppView, FrigateEvent, SystemStats, NodeRedConfig, CameraConfig } from './types';
import { Menu, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // -- CONFIG STATE --
  const [nodeRedConfig, setNodeRedConfig] = useState<NodeRedConfig>({
    webhookUrl: process.env.VITE_DEFAULT_WEBHOOK_URL || 'http://localhost:1880/event',
    enabled: false,
    notifyOnPerson: true,
    notifyOnVehicle: true
  });

  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    mode: 'stream', // Default to stream to avoid hardware lock errors with Frigate
    streamUrl: process.env.VITE_DEFAULT_STREAM_URL || 'http://localhost:1880/stream'
  });
  
  // -- MOCK DATA STATE --
  const [events, setEvents] = useState<FrigateEvent[]>([]);
  const [statsHistory, setStatsHistory] = useState<SystemStats[]>([]);
  const [currentStats, setCurrentStats] = useState<SystemStats>({
    cpuUsage: 0, memoryUsage: 0, temp: 0, storageUsed: 0, storageTotal: 32, timestamp: 0
  });

  // Simulator Effect (CPU/Temp/Events)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Sim Stats
      const now = Date.now();
      const newStat: SystemStats = {
        cpuUsage: 15 + Math.random() * 20, // 15-35%
        memoryUsage: 2048 + Math.random() * 512, // ~2.5GB
        temp: 45 + Math.random() * 10, // 45-55C
        storageUsed: 45, // static for now
        storageTotal: 32,
        timestamp: now
      };
      
      setCurrentStats(newStat);
      setStatsHistory(prev => {
        const next = [...prev, newStat];
        if (next.length > 20) next.shift();
        return next;
      });

      // 2. Sim Random Event (Rarely)
      if (Math.random() > 0.98) {
        const type = Math.random() > 0.5 ? 'person' : 'car';
        const newEvent: FrigateEvent = {
          id: now.toString(),
          label: type,
          camera: 'front_cam',
          startTime: now / 1000,
          thumbnail: `https://picsum.photos/seed/${now}/800/600`,
          hasClip: true,
          score: 0.7 + Math.random() * 0.25
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 50));
      }

    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const triggerManualEvent = () => {
    const now = Date.now();
    const newEvent: FrigateEvent = {
      id: now.toString(),
      label: 'person',
      camera: 'front_cam',
      startTime: now / 1000,
      thumbnail: `https://picsum.photos/seed/${now}/800/600`,
      hasClip: true,
      score: 0.88
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  return (
    <div className="flex h-screen bg-brand-900 text-slate-200 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isMobileOpen={isMobileMenuOpen}
        closeMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-brand-800 border-b border-slate-700 flex items-center px-4 justify-between shrink-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-200 p-2">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">NexSentri</span>
          <div className="w-8"></div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {/* View: Dashboard */}
          {currentView === AppView.DASHBOARD && (
            <>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-2/3 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-100">Live Monitor</h2>
                    <button 
                      onClick={triggerManualEvent}
                      className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 rounded-md text-slate-400 transition-colors flex items-center"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Sim Event
                    </button>
                  </div>
                  <CameraFeed config={cameraConfig} />
                  <SystemStatsWidget statsHistory={statsHistory} currentStats={currentStats} />
                </div>

                <div className="lg:w-1/3 flex flex-col h-full">
                  <h2 className="text-xl font-bold text-slate-100 mb-4">Recent Detections</h2>
                  <div className="flex-1 overflow-y-auto min-h-[400px]">
                    <EventList events={events.slice(0, 5)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* View: Events */}
          {currentView === AppView.EVENTS && (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-100">Event History</h2>
                <span className="text-sm text-slate-500 font-mono">Total: {events.length}</span>
              </div>
              <EventList events={events} />
            </div>
          )}

          {/* View: AI */}
          {currentView === AppView.AI_INSIGHTS && (
             <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
                <AiAssistant currentStats={currentStats} />
             </div>
          )}

          {/* View: Settings */}
          {currentView === AppView.SETTINGS && (
            <Settings 
              nodeRedConfig={nodeRedConfig} 
              onSaveNodeRed={setNodeRedConfig} 
              cameraConfig={cameraConfig}
              onSaveCamera={setCameraConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;