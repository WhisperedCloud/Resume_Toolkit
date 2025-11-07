import React, { useState, useEffect } from 'react';
import { OpeningPage } from './components/OpeningPage';
import { ResumeBuilder } from './components/builder/ResumeBuilder';
import { ResumeAnalyzer } from './components/analyzer/ResumeAnalyzer';
import { LiquidEther } from './components/LiquidEther';
import type { ResumeData, AnalysisResult, TemplateId } from './types';
import { emptyResume } from './components/builder/ResumeForm';

type View = 'opening' | 'builder' | 'analyzer';

// Custom hook for robust local storage synchronization
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item === null || typeof item === 'undefined' || item === 'undefined') return initialValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}


const App: React.FC = () => {
    const [view, setView] = useState<View>('opening');
    
    // --- Centralized State Management ---
    // All primary app state is managed here and passed down as props.
    // This creates a single source of truth and improves performance.

    // Builder State
    const [resumeData, setResumeData] = useLocalStorage<ResumeData>('resumeBuilderData', emptyResume);
    const [generatedResumeText, setGeneratedResumeText] = useLocalStorage<string>('generatedResumeText', '');
    const [suggestedKeywords, setSuggestedKeywords] = useLocalStorage<string[]>('suggestedKeywords', []);
    const [selectedTemplate, setSelectedTemplate] = useLocalStorage<TemplateId>('selectedTemplate', 'classic');

    // Analyzer State
    const [resumeTextForAnalyzer, setResumeTextForAnalyzer] = useLocalStorage<string>('resumeTextForAnalyzer', '');
    const [analysisResult, setAnalysisResult] = useLocalStorage<AnalysisResult | null>('analysisResult', null);

    // --- Navigation Handlers ---

    const handleNavigateToBuilder = (dataToLoad: ResumeData | null = null) => {
        setResumeData(dataToLoad || emptyResume);
        // Clear previous results when starting fresh, unless loading rectified data
        if (!dataToLoad) {
            setGeneratedResumeText('');
            setSuggestedKeywords([]);
        }
        setView('builder');
    };

    const handleNavigateToAnalyzer = (text: string) => {
        setResumeTextForAnalyzer(text);
        setAnalysisResult(null); // Clear old analysis before running a new one
        setView('analyzer');
    };

    const handleGoHome = () => {
        setView('opening');
    };

    const handleRectifyAndLoadInBuilder = (rectifiedData: ResumeData) => {
        handleNavigateToBuilder(rectifiedData);
    };
    
    // --- View Rendering Logic ---

    const renderContent = () => {
        switch (view) {
            case 'builder':
                return <ResumeBuilder 
                            // State
                            resumeData={resumeData}
                            generatedResumeText={generatedResumeText}
                            suggestedKeywords={suggestedKeywords}
                            selectedTemplate={selectedTemplate}
                            // Setters
                            setResumeData={setResumeData}
                            setGeneratedResumeText={setGeneratedResumeText}
                            setSuggestedKeywords={setSuggestedKeywords}
                            setSelectedTemplate={setSelectedTemplate}
                        />;
            case 'analyzer':
                return <ResumeAnalyzer 
                            resumeText={resumeTextForAnalyzer}
                            analysisResult={analysisResult}
                            setAnalysisResult={setAnalysisResult}
                            onRectifyComplete={handleRectifyAndLoadInBuilder} 
                        />;
            case 'opening':
            default:
                return <OpeningPage onNavigateToBuilder={() => handleNavigateToBuilder()} onNavigateToAnalyzer={handleNavigateToAnalyzer} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="fixed inset-0 z-0 opacity-20">
                <LiquidEther />
            </div>
            <div className="relative z-10">
                <header className="p-4 flex justify-between items-center container mx-auto sticky top-0 bg-gray-900/50 backdrop-blur-sm z-20">
                    <h1 className="text-xl font-bold cursor-pointer" onClick={handleGoHome}>
                        Resume<span className="text-blue-400">Toolkit</span>
                    </h1>
                    {view !== 'opening' && (
                        <button onClick={handleGoHome} className="btn-secondary">
                            &larr; Back to Home
                        </button>
                    )}
                </header>
                <main className="container mx-auto px-4 py-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default App;