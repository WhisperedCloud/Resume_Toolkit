import React, { useCallback, useState } from 'react';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback((file: File | null | undefined) => {
        setError(null);
        if (file) {
            if (file.type === 'application/pdf') {
                onFileUpload(file);
            } else {
                setError('Invalid file type. Please upload a PDF file.');
            }
        }
    }, [onFileUpload]);

    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            handleFile(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, [handleFile]);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(event.target.files?.[0]);
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div 
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`relative flex flex-col items-center justify-center w-full h-64 p-8 text-center bg-gray-900/50 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-blue-400 bg-gray-800/60' : 'border-gray-600 hover:border-blue-500'}`}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={onFileChange}
                    accept=".pdf"
                    disabled={isLoading}
                />
                <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-lg text-white">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-400">PDF (MAX. 5MB)</p>
                </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}
        </div>
    );
};
