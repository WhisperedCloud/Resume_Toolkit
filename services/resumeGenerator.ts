import type { TemplateId } from '../types';

// This service uses the jsPDF library and marked, assumed to be loaded from a CDN.
declare const jspdf: any;
declare const marked: any;

const FONT_SIZES = {
    // Conversion: 1rem = 16px, 1px = 0.75pt -> 1rem = 12pt
    headerTitle: 21,   // 1.75rem
    sectionTitle: 15,  // 1.25rem
    body: 10.8,        // 0.9rem
    contact: 9.6,      // 0.8rem
};

const COLORS = {
    primary: '#1F2937',      // Near-black for text
    secondary: '#4B5563',    // gray-600
    accent: '#3B82F6',       // blue-500
    accentLight: '#60a5fa',  // blue-400 (used for classic h2)
    accentLighter: '#93c5fd', // blue-300 (used for modern h2)
    grayText: '#9ca3af',     // gray-400
    border: '#4b5563',       // gray-600
    borderDark: '#374151',   // gray-700
};

const PAGE = {
    WIDTH: 210,
    HEIGHT: 297,
    MARGIN: 20,
    LINE_HEIGHT: 5,
};

const CONTENT_WIDTH = PAGE.WIDTH - PAGE.MARGIN * 2;

/**
 * A class to manage the state and rendering of a jsPDF document.
 */
class PdfRenderer {
    doc: any;
    cursorY: number;
    pageNumber: number;

    constructor(doc: any) {
        this.doc = doc;
        this.cursorY = PAGE.MARGIN;
        this.pageNumber = 1;
    }

    /**
     * Resets the cursor to the top margin and adds a new page if not the first page.
     */
    _ensurePage() {
        if (this.cursorY > PAGE.HEIGHT - PAGE.MARGIN) {
            this.doc.addPage();
            this.pageNumber++;
            this.cursorY = PAGE.MARGIN;
        }
    }
    
    /**
     * Renders a series of inline tokens (text, strong, em) on the same line, handling wrapping.
     * @returns The new Y position after rendering.
     */
    _renderInlineTokens(tokens: any[], x: number, y: number, maxWidth: number, isListItem = false) {
        let cursorX = x;
        this.cursorY = y;
        const words: { text: string, style: 'normal' | 'bold' | 'italic' }[] = [];

        // Flatten the token structure into a list of words with their styles
        const flatten = (inlineTokens: any[], currentStyle: 'normal' | 'bold' | 'italic') => {
            for (const token of inlineTokens) {
                if (token.type === 'strong' || token.type === 'em') {
                    flatten(token.tokens, token.type === 'strong' ? 'bold' : 'italic');
                } else if (token.type === 'text' && typeof token.text === 'string') {
                    // Split text into words to handle wrapping correctly
                    token.text.split(' ').forEach((word: string) => {
                        if (word) {
                            words.push({ text: word, style: currentStyle });
                        }
                    });
                }
            }
        };
        flatten(tokens, 'normal');

        // Render words, handling wrapping
        for (const word of words) {
            this._ensurePage(); // Check for page break before rendering a word
            const fontStyle = word.style === 'normal' ? 'normal' : word.style === 'bold' ? 'bold' : 'italic';
            this.doc.setFont('helvetica', fontStyle);
            
            const textToRender = word.text + ' ';
            const wordWidth = this.doc.getTextWidth(textToRender);

            if (cursorX + wordWidth > x + maxWidth) {
                cursorX = x;
                this.cursorY += PAGE.LINE_HEIGHT;
            }

            this.doc.text(textToRender, cursorX, this.cursorY);
            cursorX += wordWidth;
        }

        this.cursorY += PAGE.LINE_HEIGHT; // Move to the next line after the paragraph/item
        return this.cursorY;
    }
    
