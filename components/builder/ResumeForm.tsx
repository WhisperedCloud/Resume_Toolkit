import React, { useState, useEffect } from 'react';
import type { ResumeData, Experience, Education, Project } from '../../types';
import { FileUpload } from '../FileUpload';

interface ResumeFormProps {
    initialData: ResumeData | null;
    isGenerating: boolean;
    onGenerate: (data: ResumeData, targetRole: string) => void;
    onFileUpload: (file: File) => void;
    onReset: () => void;
}

export const emptyResume: ResumeData = {
    fullName: '', email: '', phone: '', linkedIn: '', summary: '', skills: '',
    experience: [{ role: '', company: '', duration: '', responsibilities: '' }],
    education: [{ degree: '', institution: '', graduationYear: '' }],
    projects: [{ name: '', description: '', technologies: '' }],
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s()-]{7,20}$/; // Simple regex for common phone number formats
const linkedInRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;

export const ResumeForm: React.FC<ResumeFormProps> = ({ initialData, isGenerating, onGenerate, onFileUpload, onReset }) => {
    const [formData, setFormData] = useState<ResumeData>(initialData || emptyResume);
    const [targetRole, setTargetRole] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialData || emptyResume);
        setErrors({}); // Clear errors when initial data changes
    }, [initialData]);

    const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = <T,>(section: keyof ResumeData, index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedSection = [...(formData[section] as T[])];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        setFormData(prev => ({ ...prev, [section]: updatedSection }));
    };

    const addNestedItem = <T,>(section: keyof ResumeData, newItem: T) => {
        setFormData(prev => ({ ...prev, [section]: [...(prev[section] as T[]), newItem] }));
    };

    const removeNestedItem = (section: keyof ResumeData, index: number) => {
        const list = [...(formData[section] as any[])];
        if (list.length > 1) {
            list.splice(index, 1);
            setFormData(prev => ({ ...prev, [section]: list }));
        }
    };
    
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const requiredMsg = 'This field is required.';

        if (!targetRole.trim()) newErrors.targetRole = 'Target role is required.';
        if (!formData.fullName.trim()) newErrors.fullName = requiredMsg;

        if (!formData.email.trim()) newErrors.email = requiredMsg;
        else if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email address.';

        if (!formData.phone.trim()) newErrors.phone = requiredMsg;
        else if (!phoneRegex.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number format.';

        if (formData.linkedIn.trim() && !linkedInRegex.test(formData.linkedIn)) newErrors.linkedIn = 'Please enter a valid LinkedIn URL.';

        if (!formData.summary.trim()) newErrors.summary = requiredMsg;
        if (!formData.skills.trim()) newErrors.skills = requiredMsg;

        formData.experience.forEach((exp, i) => {
            if (!exp.role.trim()) newErrors[`experience-${i}-role`] = requiredMsg;
            if (!exp.company.trim()) newErrors[`experience-${i}-company`] = requiredMsg;
            if (!exp.duration.trim()) newErrors[`experience-${i}-duration`] = requiredMsg;
            if (!exp.responsibilities.trim()) newErrors[`experience-${i}-responsibilities`] = requiredMsg;
        });

        formData.education.forEach((edu, i) => {
            if (!edu.degree.trim()) newErrors[`education-${i}-degree`] = requiredMsg;
            if (!edu.institution.trim()) newErrors[`education-${i}-institution`] = requiredMsg;
            if (!edu.graduationYear.trim()) newErrors[`education-${i}-graduationYear`] = requiredMsg;
        });

        formData.projects.forEach((proj, i) => {
            if (!proj.name.trim()) newErrors[`projects-${i}-name`] = requiredMsg;
            if (!proj.description.trim()) newErrors[`projects-${i}-description`] = requiredMsg;
            if (!proj.technologies.trim()) newErrors[`projects-${i}-technologies`] = requiredMsg;
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onGenerate(formData, targetRole);
        } else {
            // Optionally, alert the user or scroll to the first error
            console.log("Validation failed");
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, id } = e.target;
        const fieldId = id || name;
        let error = '';
        const requiredMsg = 'This field is required.';
        
        // All fields are required except LinkedIn
        if (name !== 'linkedIn' && !value.trim()) {
            error = requiredMsg;
        } else {
            // Specific format validations
            switch (name) {
                case 'email':
                    if (value.trim() && !emailRegex.test(value)) error = 'Please enter a valid email address.';
                    break;
                case 'phone':
                    if (value.trim() && !phoneRegex.test(value)) error = 'Please enter a valid phone number format.';
                    break;
                case 'linkedIn':
                    if (value.trim() && !linkedInRegex.test(value)) error = 'Must be a valid LinkedIn URL (e.g., https://linkedin.com/in/...).';
                    break;
            }
        }
        
        setErrors(prev => ({ ...prev, [fieldId]: error }));
    };

    const renderSectionHeader = (title: string) => (
        <div className="section-header">
             <h3 className="text-xl font-semibold text-blue-300 border-b border-gray-700 pb-2 mb-4 w-full">{title}</h3>
        </div>
    );
    
    const renderInput = (name: keyof ResumeData, label: string, type: string = 'text', isTextArea: boolean = false) => {
        const hasError = !!errors[name];
        const className = `${isTextArea ? 'form-textarea' : 'form-input'} ${hasError ? 'invalid' : ''}`;
        return (
             <div>
                <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                {isTextArea ? (
                    <textarea id={name} name={name} value={(formData[name] as string) || ''} onChange={handleBasicChange} onBlur={handleBlur} className={className} rows={4} />
                ) : (
                    <input type={type} id={name} name={name} value={(formData[name] as string) || ''} onChange={handleBasicChange} onBlur={handleBlur} className={className} />
                )}
                {hasError && <p className="error-message">{errors[name]}</p>}
            </div>
        );
    };
    
    const renderNestedInput = (section: keyof ResumeData, index: number, name: string, label: string, isTextArea: boolean = false) => {
        const id = `${section}-${index}-${name}`;
        const hasError = !!errors[id];
        const className = `${isTextArea ? 'form-textarea' : 'form-input'} ${hasError ? 'invalid' : ''}`;
        return (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                {isTextArea ? (
                     <textarea id={id} name={name} value={(formData[section] as any)[index][name]} onChange={(e) => handleNestedChange(section, index, e)} onBlur={handleBlur} className={className} rows={3} />
                ) : (
                     <input type="text" id={id} name={name} value={(formData[section] as any)[index][name]} onChange={(e) => handleNestedChange(section, index, e)} onBlur={handleBlur} className={className} />
                )}
                {hasError && <p className="error-message">{errors[id]}</p>}
            </div>
        );
    };

    return (
        <div className="glassmorphic-card p-6 rounded-xl space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Input Your Information</h2>
                <button type="button" onClick={onReset} className="btn-secondary-sm">Reset Form</button>
            </div>
            
            <details className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <summary className="cursor-pointer font-semibold text-white">Or, Import from PDF</summary>
                <div className="pt-4">
                     <FileUpload onFileUpload={onFileUpload} isLoading={isGenerating} />
                </div>
            </details>
           
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <details open className="form-section">
                    <summary>{renderSectionHeader("Target Role")}</summary>
                     <div className="pt-4">
                        <label htmlFor="targetRole" className="block text-sm font-medium text-gray-300 mb-1">What role are you applying for?</label>
                        <input 
                            type="text" 
                            id="targetRole" 
                            name="targetRole"
                            value={targetRole} 
                            onChange={(e) => setTargetRole(e.target.value)} 
                            onBlur={handleBlur}
                            className={`form-input ${errors.targetRole ? 'invalid' : ''}`} 
                            placeholder="e.g., Senior Frontend Engineer" 
                            required 
                        />
                         {errors.targetRole && <p className="error-message">{errors.targetRole}</p>}
                    </div>
                </details>

                <details open className="form-section">
                    <summary>{renderSectionHeader("Personal Details")}</summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {renderInput('fullName', 'Full Name')}
                        {renderInput('email', 'Email', 'email')}
                        {renderInput('phone', 'Phone', 'tel')}
                        {renderInput('linkedIn', 'LinkedIn Profile URL')}
                    </div>
                </details>
                
                <details open className="form-section">
                    <summary>{renderSectionHeader("Professional Summary")}</summary>
                    <div className="pt-4">
                        {renderInput('summary', 'Summary', 'text', true)}
                    </div>
                </details>
                
                <details open className="form-section">
                    <summary>{renderSectionHeader("Skills")}</summary>
                    <div className="pt-4">
                        {renderInput('skills', 'Skills (comma-separated)', 'text', true)}
                    </div>
                </details>

                <details open className="form-section">
                    <summary>{renderSectionHeader("Work Experience")}</summary>
                    <div className="pt-4 space-y-4">
                        {formData.experience.map((exp, index) => (
                            <div key={index} className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative">
                                {renderNestedInput('experience', index, 'role', 'Job Title')}
                                {renderNestedInput('experience', index, 'company', 'Company')}
                                {renderNestedInput('experience', index, 'duration', 'Duration (e.g., Jan 2020 - Present)')}
                                {renderNestedInput('experience', index, 'responsibilities', 'Responsibilities / Achievements', true)}
                                {formData.experience.length > 1 && (
                                    <button type="button" onClick={() => removeNestedItem('experience', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-2xl font-bold">&times;</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addNestedItem<Experience>('experience', { role: '', company: '', duration: '', responsibilities: '' })} className="btn-secondary-sm">+ Add Experience</button>
                    </div>
                </details>
                
                <details open className="form-section">
                    <summary>{renderSectionHeader("Education")}</summary>
                    <div className="pt-4 space-y-4">
                         {formData.education.map((edu, index) => (
                            <div key={index} className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative">
                                {renderNestedInput('education', index, 'degree', 'Degree / Certificate')}
                                {renderNestedInput('education', index, 'institution', 'Institution')}
                                {renderNestedInput('education', index, 'graduationYear', 'Graduation Year')}
                                {formData.education.length > 1 && (
                                    <button type="button" onClick={() => removeNestedItem('education', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-2xl font-bold">&times;</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addNestedItem<Education>('education', { degree: '', institution: '', graduationYear: '' })} className="btn-secondary-sm">+ Add Education</button>
                    </div>
                </details>

                <details open className="form-section">
                    <summary>{renderSectionHeader("Projects")}</summary>
                    <div className="pt-4 space-y-4">
                         {formData.projects.map((proj, index) => (
                            <div key={index} className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative">
                                {renderNestedInput('projects', index, 'name', 'Project Name')}
                                {renderNestedInput('projects', index, 'description', 'Description', true)}
                                {renderNestedInput('projects', index, 'technologies', 'Technologies (comma-separated)')}
                                 {formData.projects.length > 1 && (
                                    <button type="button" onClick={() => removeNestedItem('projects', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-2xl font-bold">&times;</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addNestedItem<Project>('projects', { name: '', description: '', technologies: '' })} className="btn-secondary-sm">+ Add Project</button>
                    </div>
                </details>

                <div className="pt-4">
                    <button type="submit" className="btn-primary w-full" disabled={isGenerating}>
                        {isGenerating ? 'Generating...' : '✨ Generate with AI'}
                    </button>
                </div>
            </form>
        </div>
    );
};