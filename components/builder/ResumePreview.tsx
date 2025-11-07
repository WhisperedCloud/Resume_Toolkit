import React, { useState, useEffect, useRef } from 'react';
import { generatePdfResume } from '../../services/resumeGenerator';
import type { TemplateId } from '../../types';

// Add declaration for marked library from CDN
declare const marked: any;

interface ResumePreviewProps {
    resumeText: string;
    templateId: TemplateId;
    isStreaming: boolean;
    streamingMessage: string;
}

const templatesForModal: { id: TemplateId; name: string; description: string }[] = [
    { id: 'classic', name: 'ATS-Optimized (Classic)', description: 'A clean, single-column layout.' },
    { id: 'professional', name: 'Professional', description: 'A sophisticated design.' },
    { id: 'technical', name: 'Technical', description: 'Prioritizes Skills and Projects.' },
    { id: 'modern', name: 'Modern', description: 'A stylish, contemporary feel.' },
];

const parseMarkdownForPreview = (markdown: string): { headerInfo: { name: string, contact: string }, sections: { title: string, content: string }[] } => {
    if (!markdown) return { headerInfo: { name: '', contact: '' }, sections: [] };
    const lines = markdown.split('\n');
    const headerInfo = { name: lines[0] || '', contact: lines[1] || '' };
    const rest = lines.slice(2).join('\n');
    
    const sections: { title: string, content: string }[] = [];
    const splits = rest.split(/^(?=##\s)/m); // Split by "## " at the start of a line

    splits.forEach(part => {
        if (!part.trim()) return;
        const sectionLines = part.trim().split('\n');
        const title = sectionLines[0].substring(3).trim();
        const content = sectionLines.slice(1).join('\n');
        sections.push({ title, content });
    });

    return { headerInfo, sections };
};


export const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeText, templateId, isStreaming, streamingMessage }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadTemplate, setDownloadTemplate] = useState<TemplateId>(templateId);
    const [filename, setFilename] = useState('AI-Generated-Resume');
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const previewBodyRef = useRef<HTMLDivElement>(null);

    const { headerInfo, sections } = parseMarkdownForPreview(resumeText);
    
    // Automatically scroll to the bottom as new text streams in
    useEffect(() => {
        if (isStreaming && previewBodyRef.current) {
            previewBodyRef.current.scrollTop = previewBodyRef.current.scrollHeight;
        }
    }, [resumeText, isStreaming]);

    // Set a smarter default filename when opening the modal
    const openModal = () => {
        const suggestedName = headerInfo.name ? headerInfo.name.trim().replace(/\s+/g, '-') + '-Resume' : 'AI-Generated-Resume';
        setFilename(suggestedName);
        setIsModalOpen(true);
    };

    useEffect(() => {
        // Sync download template with preview template when preview template changes
        setDownloadTemplate(templateId);
    }, [templateId]);

    // Accessibility: Handle Escape key and focus trapping
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsModalOpen(false);
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Focus the first focusable element in the modal (the filename input)
            const focusableElement = modalRef.current?.querySelector('input');
            focusableElement?.focus();
        } else {
            // Return focus to the button that opened the modal
            triggerButtonRef.current?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);
    
    const handleDownload = () => {
        if (!filename.trim()) return;
        // Add .pdf if user didn't
        const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
        generatePdfResume(resumeText, downloadTemplate, finalFilename);
        setIsModalOpen(false);
    };

    const renderSection = (title: string, content: string) => {
        if (!content) return null;
        if (typeof marked !== 'undefined') {
            let htmlContent;

            if (title.toLowerCase() === 'projects') {
                const customRenderer = new marked.Renderer();
                const originalParagraph = customRenderer.paragraph;

                customRenderer.paragraph = (text: string) => {
                    // The text from marked will have HTML tags for markdown syntax like **
                    if (typeof text === 'string' && text.startsWith('<strong>Technologies:</strong>')) {
                        const technologies = text.replace('<strong>Technologies:</strong>', '').trim().split(/,\s*/);
                        // Filter out empty strings that might result from trailing commas
                        const techTags = technologies.filter(tech => tech).map(tech => `<span class="tech-tag">${tech}</span>`).join('');
                        return `<div class="tech-tags-container">${techTags}</div>`;
                    }
                    // Return the default paragraph rendering for other paragraphs
                    return originalParagraph.call(customRenderer, text);
                };

                htmlContent = marked.parse(content, { renderer: customRenderer, breaks: true, gfm: true });
            } else {
                htmlContent = marked.parse(content, { breaks: true, gfm: true });
            }

            return (
                <div key={title}>
                    <h2>{title}</h2>
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
            );
        }
        
        return (
            <div key={title}>
                <h2>{title}</h2>
                <p>{content}</p>
            </div>
        );
    };

    return (
        <div className="glassmorphic-card p-6 rounded-xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-white">Preview</h2>
                 <button 
                    ref={triggerButtonRef}
                    onClick={openModal}
                    className="btn-primary"
                    title="Download PDF Resume"
                    disabled={isStreaming || !resumeText}
                >
                    Download PDF
                </button>
            </div>
            <div ref={previewBodyRef} className={`relative template-preview-wrapper bg-gray-900/50 p-6 rounded-lg border border-gray-700 h-[75vh] overflow-y-auto`}>
                <div className={`template-${templateId}`}>
                    <div className="resume-header">
                        <h1>{headerInfo.name}</h1>
                        <p>{headerInfo.contact}</p>
                    </div>
                    {sections.map(sec => renderSection(sec.title, sec.content))}
                </div>
                {isStreaming && (
                    <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm animate-pulse">
                        {streamingMessage}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in"
                    onClick={() => setIsModalOpen(false)}
                    aria-modal="true"
                    role="dialog"
                >
                    <div 
                        ref={modalRef}
                        className="glassmorphic-card p-8 rounded-2xl w-full max-w-2xl space-y-6 transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-white">Finalize Your PDF</h3>
                        
                        <div>
                            <label htmlFor="filename" className="block text-sm font-medium text-gray-300 mb-1">File Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="filename"
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    className="form-input pr-12"
                                    placeholder="e.g., Senior-Engineer-Resume"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">.pdf</span>
                            </div>
                        </div>

                        <div>
                             <h4 className="text-lg font-semibold text-white mb-3">Choose a Template for Download</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templatesForModal.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => setDownloadTemplate(template.id)}
                                        className={`cursor-pointer p-4 rounded-lg border-2 h-full transition-all duration-200
                                            ${downloadTemplate === template.id ? 'border-blue-500 bg-blue-900/50' : 'border-gray-700 bg-gray-900/50 hover:border-blue-600'}
                                        `}
                                    >
                                        <h5 className="font-semibold text-white">{template.name.split('(')[0].trim()}</h5>
                                        <p className="text-xs text-gray-400">{template.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleDownload} className="btn-primary" disabled={!filename.trim()}>Confirm & Download</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};