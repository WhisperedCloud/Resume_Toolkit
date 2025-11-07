import React from 'react';
import type { TemplateId } from '../../types';

interface TemplateSelectorProps {
    selectedTemplate: TemplateId;
    onSelectTemplate: (templateId: TemplateId) => void;
}

const templates: { id: TemplateId; name: string; description: string }[] = [
    { id: 'classic', name: 'ATS-Optimized (Classic)', description: 'A clean, single-column layout proven to pass all resume scanners.' },
    { id: 'professional', name: 'Professional', description: 'A sophisticated single-column design with clean lines and section breaks.' },
    { id: 'technical', name: 'Technical', description: 'A scannable format that prioritizes Skills and Projects for technical roles.' },
    { id: 'modern', name: 'Modern', description: 'A stylish, ATS-friendly single-column format with a clean, contemporary feel.' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplate, onSelectTemplate }) => {
    return (
        <div className="glassmorphic-card p-6 rounded-xl animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4">Select Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <div
                        key={template.id}
                        onClick={() => onSelectTemplate(template.id)}
                        className={`cursor-pointer p-4 rounded-lg border-2 h-full transition-all duration-200
                            ${selectedTemplate === template.id ? 'border-blue-500 bg-blue-900/50' : 'border-gray-700 bg-gray-900/50 hover:border-blue-600'}
                        `}
                    >
                        <h4 className="font-semibold text-white">{template.name}</h4>
                        <p className="text-sm text-gray-400">{template.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};