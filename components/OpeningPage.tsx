import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { extractTextFromPdf } from '../services/pdfExtractor';
import { Loader } from './Loader';

interface OpeningPageProps {
    onNavigateToBuilder: () => void;
    onNavigateToAnalyzer: (resumeText: string) => void;
}

export const OpeningPage: React.FC<OpeningPageProps> = ({ onNavigateToBuilder, onNavigateToAnalyzer }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const text = await extractTextFromPdf(file);
            onNavigateToAnalyzer(text);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to process PDF.");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
                AI-Powered Resume Toolkit
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
                Build a standout resume from scratch or analyze your existing one against ATS standards. Powered by Google Gemini.
            </p>

            {isLoading ? (
                <Loader text="Processing your resume..." />
            ) : (
                <div className="w-full max-w-4xl space-y-12">
                    <div className="glassmorphic-card p-8 rounded-xl">
                        <h2 className="text-2xl font-bold text-white mb-4">Resume Analyzer</h2>
                        <p className="text-gray-400 mb-6">Upload your resume to get an instant ATS score, keyword analysis, and actionable feedback.</p>
                        <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
                         {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-700" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-900 px-2 text-gray-400">OR</span>
                        </div>
                    </div>

                    <div className="glassmorphic-card p-8 rounded-xl">
                        <h2 className="text-2xl font-bold text-white mb-4">Resume Builder</h2>
                        <p className="text-gray-400 mb-6">Don't have a resume? Fill out a simple form and let our AI craft a professional one for you, tailored to your target role.</p>
                        <button onClick={onNavigateToBuilder} className="btn-primary w-full max-w-xs mx-auto">
                            Build a New Resume
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
