import React, { useState, useEffect } from 'react';
import { analyzeResumeText, rectifyResumeText } from '../../services/geminiService';
import type { AnalysisResult, ResumeData } from '../../types';
import { AnalysisScoreCard } from './AnalysisScoreCard';
import { AnalysisSuggestions } from './AnalysisSuggestions';
import { AnalysisKeywordChart } from './AnalysisKeywordChart';
import { AnalysisSkillsGap } from './AnalysisSkillsGap';
import { Loader } from '../Loader';

interface ResumeAnalyzerProps {
    resumeText: string;
    analysisResult: AnalysisResult | null;
    setAnalysisResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
    onRectifyComplete: (rectifiedData: ResumeData) => void;
}

export const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ 
    resumeText,
    analysisResult,
    setAnalysisResult,
    onRectifyComplete 
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(!analysisResult);
    const [isRectifying, setIsRectifying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const performAnalysis = async () => {
            if (!resumeText) {
                // This case should ideally not be hit if navigation is handled correctly,
                // but as a fallback, we prevent analysis.
                if (!analysisResult) {
                    setError("No resume text provided to analyze.");
                }
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const result = await analyzeResumeText(resumeText);
                setAnalysisResult(result);
            } catch (e) {
                setError(e instanceof Error ? e.message : "An unknown error occurred during analysis.");
                setAnalysisResult(null); // Clear previous analysis on new error
            } finally {
                setIsLoading(false);
            }
        };

        // Re-run analysis only if there's new text for analysis and no existing result for it.
        // The check `!analysisResult` ensures we don't re-analyze on re-renders if a result is already present.
        if(resumeText && !analysisResult) {
            performAnalysis();
        } else {
             setIsLoading(false);
        }

    }, [resumeText, analysisResult, setAnalysisResult]);

    const handleRectify = async () => {
        if (!analysisResult || !resumeText) return;
        setIsRectifying(true);
        setError(null);
        try {
            const rectifiedData = await rectifyResumeText(resumeText, analysisResult);
            onRectifyComplete(rectifiedData); // Pass data to App and switch view
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during improvement.");
        } finally {
            setIsRectifying(false);
        }
    };
    
    if (isLoading) {
        return <Loader text="Analyzing your resume..." />;
    }

    if (error && !analysisResult) {
        return (
            <div className="text-center">
                <p className="text-red-400">{error}</p>
                <button onClick={() => window.history.back()} className="btn-primary mt-4">Go Back</button>
            </div>
        );
    }
    
    if (!analysisResult) {
         return (
            <div className="text-center">
                <p>Could not find an analysis report. Please upload a resume to start.</p>
                <button onClick={() => window.history.back()} className="btn-primary mt-4">Go Back</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">Resume Analysis Report</h1>
                <p className="text-lg text-gray-400 mt-2">Here's how your resume stacks up against ATS standards.</p>
            </div>
            
            {error && (
                 <div className="glassmorphic-card p-4 rounded-xl border border-red-500/50 bg-red-900/30 animate-fade-in text-left" role="alert">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-300">Error</h3>
                            <div className="mt-2 text-sm text-red-400">
                               <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="glassmorphic-card p-6 rounded-xl text-center">
                 <button onClick={handleRectify} disabled={isRectifying || !resumeText} className="btn-primary text-lg px-8 py-3" title={!resumeText ? "Please upload a resume first" : ""}>
                    {isRectifying ? 'Improving...' : '✨ Load Improved Version in Builder'}
                </button>
                <p className="text-sm text-gray-400 mt-2">Let our AI apply its suggestions and load the improved version into the resume builder for you.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <AnalysisScoreCard score={analysisResult.atsScore} breakdown={analysisResult.scoreBreakdown} />
                    <AnalysisKeywordChart keywords={analysisResult.keywords} />
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <AnalysisSuggestions 
                        strengths={analysisResult.strengths} 
                        weaknesses={analysisResult.weaknesses} 
                        suggestions={analysisResult.suggestions} 
                    />
                    <AnalysisSkillsGap skills={analysisResult.skillsGap} />
                </div>
            </div>
        </div>
    );
};