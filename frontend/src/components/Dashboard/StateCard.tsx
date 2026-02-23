interface StateCardProps {
    title: string;
    value: string;
    percentage: string;
    type: 'up' | 'down';
    icon: React.ReactNode;
}

export const StateCard: React.FC<StateCardProps> = ({ title, value, percentage, type, icon }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <p className="text-gray-500 font-medium">{title}</p>
            <div className="p-2 bg-gray-50 rounded-full">{icon}</div>
        </div>
        <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold">{value}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${type === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                {type === 'up' ? '↑' : '↓'} {percentage}
            </span>
        </div>
        <p className="text-gray-400 text-xs mt-4">Last month: <span className="text-gray-600">2345</span></p>
    </div>
);