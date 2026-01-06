import React, { useState } from 'react';
import { NodeRedConfig } from '../types';
import { Save, Webhook, Bell } from 'lucide-react';

interface SettingsProps {
  config: NodeRedConfig;
  onSave: (config: NodeRedConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<NodeRedConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">System Configuration</h2>
        <p className="text-slate-400">Manage Node-RED integration and alert preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Integration Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-red-900/30 rounded-lg mr-3">
                    <Webhook className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Node-RED Integration</h3>
                    <p className="text-sm text-slate-400">Configure webhook for event forwarding</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                    <input 
                        type="checkbox" 
                        checked={localConfig.enabled}
                        onChange={(e) => setLocalConfig({...localConfig, enabled: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-600 text-accent-500 focus:ring-offset-slate-800 focus:ring-accent-500 bg-slate-900" 
                    />
                    <span className="text-slate-200 font-medium">Enable Webhook Forwarding</span>
                </label>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Webhook URL</label>
                    <input 
                        type="url"
                        value={localConfig.webhookUrl}
                        onChange={(e) => setLocalConfig({...localConfig, webhookUrl: e.target.value})}
                        placeholder="http://localhost:1880/frigate-event"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition"
                        disabled={!localConfig.enabled}
                    />
                </div>
            </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-900/30 rounded-lg mr-3">
                    <Bell className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Alert Triggers</h3>
                    <p className="text-sm text-slate-400">Select which events trigger Node-RED</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <label className="flex items-center justify-between p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                    <span className="text-slate-200">Person Detected</span>
                    <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${localConfig.notifyOnPerson ? 'bg-accent-500' : 'bg-slate-600'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${localConfig.notifyOnPerson ? 'translate-x-4' : ''}`}></div>
                        <input 
                            type="checkbox" 
                            className="hidden"
                            checked={localConfig.notifyOnPerson}
                            onChange={(e) => setLocalConfig({...localConfig, notifyOnPerson: e.target.checked})}
                        />
                    </div>
                </label>

                <label className="flex items-center justify-between p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                    <span className="text-slate-200">Vehicle Detected</span>
                    <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${localConfig.notifyOnVehicle ? 'bg-accent-500' : 'bg-slate-600'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${localConfig.notifyOnVehicle ? 'translate-x-4' : ''}`}></div>
                        <input 
                            type="checkbox" 
                            className="hidden"
                            checked={localConfig.notifyOnVehicle}
                            onChange={(e) => setLocalConfig({...localConfig, notifyOnVehicle: e.target.checked})}
                        />
                    </div>
                </label>
            </div>
        </div>

        <div className="flex justify-end">
            <button 
                type="submit"
                className={`flex items-center px-6 py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${isSaved ? 'bg-green-500' : 'bg-accent-600 hover:bg-accent-500'}`}
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
