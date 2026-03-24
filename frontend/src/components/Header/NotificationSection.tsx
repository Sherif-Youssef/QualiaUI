import { Search, Bell, HelpCircle } from 'lucide-react';

interface NotificationSectionProps {
    onSearchMobileClick: () => void;
}

export const NotificationSection = ({ onSearchMobileClick }: NotificationSectionProps) => {
    return (
        <div className="flex items-center gap-0.5 md:gap-2 border-r border-gray-100 pr-1 md:pr-6 mr-1 md:mr-2">
            <button
                onClick={onSearchMobileClick}
                className="md:hidden p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
                <Search size={20} />
            </button>
            <button className="flex p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-failure rounded-full border-2 border-white"></span>
            </button>
            <button className="hidden sm:flex p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                <HelpCircle size={20} />
            </button>
        </div>
    );
};
