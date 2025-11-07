import React, { useState } from 'react';
import { ResumeForm } from './ResumeForm';
import { ResumePreview } from './ResumePreview';
import { KeywordSuggestions } from './KeywordSuggestions';
import { TemplateSelector } from './TemplateSelector';
import { Loader } from '../Loader';
import { extractTextFromPdf } from '../../services/pdfExtractor';
import { generateResumeTextStream, suggestKeywords, extractDataFromResumeText } from '../../services/geminiService';
import type { ResumeData, TemplateId } from '../../types';

interface ResumeBuilderProps {
    // State props from App
    resumeData: ResumeData;
    generatedResumeText: string;
    suggestedKeywords: string[];
    selectedTemplate: TemplateId;
    // State setters from App
    setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
    setGeneratedResumeText: React.Dispatch<React.SetStateAction<string>>;
    setSuggestedKeywords: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedTemplate: React.Dispatch<React.SetStateAction<TemplateId>>;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({
    resumeData,
    generatedResumeText,
    suggestedKeywords,
    selectedTemplate,
    setResumeData,
    setGeneratedResumeText,
    setSuggestedKeywords,
    setSelectedTemplate,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (file: File) => {
        setLoadingMessage('Importing from PDF...');
        setIsLoading(true);
        setError(null);
        try {
            const text = await extractTextFromPdf(file);
            const data = await extractDataFromResumeText(text);
            setResumeData(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during import.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (data: ResumeData, targetRole: string) => {
        setIsLoading(true);
        setError(null);
        setGeneratedResumeText('');
        setSuggestedKeywords([]);
        
        try {
            // Step 1: Stream the resume text for a fast, responsive UI
            setLoadingMessage('AI is crafting your resume...');
            const stream = generateResumeTextStream(data, targetRole);
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk;
                setGeneratedResumeText(fullText); // Update UI in real-time
            }

            // Step 2: Once text is complete, fetch keywords in a separate call
            setLoadingMessage('Identifying keywords...');
            const keywords = await suggestKeywords(fullText, targetRole);
            setSuggestedKeywords(keywords);

        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during generation.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleResetForm = () => {
        if (window.confirm("Are you sure you want to clear all form data? This cannot be undone.")) {
            setResumeData({
                fullName: '', email: '', phone: '', linkedIn: '', summary: '', skills: '',
                experience: [{ role: '', company: '', duration: '', responsibilities: '' }],
                education: [{ degree: '', institution: '', graduationYear: '' }],
                projects: [{ name: '', description: '', technologies: '' }],
            });
            setGeneratedResumeText('');
            setSuggestedKeywords([]);
        }
    }

    const showPreview = !isLoading || (isLoading && generatedResumeText);

    return (
        <div className="animate-fade-in space-y-8">
            <h1 className="text-4xl font-bold text-center text-white">Resume Builder</h1>
            <p className="text-lg text-gray-400 text-center max-w-2xl mx-auto">
                Fill in your details, or upload an existing resume to get started. Our AI will craft a professional resume tailored to your target role.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                    <ResumeForm 
                        initialData={resumeData} 
                        isGenerating={isLoading} 
                        onGenerate={handleGenerate} 
                        onFileUpload={handleFileUpload}
                        onReset={handleResetForm}
                    />
                </div>
                
                <div className="space-y-8 sticky top-28">
                    {isLoading && !generatedResumeText && <Loader text={loadingMessage} />}
                    
                    {error && (
                        <div className="glassmorphic-card p-4 rounded-xl border border-red-500/50 bg-red-900/30 animate-fade-in" role="alert">
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

                    {showPreview && (
                        <>
                            <TemplateSelector selectedTemplate={selectedTemplate} onSelectTemplate={setSelectedTemplate} />
                            <ResumePreview 
                                resumeText={generatedResumeText} 
                                templateId={selectedTemplate} 
                                isStreaming={isLoading && !!generatedResumeText}
                                streamingMessage={loadingMessage}
                            />
                            {suggestedKeywords.length > 0 && <KeywordSuggestions keywords={suggestedKeywords} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};