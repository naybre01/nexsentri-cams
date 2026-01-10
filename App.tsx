import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CameraFeed from './components/CameraFeed';
import SystemStatsWidget from './components/SystemStatsWidget';
import EventList from './components/EventList';
import Settings from './components/Settings';
import AiAssistant from './components/AiAssistant';
import { AppView, FrigateEvent, SystemStats, NodeRedConfig, CameraConfig, CloudConfig, AppStateSnapshot } from './types';
import { Menu, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // -- CONFIG STATE --
  const [nodeRedConfig, setNodeRedConfig] = useState<NodeRedConfig>({
    webhookUrl: process.env.VITE_DEFAULT_WEBHOOK_URL || `http://${window.location.hostname}:1880/event`,
    enabled: false,
    notifyOnPerson: true,
    notifyOnVehicle: true
  });

  const [cameraConfig, setCameraConfig] = useState<CameraConfig>(() => {
    // Smart Default: Use the Nginx proxy path relative to the dashboard.
    // This routes /api/frigate/... -> http://frigate:5000/api/...
    // Frigate MJPEG stream is at /api/<camera_name>
    return {
      mode: 'stream',
      streamUrl: `/api/frigate/front_cam`
    };
  });

  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({
    enabled: false,
    baseUrl: 'https://portal.nexsentri.co.za',
    username: '',
    password: '',
    mqttEnabled: false,
    mqttUrl: 'wss://portal.nexsentri.co.za/mqtt',
    mqttTopicPrefix: 'nexsentri/feed/'
  });

  // -- HISTORY STATE --
  const [history, setHistory] = useState<AppStateSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('nexsentri_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nexsentri_history', JSON.stringify(history));
  }, [history]);

  // -- DATA STATE --
  const [events, setEvents] = useState<FrigateEvent[]>([]);
  const [statsHistory, setStatsHistory] = useState<SystemStats[]>([]);
  const [currentStats, setCurrentStats] = useState<SystemStats>({
    cpuUsage: 0, memoryUsage: 0, temp: 0, storageUsed: 0, storageTotal: 32, timestamp: 0
  });

  // Real Data Fetcher for Events
  const fetchFrigateEvents = async () => {
    try {
      // Fetch from the Nginx proxy (which points to Frigate:5000)
      const response = await fetch('/api/frigate/events?limit=20');
      if (!response.ok) return; // Fail silently if Frigate is down
      
      const data = await response.json();
      
      // Map Frigate API response to our App format
      const realEvents: FrigateEvent[] = data.map((e: any) => ({
        id: e.id,
        label: e.label,
        camera: e.camera,
        startTime: e.start_time,
        // Construct thumbnail URL via proxy
        thumbnail: `/api/frigate/events/${e.id}/thumbnail.jpg`, 
        hasClip: e.has_clip,
        score: e.top_score || e.data?.score || 0
      }));

      setEvents(realEvents);
    } catch (error) {
      console.warn("Could not fetch Frigate events (is the proxy running?)", error);
    }
  };

  // Main Loop (Stats Sim + Real Event Polling)
  useEffect(() => {
    // Initial fetch
    fetchFrigateEvents();

    const timer = setInterval(() => {
      // 1. Sim Stats (Still simulated as we don't have a backend agent for Pi stats yet)
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

      // 2. Poll Real Events
      fetchFrigateEvents();

    }, 5000); // Poll every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const triggerManualEvent = () => {
    // Allows testing UI without real events
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

  // -- HISTORY HANDLERS --
  const handleSaveSnapshot = (note: string) => {
    const newSnapshot: AppStateSnapshot = {
      timestamp: Date.now(),
      note,
      version: history.length + 1,
      nodeRedConfig: { ...nodeRedConfig },
      cameraConfig: { ...cameraConfig },
      cloudConfig: { ...cloudConfig }
    };
    setHistory(prev => [...prev, newSnapshot]);
  };

  const handleRestoreSnapshot = (snapshot: AppStateSnapshot) => {
    if (confirm(`Are you sure you want to restore version v${snapshot.version}? Current unsaved changes will be lost.`)) {
      setNodeRedConfig(snapshot.nodeRedConfig);
      setCameraConfig(snapshot.cameraConfig);
      setCloudConfig(snapshot.cloudConfig);
    }
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
              cloudConfig={cloudConfig}
              onSaveCloud={setCloudConfig}
              history={history}
              onSaveSnapshot={handleSaveSnapshot}
              onRestoreSnapshot={handleRestoreSnapshot}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;