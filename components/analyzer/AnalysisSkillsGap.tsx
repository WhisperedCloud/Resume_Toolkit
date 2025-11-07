// Fix: Populate the component with the correct implementation for displaying the skills gap treemap.
import React from 'react';
import type { SkillGap } from '../../types';

// --- Recharts components from window ---
declare const window: any;

interface AnalysisSkillsGapProps {
    skills: SkillGap[];
}

const COLORS = ['#3b82f6', '#60a5fa', '#1d4ed8', '#2563eb', '#3b82f6'];

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const { name, value, payload: itemPayload } = payload[0];
        return (
            <div className="glassmorphic-card p-3 rounded-md border border-gray-700">
                <p className="font-bold text-white">{name}</p>
                <p className="text-sm text-gray-300">Category: {itemPayload.category}</p>
                <p className="text-sm text-blue-300">Importance: {value} / 5</p>
            </div>
        );
    }
    return null;
};


const CustomizedContent: React.FC<any> = (props) => {
    const { root, depth, x, y, width, height, index, name, value } = props;
    
    // Don't render text for the root or if the box is too small
    if (depth < 1 || width < 50 || height < 20) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: '#111827',
                    strokeWidth: 2,
                }}
            />
            <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={12}
                fontWeight="500"
            >
                {name}
            </text>
        </g>
    );
};


export const AnalysisSkillsGap: React.FC<AnalysisSkillsGapProps> = ({ skills }) => {
    const { ResponsiveContainer, Treemap, Tooltip } = window.Recharts || {};

    // FIX: Add a guard clause to prevent crashing if the `skills` prop is undefined or empty.
    // This can happen if the AI analysis fails to return a `skillsGap` array.
    if (!Array.isArray(skills) || skills.length === 0) {
        return (
             <div className="glassmorphic-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-white mb-4">Skills Gap Analysis</h3>
                <div className="w-full h-80 flex items-center justify-center">
                    <p className="text-gray-400">No skills gap data available for analysis.</p>
                </div>
            </div>
        );
    }

    // Recharts Treemap expects 'name' and 'size' properties.
    const treemapData = skills.map(skill => ({
        name: skill.skill,
        size: skill.importance,
        category: skill.category,
    }));

    // FIX: Corrected a TypeScript type inference issue with the `reduce` function.
    // By explicitly providing a generic type argument to `reduce`, we ensure that the accumulator (`acc`)
    // and the resulting `groupedSkills` object are correctly typed, preventing `skillList` from being inferred as `unknown`.
    const groupedSkills = skills.reduce<Record<string, SkillGap[]>>((acc, skill) => {
        const category = skill.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(skill);
        return acc;
    }, {});


    return (
         <div className="glassmorphic-card p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-4">Skills Gap Analysis</h3>
            <div className="w-full h-80">
                {ResponsiveContainer ? (
                    <ResponsiveContainer width="100%" height="100%">
                         <Treemap
                            data={treemapData}
                            dataKey="size"
                            ratio={4 / 3}
                            stroke="#fff"
                            content={<CustomizedContent />}
                        >
                            <Tooltip content={<CustomTooltip />} />
                        </Treemap>
                    </ResponsiveContainer>
                ) : (
                     <div className="space-y-4 overflow-y-auto h-full pr-2">
                        {Object.entries(groupedSkills).map(([category, skillList]) => (
                            <div key={category}>
                                <h4 className="text-md font-semibold text-blue-300 mb-2">{category}</h4>
                                <ul className="space-y-1">
                                    {skillList.map(skill => (
                                        <li key={skill.skill} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300">{skill.skill}</span>
                                            <span className="text-gray-400">Importance: {skill.importance}/5</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};