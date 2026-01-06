import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SystemStats } from '../types';
import { Cpu, Thermometer, HardDrive, Activity } from 'lucide-react';

interface SystemStatsWidgetProps {
  statsHistory: SystemStats[];
  currentStats: SystemStats;
}

const SystemStatsWidget: React.FC<SystemStatsWidgetProps> = ({ statsHistory, currentStats }) => {
  // Format data for chart
  const data = statsHistory.map((s, i) => ({
    name: i,
    cpu: s.cpuUsage,
    temp: s.temp,
  }));

  const Card = ({ title, value, sub, icon: Icon, colorClass }: any) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</span>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-xs text-slate-500 font-mono mt-1">{sub}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          title="CPU Load" 
          value={`${currentStats.cpuUsage.toFixed(1)}%`} 
          sub="4 Cores Active"
          icon={Cpu}
          colorClass="text-blue-400"
        />
        <Card 
          title="Temp" 
          value={`${currentStats.temp.toFixed(1)}°C`} 
          sub="Thermal Zone 0"
          icon={Thermometer}
          colorClass={currentStats.temp > 70 ? "text-alert-500" : "text-emerald-400"}
        />
        <Card 
          title="Memory" 
          value={`${(currentStats.memoryUsage / 1024).toFixed(2)} GB`} 
          sub="Total 8GB LPDDR4"
          icon={Activity}
          colorClass="text-purple-400"
        />
        <Card 
          title="Storage" 
          value={`${currentStats.storageUsed}%`} 
          sub="SD Card /dev/mmcblk0"
          icon={HardDrive}
          colorClass="text-orange-400"
        />
      </div>

      {/* Mini Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-48 w-full">
        <h3 className="text-xs text-slate-400 font-medium uppercase mb-4">Real-time Performance</h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis hide dataKey="name" />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCpu)" 
            />
             <Area 
              type="monotone" 
              dataKey="temp" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTemp)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemStatsWidget;
