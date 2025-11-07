import React from 'react';
import type { ScoreBreakdown } from '../../types';

// --- Recharts components from window ---
declare const window: any;

interface AnalysisScoreCardProps {
    score: number;
    breakdown: ScoreBreakdown[];
}

export const AnalysisScoreCard: React.FC<AnalysisScoreCardProps> = ({ score, breakdown }) => {
    const { PolarGrid, PolarAngleAxis, Radar, RadarChart, ResponsiveContainer } = window.Recharts || {};

    const chartData = breakdown.map(item => ({
        subject: item.category.replace(' ', '\n'),
        A: item.score,
        fullMark: 100,
    }));
    
    // Determine score color
    const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="glassmorphic-card p-6 rounded-xl text-center">
            <h3 className="text-xl font-bold text-white mb-4">ATS Compatibility Score</h3>
            <div className="relative w-40 h-40 mx-auto mb-4 flex items-center justify-center">
                 <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
                 <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="5"/>
                    <circle 
                        cx="50" cy="50" r="45" fill="none" 
                        stroke={score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : '#f87171'}
                        strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - score / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{transition: 'stroke-dashoffset 1s ease-out'}}
                    />
                </svg>
            </div>
            
            <h4 className="text-lg font-semibold text-blue-300 mt-6 mb-2">Score Breakdown</h4>
            <div className="w-full h-64">
                {ResponsiveContainer ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#d1d5db', fontSize: 12 }} />
                            <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-left space-y-2 px-4 pt-4">
                        {breakdown.map((item) => (
                            <div key={item.category} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{item.category}</span>
                                <span className="font-semibold text-white">{item.score} / 100</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};