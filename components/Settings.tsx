import React, { useState, useEffect } from 'react';
import { NodeRedConfig, CameraConfig, CloudConfig, AppStateSnapshot } from '../types';
import { Save, Webhook, Camera, Video, Network, Zap, Server, Cloud, Lock, Globe, Copy, Check, History, Radio } from 'lucide-react';
import HistoryManager from './HistoryManager';

interface SettingsProps {
  nodeRedConfig: NodeRedConfig;
  cameraConfig: CameraConfig;
  cloudConfig: CloudConfig;
  onSaveNodeRed: (config: NodeRedConfig) => void;
  onSaveCamera: (config: CameraConfig) => void;
  onSaveCloud: (config: CloudConfig) => void;
  history: AppStateSnapshot[];
  onSaveSnapshot: (note: string) => void;
  onRestoreSnapshot: (snapshot: AppStateSnapshot) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    nodeRedConfig, cameraConfig, cloudConfig,
    onSaveNodeRed, onSaveCamera, onSaveCloud,
    history, onSaveSnapshot, onRestoreSnapshot
}) => {
  const [localNodeRed, setLocalNodeRed] = useState<NodeRedConfig>(nodeRedConfig);
  const [localCamera, setLocalCamera] = useState<CameraConfig>(cameraConfig);
  const [localCloud, setLocalCloud] = useState<CloudConfig>(cloudConfig);
  const [isSaved, setIsSaved] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [snapshotNote, setSnapshotNote] = useState('');

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

  const handleCreateSnapshot = () => {
    if (!snapshotNote.trim()) return;
    onSaveSnapshot(snapshotNote);
    setSnapshotNote('');
  };

  const applyPreset = (type: 'frigate' | 'go2rtc') => {
    const hostname = window.location.hostname;
    if (type === 'frigate') {
        setLocalCamera({ ...localCamera, mode: 'stream', streamUrl: `/api/frigate/front_cam` });
    } else {
        setLocalCamera({ ...localCamera, mode: 'stream', streamUrl: `http://${hostname}:8555/api/stream.mjpeg?src=front_cam` });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(type);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const generateHttpFlow = () => {
    // Generates a Node-RED flow for HTTP POST (Existing Logic)
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
            "func": `// Map Frigate Event to NexSentri POST /events
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
const auth = Buffer.from('${localCloud.username}:${localCloud.password}').toString('base64');
msg.headers = {
    'Content-Type': 'application/json',
    'x-user-username': '${localCloud.username}'
};
return msg;`,
            "outputs": 1,
            "noerr": 0,
            "initialize": "",
            "finalize": "",
            "libs": [],
            "x": 550,
            "y": 100,
            "wires": [["nexsentri_post"]]
        },
        {
            "id": "nexsentri_post",
            "type": "http request",
            "z": "nexsentri_tab",
            "name": "POST to Cloud",
            "method": "POST",
            "ret": "obj",
            "paytoqs": "ignore",
            "url": `${localCloud.baseUrl}/api/events`,
            "tls": "",
            "persist": false,
            "proxy": "",
            "insecure": true,
            "authType": "",
            "x": 750,
            "y": 100,
            "wires": [["debug_log"]]
        },
        {
            "id": "debug_log",
            "type": "debug",
            "z": "nexsentri_tab",
            "name": "Log Success",
            "active": true,
            "tosidebar": true,
            "console": false,
            "tostatus": false,
            "complete": "payload",
            "targetType": "msg",
            "statusVal": "",
            "statusType": "auto",
            "x": 950,
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
        }
    ];

    copyToClipboard(JSON.stringify(flow), 'http');
  };

  const generateMqttFlow = () => {
    // Parse the WSS URL to extract hostname, port, and path for Node-RED Config
    let brokerHost = "portal.nexsentri.co.za";
    let brokerPath = "/mqtt";
    let brokerPort = "443";
    
    try {
        const urlObj = new URL(localCloud.mqttUrl);
        brokerHost = urlObj.hostname;
        brokerPath = urlObj.pathname;
        if (urlObj.port) brokerPort = urlObj.port;
        else if (urlObj.protocol === 'wss:') brokerPort = "443";
        else if (urlObj.protocol === 'ws:') brokerPort = "80";
    } catch (e) {
        // Fallback to defaults if URL invalid
    }

    const flow = [
        {
            "id": "frigate_events_in",
            "type": "mqtt in",
            "z": "nexsentri_mqtt_bridge",
            "name": "Frigate Events",
            "topic": "frigate/events",
            "qos": "0",
            "datatype": "json",
            "broker": "local_mqtt_broker",
            "x": 140,
            "y": 120,
            "wires": [["bridge_event"]]
        },
        {
            "id": "frigate_snaps_in",
            "type": "mqtt in",
            "z": "nexsentri_mqtt_bridge",
            "name": "Frigate Snapshots",
            "topic": "frigate/+/latest",
            "qos": "0",
            "datatype": "buffer",
            "broker": "local_mqtt_broker",
            "x": 150,
            "y": 200,
            "wires": [["bridge_snapshot"]]
        },
        {
            "id": "bridge_event",
            "type": "function",
            "z": "nexsentri_mqtt_bridge",
            "name": "Format Event",
            "func": `// Repackage event for remote topic
msg.topic = "${localCloud.mqttTopicPrefix}" + "events";
return msg;`,
            "outputs": 1,
            "noerr": 0,
            "initialize": "",
            "finalize": "",
            "libs": [],
            "x": 380,
            "y": 120,
            "wires": [["remote_mqtt_out"]]
        },
        {
            "id": "bridge_snapshot",
            "type": "function",
            "z": "nexsentri_mqtt_bridge",
            "name": "Format Snapshot",
            "func": `// Extract camera name from topic: frigate/<cam>/latest
const parts = msg.topic.split('/');
const camera = parts[1];
msg.topic = "${localCloud.mqttTopicPrefix}" + "feed/" + camera + "/latest";
return msg;`,
            "outputs": 1,
            "noerr": 0,
            "initialize": "",
            "finalize": "",
            "libs": [],
            "x": 380,
            "y": 200,
            "wires": [["remote_mqtt_out"]]
        },
        {
            "id": "remote_mqtt_out",
            "type": "mqtt out",
            "z": "nexsentri_mqtt_bridge",
            "name": "Remote Feed",
            "topic": "",
            "qos": "0",
            "retain": "false",
            "respTopic": "",
            "contentType": "",
            "userProps": "",
            "correl": "",
            "expiry": "",
            "broker": "remote_wss_broker",
            "x": 620,
            "y": 160,
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
            "id": "remote_wss_broker",
            "type": "mqtt-broker",
            "name": "NexSentri Cloud WSS",
            "broker": brokerHost,
            "port": brokerPort,
            "tls": "tls_conf_wss",
            "clientid": `nexsentri_${Math.floor(Math.random() * 1000)}`,
            "autoConnect": true,
            "usetls": true,
            "protocolVersion": "4",
            "keepalive": "60",
            "cleansession": true,
            "path": brokerPath,
            "birthTopic": "",
            "birthQos": "0",
            "birthPayload": "",
            "closeTopic": "",
            "closeQos": "0",
            "closePayload": "",
            "willTopic": "",
            "willQos": "0",
            "willPayload": "",
            "user": localCloud.username,
            "password": localCloud.password
        },
        {
            "id": "tls_conf_wss",
            "type": "tls-config",
            "name": "WSS TLS",
            "cert": "",
            "key": "",
            "ca": "",
            "certname": "",
            "keyname": "",
            "caname": "",
            "servername": "",
            "verifyservercert": true,
            "alpnprotocol": ""
        }
    ];

    copyToClipboard(JSON.stringify(flow), 'mqtt');
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

        {/* NexSentri Cloud Link Card */}
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
                        <p className="text-sm text-slate-400">Securely sync events to the cloud via Cloudflare Tunnel or MQTT.</p>
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
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* Credentials */}
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

                            {/* Section 1: Standard API */}
                            <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/50">
                                <h4 className="text-slate-300 text-sm font-bold mb-3 flex items-center">
                                    <Server className="w-4 h-4 mr-2 text-slate-500" />
                                    Standard Event API (HTTP)
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Portal URL</label>
                                        <input 
                                            type="url"
                                            value={localCloud.baseUrl}
                                            onChange={(e) => setLocalCloud({...localCloud, baseUrl: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generateHttpFlow}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                        {copyFeedback === 'http' ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                                        {copyFeedback === 'http' ? 'Copied!' : 'Copy HTTP Event Flow'}
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Real-time MQTT */}
                            <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-slate-300 text-sm font-bold flex items-center">
                                        <Radio className="w-4 h-4 mr-2 text-slate-500" />
                                        Real-time Feed (MQTT WSS)
                                    </h4>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={localCloud.mqttEnabled} 
                                            onChange={(e) => setLocalCloud({...localCloud, mqttEnabled: e.target.checked})} 
                                            className="sr-only peer" 
                                        />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                                    </label>
                                </div>

                                {localCloud.mqttEnabled && (
                                    <div className="space-y-3 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">WSS Broker URL</label>
                                            <input 
                                                type="url"
                                                value={localCloud.mqttUrl}
                                                onChange={(e) => setLocalCloud({...localCloud, mqttUrl: e.target.value})}
                                                placeholder="wss://portal.nexsentri.co.za/mqtt"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                            />
                                        </div>
                                         <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Topic Prefix</label>
                                            <input 
                                                type="text"
                                                value={localCloud.mqttTopicPrefix}
                                                onChange={(e) => setLocalCloud({...localCloud, mqttTopicPrefix: e.target.value})}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={generateMqttFlow}
                                            className="w-full flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-sky-900/20"
                                        >
                                            {copyFeedback === 'mqtt' ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                                            {copyFeedback === 'mqtt' ? 'Copied!' : 'Copy MQTT Bridge Flow'}
                                        </button>
                                        <p className="text-[10px] text-slate-500 text-center">
                                            Bridges <code>frigate/events</code> and <code>frigate/+/latest</code> (snapshots) to remote.
                                        </p>
                                    </div>
                                )}
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
        
        {/* Version History & Backup */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-emerald-900/30 rounded-lg mr-3">
                    <History className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Version History & Backups</h3>
                    <p className="text-sm text-slate-400">Save your current configuration state or restore previous versions.</p>
                </div>
            </div>
            
            <div className="flex gap-3 mb-6">
                <input 
                    type="text"
                    value={snapshotNote}
                    onChange={(e) => setSnapshotNote(e.target.value)}
                    placeholder="Describe this version (e.g., 'Stable Setup V1')"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <button
                    type="button"
                    onClick={handleCreateSnapshot}
                    disabled={!snapshotNote.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Snapshot
                </button>
            </div>

            <HistoryManager history={history} onRestore={onRestoreSnapshot} />
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