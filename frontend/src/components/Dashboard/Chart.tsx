import React from 'react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { formatProjectName } from './Helper';

interface ChartProps {
    title: string;
    subtitle?: string;
    type: 'bar' | 'stacked-bar' | 'area-trend' | 'donut';
    data: any[];
    dimensions?: { width?: string | number; height?: string | number };
    config?: any;
}

const Chart: React.FC<ChartProps> = ({
    title,
    subtitle,
    type,
    data,
    config,
    dimensions = { width: '100%', height: 300 }
}) => {
    // Recharts can sometimes struggle with hsl(var(...)) inside SVG attributes
    // Use stable hex fallbacks for the grid and axes
    const themeColors = {
        grid: '#f1f5f9', // slate-100
        axisTick: '#94a3b8', // slate-400
        tooltipBg: '#ffffff',
        tooltipCursor: '#f8fafc' // slate-50
    };

    const renderChart = () => {
        if (!data || data.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                </div>
            );
        }

        switch (type) {
            case 'stacked-bar':
                return (
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} />
                        <XAxis
                            dataKey={config?.xAxisKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: themeColors.axisTick, fontSize: 12, fontWeight: 500 }}
                            tickFormatter={formatProjectName}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: themeColors.axisTick, fontSize: 12 }}
                            tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val}
                        />
                        <Tooltip
                            cursor={{ fill: themeColors.tooltipCursor }}
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: themeColors.tooltipBg,
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: '600' }}
                        />
                        {config?.bars?.map((bar: any, index: number) => {
                            const isTop = index === config.bars.length - 1;
                            const isBottom = index === 0;
                            return (
                                <Bar
                                    key={bar.key}
                                    dataKey={bar.key}
                                    stackId="a"
                                    fill={bar.color}
                                    barSize={32}
                                    radius={
                                        isTop ? [6, 6, 0, 0] :
                                            isBottom ? [0, 0, 6, 6] : [0, 0, 0, 0]
                                    }
                                />
                            );
                        })}
                    </BarChart>
                );

            case 'area-trend':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} />
                        <XAxis
                            dataKey={config?.xAxisKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: themeColors.axisTick, fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: themeColors.axisTick, fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: themeColors.tooltipBg
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={config?.dataKey}
                            stroke={config?.color || '#3b82f6'}
                            strokeWidth={3}
                            fillOpacity={0.1}
                            fill={config?.color || '#3b82f6'}
                        />
                    </AreaChart>
                );

            case 'donut':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: themeColors.tooltipBg
                            }}
                        />
                        <Legend iconType="circle" />
                    </PieChart>
                );

            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} />
                        <XAxis dataKey={config?.xAxisKey} axisLine={false} tickLine={false} tick={{ fill: themeColors.axisTick, fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: themeColors.axisTick, fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: themeColors.tooltipBg
                            }}
                            cursor={{ fill: themeColors.tooltipCursor }}
                        />
                        <Legend iconType="circle" />
                        {config?.bars?.map((item: any) => (
                            <Bar
                                key={item.key}
                                name={item.label || item.key}
                                dataKey={item.key}
                                fill={item.color}
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            />
                        ))}
                    </BarChart>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm w-full flex flex-col transition-all hover:shadow-md h-full min-h-[300px]">
            <div className="mb-6">
                <h3 className="font-sans font-bold text-foreground text-headline-md leading-tight">{title}</h3>
                {subtitle && <p className="text-body-sm font-body text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className="flex-1 w-full" style={{ minHeight: dimensions.height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart() as React.ReactElement}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Chart;