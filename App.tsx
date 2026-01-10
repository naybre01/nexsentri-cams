import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import Sidebar from './components/Sidebar';
import CameraFeed from './components/CameraFeed';
import SystemStatsWidget from './components/SystemStatsWidget';
import EventList from './components/EventList';
import Settings from './components/Settings';
import AiAssistant from './components/AiAssistant';
import { AppView, FrigateEvent, SystemStats, NodeRedConfig, CameraConfig, CloudConfig } from './types';
import { Menu, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  
  // -- CONFIG STATE --
  const [nodeRedConfig, setNodeRedConfig] = useState<NodeRedConfig>({
    webhookUrl: process.env.VITE_DEFAULT_WEBHOOK_URL || `http://${window.location.hostname}:1880/event`,
    enabled: false,
    notifyOnPerson: true,
    notifyOnVehicle: true
  });

  const [cameraConfig, setCameraConfig] = useState<CameraConfig>(() => {
    return {
      mode: 'stream',
      streamUrl: `/api/frigate/front_cam`
    };
  });

  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({
    enabled: false,
    baseUrl: 'https://portal.nexsentri.co.za',
    username: '',
    password: ''
  });

  // -- DATA STATE --
  const [events, setEvents] = useState<FrigateEvent[]>([]);
  const [statsHistory, setStatsHistory] = useState<SystemStats[]>([]);
  const [currentStats, setCurrentStats] = useState<SystemStats>({
    cpuUsage: 0, memoryUsage: 0, temp: 0, storageUsed: 0, storageTotal: 32, timestamp: 0
  });

  // Fetch initial history
  const fetchFrigateEvents = async () => {
    try {
      const response = await fetch('/api/frigate/events?limit=20');
      if (!response.ok) return;
      
      const data = await response.json();
      const realEvents: FrigateEvent[] = data.map((e: any) => ({
        id: e.id,
        label: e.label,
        camera: e.camera,
        startTime: e.start_time,
        thumbnail: `/api/frigate/events/${e.id}/thumbnail.jpg`, 
        hasClip: e.has_clip,
        score: e.top_score || e.data?.score || 0
      }));

      setEvents(realEvents);
    } catch (error) {
      console.warn("Could not fetch Frigate events", error);
    }
  };

  // MQTT Connection for Real-time Events
  useEffect(() => {
    // Connect to the local Mosquitto broker over WebSockets (port 9001)
    // Note: The broker must be configured with a websocket listener on 9001
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const client = mqtt.connect(`${protocol}://${host}:9001`, {
        clientId: `nexsentri_cam_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
    });

    client.on('connect', () => {
        console.log('Connected to Local MQTT');
        setMqttConnected(true);
        client.subscribe('frigate/events');
    });

    client.on('message', (topic, message) => {
        if (topic === 'frigate/events') {
            try {
                const payload = JSON.parse(message.toString());
                const eventData = payload.after;
                // 'type' can be: new, update, end
                // We only care about adding new ones or updating existing ones
                
                const newEvent: FrigateEvent = {
                    id: eventData.id,
                    label: eventData.label,
                    camera: eventData.camera,
                    startTime: eventData.start_time,
                    thumbnail: `/api/frigate/events/${eventData.id}/thumbnail.jpg`,
                    hasClip: eventData.has_clip,
                    score: eventData.top_score || eventData.score || 0
                };

                setEvents(prevEvents => {
                    // Check if event exists
                    const exists = prevEvents.find(e => e.id === newEvent.id);
                    if (exists) {
                        // Update existing
                        return prevEvents.map(e => e.id === newEvent.id ? newEvent : e);
                    } else {
                        // Prepend new
                        return [newEvent, ...prevEvents];
                    }
                });
            } catch (e) {
                console.error('Failed to parse MQTT message', e);
            }
        }
    });

    client.on('error', (err) => {
        console.warn('MQTT Error', err);
        setMqttConnected(false);
    });

    return () => {
        client.end();
    };
  }, []);

  // Sim Stats Loop
  useEffect(() => {
    // Initial fetch for history
    fetchFrigateEvents();

    const timer = setInterval(() => {
      const now = Date.now();
      const newStat: SystemStats = {
        cpuUsage: 15 + Math.random() * 20,
        memoryUsage: 2048 + Math.random() * 512,
        temp: 45 + Math.random() * 10,
        storageUsed: 45,
        storageTotal: 32,
        timestamp: now
      };
      
      setCurrentStats(newStat);
      setStatsHistory(prev => {
        const next = [...prev, newStat];
        if (next.length > 20) next.shift();
        return next;
      });
      // Note: We removed polling for events since we now use MQTT
    }, 5000);

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
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        Live Monitor
                        {mqttConnected && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Real-time MQTT</span>}
                    </h2>
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
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;