interface StateCardProps {
    title: string;
    value: string;
    percentage: string;
    type: 'up' | 'down';
    icon: React.ReactNode;
}

export const StateCard: React.FC<StateCardProps> = ({ title, value, percentage, type, icon }) => (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-4">
            <p className="text-muted-foreground font-body font-medium text-body-md">{title}</p>
            <div className="p-2 bg-muted rounded-xl text-primary">{icon}</div>
        </div>
        <div className="flex items-end gap-3">
            <h3 className="text-headline-lg font-sans font-bold text-foreground">{value}</h3>
            <span className={`text-body-sm font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${type === 'up'
                ? 'bg-success/10 text-success'
                : 'bg-failure/10 text-failure'
                }`}>
                {type === 'up' ? '↑' : '↓'} {percentage}
            </span>
        </div>
        <p className="text-muted-foreground text-body-sm mt-4">
            Last month: <span className="text-foreground font-medium">2345</span>
        </p>
    </div>
);