    /**
     * Processes an array of markdown tokens and draws them onto the PDF.
     */
    renderMarkdown(markdown: string, x: number, maxWidth: number, startY?: number) {
        if (startY) this.cursorY = startY;

        // FIX: Enable GFM and breaks to match the preview's markdown parsing.
        // This ensures lists and other structures are parsed identically, fixing the '*' issue.
        const tokens = marked.lexer(markdown, { gfm: true, breaks: true });
        let listLevel = 0;

        const renderTokens = (tokens: any[]) => {
            tokens.forEach(token => {
                this._ensurePage();
                const indent = x + (listLevel * 5);
                const effectiveMaxWidth = maxWidth - (listLevel * 5);
                
                switch (token.type) {
                    case 'heading':
                        // This case is handled by template-specific logic, not generic markdown
                        break;
                    
                    case 'paragraph':
                        this.doc.setFont('helvetica', 'normal');
                        this.doc.setFontSize(FONT_SIZES.body);
                        this.doc.setTextColor(COLORS.primary);
                        this.cursorY = this._renderInlineTokens(token.tokens, x, this.cursorY, maxWidth);
                        this.cursorY += 1; // Smaller space after paragraph
                        break;

                    case 'list':
                        listLevel++;
                        renderTokens(token.items);
                        listLevel--;
                        if (listLevel === 0) this.cursorY += 3; // Space after a top-level list
                        break;
                    
                    case 'list_item':
                        this.doc.setFontSize(FONT_SIZES.body);
                        this.doc.setTextColor(COLORS.primary);
                        this.doc.text('•', indent, this.cursorY);
                        token.tokens.forEach((itemContent: any) => {
                             if (itemContent.type === 'paragraph' && itemContent.tokens) {
                                 this.cursorY = this._renderInlineTokens(itemContent.tokens, indent + 4, this.cursorY, effectiveMaxWidth - 4, true);
                             } else if (itemContent.type === 'text' && typeof itemContent.text === 'string') {
                                 const textAsToken = [{ type: 'text', text: itemContent.text }];
                                 this.cursorY = this._renderInlineTokens(textAsToken, indent + 4, this.cursorY, effectiveMaxWidth - 4, true);
                             }
                        });
                        this.cursorY -= 1; // Tighten space between list items
                        break;
                    
                    case 'space':
                        // Handled by spacing after elements
                        break;
                    
                    default:
                        if (token.text && typeof token.text === 'string') {
                            this.doc.setFont('helvetica', 'normal');
                            this.doc.setFontSize(FONT_SIZES.body);
                            this.cursorY = this._renderInlineTokens([{ type: 'text', text: token.text }], x, this.cursorY, maxWidth);
                        }
                        break;
                }
            });
        };
        
        renderTokens(tokens);
        return this.cursorY;
    }
}

// Parses the initial raw markdown to separate it into a header and distinct sections.
const parseResumeStructure = (markdown: string): { header: string[], sections: Record<string, string> } => {
    const lines = markdown.split('\n');
    const header = lines.slice(0, 2);
    const rest = lines.slice(2).join('\n');
    
    const sections: Record<string, string> = {};
    const splits = rest.split(/^(?=##\s)/m); // Split by "## " at the start of a line

    splits.forEach(part => {
        if (!part.trim()) return;
        const sectionLines = part.trim().split('\n');
        const title = sectionLines[0].substring(3).trim().toLowerCase();
        const content = sectionLines.slice(1).join('\n');
        sections[title] = content;
    });

    return { header, sections };
};

const renderClassicTemplate = (doc: any, data: { header: string[], sections: Record<string, string> }) => {
    const renderer = new PdfRenderer(doc);

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZES.headerTitle);
    doc.setTextColor(COLORS.primary);
    doc.text(data.header[0], PAGE.WIDTH / 2, renderer.cursorY, { align: 'center' });
    renderer.cursorY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZES.contact);
    doc.setTextColor(COLORS.grayText);
    doc.text(data.header[1], PAGE.WIDTH / 2, renderer.cursorY, { align: 'center' });
    renderer.cursorY += 12;

    // --- Sections ---
    const sectionOrder = ['summary', 'skills', 'experience', 'projects', 'education'];
    sectionOrder.forEach(key => {
        if (data.sections[key]) {
            const title = key.charAt(0).toUpperCase() + key.slice(1);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(FONT_SIZES.sectionTitle);
            doc.setTextColor(COLORS.accentLight); // Match preview color
            doc.text(title, PAGE.MARGIN, renderer.cursorY);
            renderer.cursorY += 2;
            doc.setDrawColor(COLORS.border);
            doc.setLineWidth(0.2);
            doc.line(PAGE.MARGIN, renderer.cursorY, PAGE.WIDTH - PAGE.MARGIN, renderer.cursorY);
            renderer.cursorY += 8;

            renderer.renderMarkdown(data.sections[key], PAGE.MARGIN, CONTENT_WIDTH);
            renderer.cursorY += 4;
        }
    });
};

const renderProfessionalTemplate = (doc: any, data: { header: string[], sections: Record<string, string> }) => {
    const renderer = new PdfRenderer(doc);

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZES.headerTitle);
    doc.setTextColor(COLORS.primary);
    doc.text(data.header[0], PAGE.MARGIN, renderer.cursorY);
    renderer.cursorY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZES.contact);
    doc.setTextColor(COLORS.grayText);
    doc.text(data.header[1], PAGE.MARGIN, renderer.cursorY);
    renderer.cursorY += 10;
    
    // --- Sections ---
    const sectionOrder = ['summary', 'skills', 'experience', 'projects', 'education'];
    sectionOrder.forEach(key => {
        if (data.sections[key]) {
            const title = (key.charAt(0).toUpperCase() + key.slice(1)).toUpperCase();
            doc.setFont('helvetica', 'bold'); // Semibold is not standard, use bold
            doc.setFontSize(12); // 1rem
            doc.setTextColor(COLORS.grayText);
            doc.text(title, PAGE.MARGIN, renderer.cursorY);
            renderer.cursorY += 2;
            doc.setDrawColor(COLORS.borderDark);
            doc.setLineWidth(0.5);
            doc.line(PAGE.MARGIN, renderer.cursorY, PAGE.WIDTH - PAGE.MARGIN, renderer.cursorY);
            renderer.cursorY += 8;

            renderer.renderMarkdown(data.sections[key], PAGE.MARGIN, CONTENT_WIDTH);
            renderer.cursorY += 4;
        }
    });
};

