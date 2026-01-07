import React, { useState, useEffect } from 'react';
import { NodeRedConfig, CameraConfig } from '../types';
import { Save, Webhook, Camera, Video, Network } from 'lucide-react';

interface SettingsProps {
  nodeRedConfig: NodeRedConfig;
  cameraConfig: CameraConfig;
  onSaveNodeRed: (config: NodeRedConfig) => void;
  onSaveCamera: (config: CameraConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ nodeRedConfig, cameraConfig, onSaveNodeRed, onSaveCamera }) => {
  const [localNodeRed, setLocalNodeRed] = useState<NodeRedConfig>(nodeRedConfig);
  const [localCamera, setLocalCamera] = useState<CameraConfig>(cameraConfig);
  const [isSaved, setIsSaved] = useState(false);

  // When the props from App.tsx change, update the local state
  useEffect(() => {
    setLocalNodeRed(nodeRedConfig);
    setLocalCamera(cameraConfig);
  }, [nodeRedConfig, cameraConfig]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNodeRed(localNodeRed);
    onSaveCamera(localCamera);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">System Configuration</h2>
        <p className="text-slate-400">Manage Camera and Node-RED integration settings.</p>
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
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Stream URL (MJPEG)</label>
                        <input 
                            type="url"
                            value={localCamera.streamUrl}
                            onChange={(e) => setLocalCamera({...localCamera, streamUrl: e.target.value})}
                            placeholder="http://localhost:1880/stream"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          Point this to your Node-RED HTTP output or Frigate MJPEG endpoint.
                        </p>
                    </div>
                )}
                {localCamera.mode === 'local' && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-200 text-xs">
                        ⚠️ Local USB mode will fail if Frigate is already using the camera device (/dev/video0).
                    </div>
                )}
            </div>
        </div>

        {/* Integration Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-red-900/30 rounded-lg mr-3">
                    <Webhook className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Node-RED Events</h3>
                    <p className="text-sm text-slate-400">Configure webhook for event forwarding</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                    <input 
                        type="checkbox" 
                        checked={localNodeRed.enabled}
                        onChange={(e) => setLocalNodeRed({...localNodeRed, enabled: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-offset-slate-800 focus:ring-indigo-500 bg-slate-900" 
                    />
                    <span className="text-slate-200 font-medium">Enable Webhook Forwarding</span>
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
                </div>
            </div>
        </div>

        {/* Save Action */}
        <div className="flex justify-end pt-2">
            <button 
                type="submit"
                className={`flex items-center px-6 py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${isSaved ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
                <Save className="w-5 h-5 mr-2" />
                {isSaved ? 'Settings Saved!' : 'Save Changes'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;