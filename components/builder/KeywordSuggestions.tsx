import React, { useState } from 'react';

interface KeywordSuggestionsProps {
    keywords: string[];
}

export const KeywordSuggestions: React.FC<KeywordSuggestionsProps> = ({ keywords }) => {
    const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

    if (keywords.length === 0) {
        return null;
    }
    
    const handleCopy = (keyword: string) => {
        navigator.clipboard.writeText(keyword).then(() => {
            setCopiedKeyword(keyword);
            setTimeout(() => setCopiedKeyword(null), 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error('Failed to copy keyword: ', err);
        });
    };

    return (
        <div className="glassmorphic-card p-6 rounded-xl animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Keyword Suggestions
            </h3>
            <p className="text-gray-400 mb-4 text-sm">Consider weaving these role-specific keywords into your resume. Click any keyword to copy it.</p>
            <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                    <button 
                        key={index} 
                        onClick={() => handleCopy(keyword)}
                        className="bg-blue-900/50 text-blue-300 text-sm font-medium px-3 py-1 rounded-full border border-blue-800 transition-colors hover:bg-blue-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title={`Copy "${keyword}"`}
                    >
                        {copiedKeyword === keyword ? 'Copied!' : keyword}
                    </button>
                ))}
            </div>
        </div>
    );
};