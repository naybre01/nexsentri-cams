import React from 'react';
import { LayoutDashboard, ListVideo, Settings, Sparkles, Cctv } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isMobileOpen, closeMobile }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Live Dashboard', icon: LayoutDashboard },
    { id: AppView.EVENTS, label: 'Event Logs', icon: ListVideo },
    { id: AppView.AI_INSIGHTS, label: 'AI Assistant', icon: Sparkles },
    { id: AppView.SETTINGS, label: 'System Config', icon: Settings },
  ];

  const baseClasses = "fixed inset-y-0 left-0 z-50 w-64 bg-brand-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0";
  const mobileClasses = isMobileOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <aside className={`${baseClasses} ${mobileClasses} flex flex-col`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-700 bg-brand-900">
        <Cctv className="w-8 h-8 text-accent-500 mr-3" />
        <h1 className="text-xl font-bold tracking-wider text-slate-100">
          NEX<span className="text-accent-500">SENTRI</span>
        </h1>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                closeMobile();
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-accent-600/20 text-accent-500 border border-accent-600/30' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 text-xs text-slate-500 font-mono">
        <div>Device: RPi 4B Rev 1.5</div>
        <div>Cam: JVCU100</div>
        <div className="mt-2 text-accent-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
          System Online
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
