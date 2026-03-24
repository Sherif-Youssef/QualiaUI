import React from 'react';
import { Bell } from 'lucide-react';
import { NotificationViewModel } from '@/types/notification';

interface NotificationHubProps {
  notifications: NotificationViewModel[];
  isOpen: boolean;
  onToggle: () => void;
  onMarkAllRead: () => void;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const NotificationHub: React.FC<NotificationHubProps> = ({
  notifications,
  isOpen,
  onToggle,
  onMarkAllRead,
  innerRef
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={innerRef}>
      <button 
        onClick={onToggle}
        className={`p-2.5 rounded-full transition-all relative ${isOpen ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-primary'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white animate-pulse" />}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden z-[200]">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase">Activity Log</h3>
            <button 
              onClick={onMarkAllRead} 
              className="text-[10px] font-black text-primary hover:underline uppercase"
            >
              Finish Read
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <p className="py-12 text-center text-gray-400 font-bold text-sm italic">Workspace clear.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-4 rounded-2xl mb-1 hover:bg-gray-50 transition-all flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-gray-200'}`} />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-0.5">{n.title}</p>
                    <p className="text-xs font-medium text-gray-500 line-clamp-2">{n.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
