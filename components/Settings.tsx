import React, { useState, useEffect } from 'react';
import { NodeRedConfig, CameraConfig, CloudConfig } from '../types';
import { Save, Webhook, Camera, Video, Network, Zap, Server, Activity, Cloud, Lock, Globe, Copy, Check } from 'lucide-react';

interface SettingsProps {
  nodeRedConfig: NodeRedConfig;
  cameraConfig: CameraConfig;
  cloudConfig: CloudConfig;
  onSaveNodeRed: (config: NodeRedConfig) => void;
  onSaveCamera: (config: CameraConfig) => void;
  onSaveCloud: (config: CloudConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    nodeRedConfig, cameraConfig, cloudConfig,
    onSaveNodeRed, onSaveCamera, onSaveCloud 
}) => {
  const [localNodeRed, setLocalNodeRed] = useState<NodeRedConfig>(nodeRedConfig);
  const [localCamera, setLocalCamera] = useState<CameraConfig>(cameraConfig);
  const [localCloud, setLocalCloud] = useState<CloudConfig>(cloudConfig);
  const [isSaved, setIsSaved] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // When the props from App.tsx change, update the local state
  useEffect(() => {
    setLocalNodeRed(nodeRedConfig);
    setLocalCamera(cameraConfig);
    setLocalCloud(cloudConfig);
  }, [nodeRedConfig, cameraConfig, cloudConfig]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNodeRed(localNodeRed);
    onSaveCamera(localCamera);
    onSaveCloud(localCloud);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const applyPreset = (type: 'frigate' | 'go2rtc') => {
    const hostname = window.location.hostname;
    if (type === 'frigate') {
        setLocalCamera({ ...localCamera, mode: 'stream', streamUrl: `/api/frigate/front_cam` });
    } else {
        setLocalCamera({ ...localCamera, mode: 'stream', streamUrl: `http://${hostname}:8555/api/stream.mjpeg?src=front_cam` });
    }
  };

  const generateNodeRedFlow = () => {
    // Generates a Node-RED flow that listens to local MQTT and pushes to Remote NexSentri API via MQTT (WSS)
    // as requested by the user ("via Node-RED and MQTT")
    const flow = [
        {
            "id": "frigate_mqtt_in",
            "type": "mqtt in",
            "z": "nexsentri_tab",
            "name": "Local Frigate Events",
            "topic": "frigate/events",
            "qos": "0",
            "datatype": "json",
            "broker": "local_mqtt_broker",
            "x": 150,
            "y": 100,
            "wires": [["filter_ended"]]
        },
        {
            "id": "filter_ended",
            "type": "switch",
            "z": "nexsentri_tab",
            "name": "Filter Ended",
            "property": "payload.type",
            "propertyType": "msg",
            "rules": [
                { "t": "eq", "v": "end", "vt": "str" }
            ],
            "checkall": "true",
            "repair": false,
            "outputs": 1,
            "x": 350,
            "y": 100,
            "wires": [["transform_nexsentri"]]
        },
        {
            "id": "transform_nexsentri",
            "type": "function",
            "z": "nexsentri_tab",
            "name": "Format for NexSentri",
            "func": `// Map Frigate Event to NexSentri Format
const event = msg.payload.after;

msg.payload = {
    cameraName: event.camera,
    description: \`Detected \${event.label} with \${(event.top_score*100).toFixed(0)}% confidence.\`,
    urgency: event.label === 'person' ? 'High' : 'Medium',
    timestamp: new Date(event.start_time * 1000).toISOString(),
    status: 'New',
    metadata: {
        frigate_id: event.id,
        score: event.top_score,
        has_clip: event.has_clip
    }
};

return msg;`,
            "outputs": 1,
            "noerr": 0,
            "initialize": "",
            "finalize": "",
            "libs": [],
            "x": 550,
            "y": 100,
            "wires": [["nexsentri_mqtt_out"]]
        },
        {
            "id": "nexsentri_mqtt_out",
            "type": "mqtt out",
            "z": "nexsentri_tab",
            "name": "Cloud MQTT",
            "topic": "nexsentri/events",
            "qos": "1",
            "retain": "",
            "respTopic": "",
            "contentType": "",
            "userProps": "",
            "correl": "",
            "expiry": "",
            "broker": "remote_mqtt_broker",
            "x": 800,
            "y": 100,
            "wires": []
        },
        {
            "id": "local_mqtt_broker",
            "type": "mqtt-broker",
            "name": "Local MQTT",
            "broker": "localhost",
            "port": "1883",
            "clientid": "",
            "autoConnect": true,
            "usetls": false,
            "protocolVersion": "4",
            "keepalive": "60",
            "cleansession": true,
            "birthTopic": "",
            "birthQos": "0",
            "birthPayload": "",
            "closeTopic": "",
            "closeQos": "0",
            "closePayload": "",
            "willTopic": "",
            "willQos": "0",
            "willPayload": ""
        },
        {
            "id": "remote_mqtt_broker",
            "type": "mqtt-broker",
            "name": "NexSentri Cloud",
            "broker": "portal.nexsentri.co.za",
            "port": "443", // WSS Port
            "clientid": `nexsentri_pi_${Math.floor(Math.random() * 1000)}`,
            "autoConnect": true,
            "usetls": true, // Enable TLS for WSS
            "protocolVersion": "4",
            "keepalive": "60",
            "cleansession": true,
            "birthTopic": "",
            "birthQos": "0",
            "birthPayload": "",
            "closeTopic": "",
            "closeQos": "0",
            "closePayload": "",
            "willTopic": "",
            "willQos": "0",
            "willPayload": "",
            "credentials": {
                "user": localCloud.username,
                "password": localCloud.password
            }
        }
    ];

    navigator.clipboard.writeText(JSON.stringify(flow));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">System Configuration</h2>
        <p className="text-slate-400">Manage Camera, Node-RED, and Cloud integration settings.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Camera Config Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-900/30 rounded-lg mr-3">
                    <Camera className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Video Source</h3>
                    <p className="text-sm text-slate-400">Choose between local USB or Network Stream</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex space-x-4 mb-4">
                    <button
                        type="button"
                        onClick={() => setLocalCamera({ ...localCamera, mode: 'local' })}
                        className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center space-x-2 transition-all ${
                            localCamera.mode === 'local' 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <Video className="w-4 h-4" />
                        <span>Local USB</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setLocalCamera({ ...localCamera, mode: 'stream' })}
                        className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center space-x-2 transition-all ${
                            localCamera.mode === 'stream' 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <Network className="w-4 h-4" />
                        <span>Stream (Frigate)</span>
                    </button>
                </div>

                {localCamera.mode === 'stream' && (
                    <div className="animate-fade-in space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Stream URL (MJPEG)</label>
                            <input 
                                type="url"
                                value={localCamera.streamUrl}
                                onChange={(e) => setLocalCamera({...localCamera, streamUrl: e.target.value})}
                                placeholder="/api/frigate/front_cam"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>
                        
                        <div className="flex gap-2">
                           <button 
                             type="button"
                             onClick={() => applyPreset('frigate')}
                             className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 flex items-center justify-center gap-2 transition-colors"
                           >
                             <Server className="w-3 h-3" />
                             Use Frigate Proxy (Port 80)
                           </button>
                           <button 
                             type="button"
                             onClick={() => applyPreset('go2rtc')}
                             className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs text-emerald-400 border border-emerald-900/30 flex items-center justify-center gap-2 transition-colors"
                           >
                             <Zap className="w-3 h-3" />
                             Use Go2RTC (Fast, Port 8555)
                           </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* NexSentri Cloud Link Card (NEW) */}
        <div className="bg-slate-800 border border-sky-700/50 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Cloud className="w-32 h-32 text-sky-400" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-sky-900/30 rounded-lg mr-3">
                        <Globe className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200">NexSentri Cloud Link</h3>
                        <p className="text-sm text-slate-400">Securely sync events to the cloud via Cloudflare Tunnel</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center space-x-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition bg-slate-900/50">
                        <input 
                            type="checkbox" 
                            checked={localCloud.enabled}
                            onChange={(e) => setLocalCloud({...localCloud, enabled: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-600 text-sky-500 focus:ring-offset-slate-800 focus:ring-sky-500 bg-slate-900" 
                        />
                        <span className="text-slate-200 font-medium">Enable Cloud Synchronization</span>
                    </label>

                    {localCloud.enabled && (
                        <div className="space-y-3 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Portal URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="url"
                                        value={localCloud.baseUrl}
                                        onChange={(e) => setLocalCloud({...localCloud, baseUrl: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                                    <input 
                                        type="text"
                                        value={localCloud.username}
                                        onChange={(e) => setLocalCloud({...localCloud, username: e.target.value})}
                                        placeholder="pat_demo_01"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input 
                                            type="password"
                                            value={localCloud.password}
                                            onChange={(e) => setLocalCloud({...localCloud, password: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50">
                                <div className="flex items-center justify-between bg-sky-900/20 p-4 rounded-lg border border-sky-800/30">
                                    <div>
                                        <h4 className="text-sky-300 font-bold text-sm">Node-RED Configuration</h4>
                                        <p className="text-xs text-sky-400/70 mt-1 max-w-sm">
                                            Generate a pre-configured Flow to bridge local MQTT events to the NexSentri Cloud API via WSS MQTT.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generateNodeRedFlow}
                                        className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-sky-900/20"
                                    >
                                        {copyFeedback ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                        {copyFeedback ? 'Copied!' : 'Copy Flow JSON'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Paste this JSON into Node-RED (Menu &gt; Import) to enable the link.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Integration Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-red-900/30 rounded-lg mr-3">
                    <Webhook className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Local Integrations</h3>
                    <p className="text-sm text-slate-400">Configure local webhook forwarding</p>
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="border-t border-slate-700 pt-4">
                    <label className="flex items-center space-x-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition mb-4">
                        <input 
                            type="checkbox" 
                            checked={localNodeRed.enabled}
                            onChange={(e) => setLocalNodeRed({...localNodeRed, enabled: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-offset-slate-800 focus:ring-indigo-500 bg-slate-900" 
                        />
                        <span className="text-slate-200 font-medium">Enable Local Webhook</span>
                    </label>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Webhook URL</label>
                        <input 
                            type="url"
                            value={localNodeRed.webhookUrl}
                            onChange={(e) => setLocalNodeRed({...localNodeRed, webhookUrl: e.target.value})}
                            placeholder="http://localhost:1880/event"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            disabled={!localNodeRed.enabled}
                        />
                         <p className="text-xs text-slate-500 mt-2">
                            Legacy: Frigate will send JSON payloads to this URL when a Person or Vehicle is detected.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Save Action */}
        <div className="flex justify-end pt-2 pb-10">
            <button 
                type="submit"
                className={`flex items-center px-6 py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${isSaved ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
                <Save className="w-5 h-5 mr-2" />
                {isSaved ? 'Settings Saved!' : 'Save All Changes'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;