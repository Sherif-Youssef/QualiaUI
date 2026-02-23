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
    const renderChart = () => {
        switch (type) {
            case 'stacked-bar':
                return (
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                        <XAxis
                            dataKey={config?.xAxisKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                            tickFormatter={formatProjectName}
                            dy={10}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val}
                        />

                        <Tooltip
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />

                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}
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
                                        isTop ? [10, 10, 0, 0] :
                                            isBottom ? [0, 0, 10, 10] : [0, 0, 0, 0]
                                    }
                                />
                            );
                        })}
                    </BarChart>
                );

            case 'area-trend':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey={config?.xAxisKey} axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey={config?.dataKey}
                            stroke={config?.color}
                            fillOpacity={0.2}
                            fill={config?.color}
                        />
                    </AreaChart>
                );

            case 'donut':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );

            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey={config?.xAxisKey} axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Legend />
                        {config?.bars?.map((item: any) => (
                            <Bar
                                key={item.key}
                                name={item.label || item.key}
                                dataKey={item.key}
                                fill={item.color}
                                radius={item.radius || [4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Chart type not supported
                    </div>
                );
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm w-full h-full flex flex-col">
            <div className="mb-6">
                <h3 className="font-bold text-gray-800 text-lg leading-tight">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div style={{ width: dimensions.width, height: dimensions.height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart() as React.ReactElement}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Chart;