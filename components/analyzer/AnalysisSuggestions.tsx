import React from 'react';

const SuggestionSection: React.FC<{ title: string; items: string[]; icon: React.ReactNode; color: string; }> = 
({ title, items, icon, color }) => (
    <div>
        <h4 className={`text-lg font-semibold flex items-center mb-3 ${color}`}>
            {icon}
            <span className="ml-2">{title}</span>
        </h4>
        <ul className="space-y-2 list-disc list-inside text-gray-300">
            {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
    </div>
);

interface AnalysisSuggestionsProps {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
}

export const AnalysisSuggestions: React.FC<AnalysisSuggestionsProps> = ({ strengths, weaknesses, suggestions }) => {
    return (
        <div className="glassmorphic-card p-6 rounded-xl">
             <h3 className="text-xl font-bold text-white mb-6">AI Feedback</h3>
             <div className="space-y-6">
                 <SuggestionSection 
                    title="Strengths"
                    items={strengths}
                    color="text-green-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5.5 8m7 2H5.5" /></svg>}
                />
                 <SuggestionSection 
                    title="Areas for Improvement"
                    items={weaknesses}
                    color="text-yellow-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                 <SuggestionSection 
                    title="Actionable Suggestions"
                    items={suggestions}
                    color="text-blue-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                />
             </div>
        </div>
    );
};