const renderTechnicalTemplate = (doc: any, data: { header: string[], sections: Record<string, string> }) => {
    const renderer = new PdfRenderer(doc);

    // --- Header ---
    doc.setFont('courier', 'bold'); // Monospaced font for header
    doc.setFontSize(FONT_SIZES.headerTitle);
    doc.setTextColor(COLORS.primary);
    doc.text(data.header[0], PAGE.MARGIN, renderer.cursorY);
    renderer.cursorY += 8;

    doc.setFont('courier', 'normal');
    doc.setFontSize(FONT_SIZES.contact);
    doc.setTextColor(COLORS.grayText);
    doc.text(data.header[1], PAGE.MARGIN, renderer.cursorY);
    renderer.cursorY += 12;

    // --- Sections (Technical order) ---
    const sectionOrder = ['summary', 'skills', 'projects', 'experience', 'education'];
    sectionOrder.forEach(key => {
        if (data.sections[key]) {
            const title = key.charAt(0).toUpperCase() + key.slice(1);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13.2); // 1.1rem
            doc.setTextColor(COLORS.accent);
            
            doc.text('>> ', PAGE.MARGIN, renderer.cursorY);
            doc.setTextColor(COLORS.accent);
            doc.text(title, PAGE.MARGIN + doc.getTextWidth('>> '), renderer.cursorY);

            renderer.cursorY += 8;

            renderer.renderMarkdown(data.sections[key], PAGE.MARGIN, CONTENT_WIDTH);
            renderer.cursorY += 4;
        }
    });
};

const renderModernTemplate = (doc: any, data: { header: string[], sections: Record<string, string> }) => {
    const renderer = new PdfRenderer(doc);

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZES.headerTitle);
    doc.setTextColor(COLORS.primary);
    doc.text(data.header[0], PAGE.MARGIN, renderer.cursorY);
    renderer.cursorY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZES.contact);
    doc.setTextColor(COLORS.grayText);
    doc.text(data.header[1], PAGE.MARGIN, renderer.cursorY);
    renderer.cursorY += 8;

    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.MARGIN, renderer.cursorY, PAGE.WIDTH - PAGE.MARGIN, renderer.cursorY);
    renderer.cursorY += 10;

    // --- Sections ---
    const sectionOrder = ['summary', 'experience', 'projects', 'skills', 'education'];
    sectionOrder.forEach(key => {
        if (data.sections[key]) {
            const title = key.charAt(0).toUpperCase() + key.slice(1);
            
            renderer.cursorY += 4;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13.2); // 1.1rem
            doc.setTextColor(COLORS.accentLighter); // Match preview color
            
            // Draw vertical accent line
            doc.setDrawColor(COLORS.accent);
            doc.setLineWidth(1);
            doc.line(PAGE.MARGIN, renderer.cursorY - 4, PAGE.MARGIN, renderer.cursorY + 4); 

            doc.text(title, PAGE.MARGIN + 3, renderer.cursorY);
            
            renderer.cursorY += 8;

            renderer.renderMarkdown(data.sections[key], PAGE.MARGIN, CONTENT_WIDTH);
            renderer.cursorY += 4;
        }
    });
};

export const generatePdfResume = (resumeText: string, templateId: TemplateId, filename: string) => {
    try {
        // Pre-process the text to ensure list consistency.
        // This replaces any markdown list starting with '*' with '-' to prevent parsing issues
        // and ensure the downloaded PDF does not contain literal '*' characters for bullets.
        const sanitizedResumeText = resumeText.replace(/^\s*\*\s/gm, '- ');

        const { jsPDF } = jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const parsedData = parseResumeStructure(sanitizedResumeText);
        
        doc.setFont('helvetica', 'normal');

        switch (templateId) {
            case 'professional':
                renderProfessionalTemplate(doc, parsedData);
                break;
            case 'technical':
                renderTechnicalTemplate(doc, parsedData);
                break;
            case 'modern':
                renderModernTemplate(doc, parsedData);
                break;
            case 'classic':
            default:
                renderClassicTemplate(doc, parsedData);
                break;
        }

        doc.save(filename);

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error generating the PDF. Please try again.");
    }
};