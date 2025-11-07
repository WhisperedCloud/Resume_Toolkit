// Fix: Populate the component with the correct implementation for displaying the keyword frequency bar chart.
import React from 'react';
import type { Keyword } from '../../types';

// --- Recharts components from window ---
declare const window: any;

interface AnalysisKeywordChartProps {
    keywords: Keyword[];
}

export const AnalysisKeywordChart: React.FC<AnalysisKeywordChartProps> = ({ keywords }) => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = window.Recharts || {};

    // FIX: Add a guard clause to prevent crashing if the `keywords` prop is undefined or empty.
    if (!Array.isArray(keywords) || keywords.length === 0) {
        return (
            <div className="glassmorphic-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-white mb-4">Keyword Frequency</h3>
                <div className="w-full h-80 flex items-center justify-center">
                    <p className="text-gray-400">No keyword data available for analysis.</p>
                </div>
            </div>
        );
    }

    const chartData = [...keywords].sort((a, b) => a.frequency - b.frequency);

    return (
        <div className="glassmorphic-card p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-4">Keyword Frequency</h3>
            <div className="w-full h-80">
                {ResponsiveContainer ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis type="number" stroke="#9ca3af" />
                            <YAxis 
                                dataKey="keyword" 
                                type="category" 
                                stroke="#9ca3af" 
                                width={80} 
                                tick={{fontSize: 12}}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(59, 130, 246, 0.2)' }}
                                contentStyle={{
                                    background: 'rgba(31, 41, 55, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '0.5rem',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="frequency" fill="#3b82f6" background={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="space-y-2 pr-4 overflow-y-auto h-full">
                        {chartData.slice().reverse().map((item) => (
                             <div key={item.keyword} className="flex justify-between items-center text-sm gap-4">
                                <span className="text-gray-300 truncate" title={item.keyword}>{item.keyword}</span>
                                <span className="font-semibold text-white bg-gray-700 px-2 py-0.5 rounded-md flex-shrink-0">{item.frequency}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};