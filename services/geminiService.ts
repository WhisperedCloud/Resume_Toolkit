import { GoogleGenAI, Type } from "@google/genai";
import type { ResumeData, AnalysisResult } from '../types';

// Per guidelines, initialize with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Resume Builder Functions ---

const createResumePrompt = (resumeData: ResumeData, targetRole: string): string => {
    const { fullName, email, phone, linkedIn, summary, skills, experience, education, projects } = resumeData;

    const experienceString = experience.map(exp => 
        `- Role: ${exp.role} at ${exp.company} (${exp.duration})\n  Responsibilities: ${exp.responsibilities}`
    ).join('\n');

    const educationString = education.map(edu => 
        `- ${edu.degree}, ${edu.institution} (${edu.graduationYear})`
    ).join('\n');

    const projectsString = projects.map(proj => 
        `- Project: ${proj.name}\n  Description: ${proj.description}\n  Technologies: ${proj.technologies}`
    ).join('\n');

    return `
You are a world-class resume writing AI and an expert on Applicant Tracking Systems (ATS). Your mission is to generate a resume guaranteed to score 95 or higher on any major ATS platform (like Greenhouse, Lever, Taleo).
Based on the following information, generate a professional resume tailored for the target role of "${targetRole}".
The final output must be only the resume text in clean, single-column Markdown.

Candidate Information:
- Full Name: ${fullName}
- Contact: ${email} | ${phone} ${linkedIn ? `| ${linkedIn}` : ''}
- Professional Summary: ${summary}
- Skills: ${skills}
- Experience:
${experienceString}
- Education:
${educationString}
- Projects:
${projectsString}

Instructions for ATS-Optimized Resume Generation (Target: 95+ Score):
1.  **Impact-Oriented Experience**: For every bullet point under "Experience", strictly follow the STAR method (Situation, Task, Action, Result). Start every point with a powerful action verb and quantify the 'Result' with specific metrics, percentages, or concrete outcomes (e.g., "Orchestrated a database migration that improved query response times by 45% for over 10,000 daily users.").
2.  **Project Case Studies**: Transform each "Project" into a mini case study. You MUST convert the project 'description' field from the input into 2-4 distinct, impactful bullet points. Each bullet point must also follow the STAR method and be quantified. Focus on the problem solved, the technical solution, and the measurable success of the project. After the bullet points for each project, you MUST add a line formatted exactly as '**Technologies:**' followed by a comma-separated list of the technologies used (e.g., "**Technologies:** React, Node.js, PostgreSQL"). This section is critical for demonstrating practical skills.
3.  **Strategic Keyword Saturation**: Meticulously analyze the target role of "${targetRole}". Identify the most critical hard skills, soft skills, and technical terminologies. Weave these keywords naturally and with high frequency throughout the "Summary", "Skills", and "Experience" sections. The density of these keywords is paramount for a high ATS score.
4.  **Flawless ATS-Friendly Formatting**: The output must be clean, single-column markdown.
    - Use only these standard section headers: "## Summary", "## Skills", "## Experience", "## Projects", "## Education".
    - Use simple hyphens (-) for all bullet points. No other symbols.
    - Do not use tables, multiple columns, or complex indentation. Simplicity is key for parsability.
5.  **Header and Structure**: The resume must begin with the candidate's name on the first line, followed by a single line of contact information on the second. The sections should be in a logical order that prioritizes the most relevant information for recruiters.
`;
};


export async function* generateResumeTextStream(
    resumeData: ResumeData, 
    targetRole: string
): AsyncGenerator<string> {
    const prompt = createResumePrompt(resumeData, targetRole);
    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                temperature: 0.5,
            }
        });

        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error generating resume stream with Gemini:", error);
        throw new Error(error instanceof Error ? `Failed to generate resume: ${error.message}` : "An unknown error occurred.");
    }
}

const keywordsSchema = {
    type: Type.OBJECT,
    properties: {
        keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 10-15 targeted keywords and short phrases."
        }
    },
    required: ["keywords"]
};


export const suggestKeywords = async (resumeText: string, targetRole: string): Promise<string[]> => {
    const prompt = `
Based on the following resume, which is tailored for the target role of "${targetRole}", suggest an array of 10-15 highly relevant keywords and short phrases.
These keywords should be valuable for passing through an Applicant Tracking System (ATS) and should complement the skills already present in the resume.

Resume Text:
---
${resumeText}
---
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: keywordsSchema,
            }
        });
        const jsonText = response.text?.trim();
        if (!jsonText) return [];
        
        const result = JSON.parse(jsonText);
        return result.keywords || [];

    } catch (error) {
        console.error("Error suggesting keywords with Gemini:", error);
        // Fail gracefully, return empty array
        return [];
    }
}

const resumeDataSchema = {
    type: Type.OBJECT,
    properties: {
        fullName: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        linkedIn: { type: Type.STRING, description: "Full URL, if found." },
        summary: { type: Type.STRING, description: "Professional summary section." },
        skills: { type: Type.STRING, description: "A single comma-separated string of skills." },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    company: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    responsibilities: { type: Type.STRING, description: "A single string containing all bullet points/responsibilities for this role." },
                },
                required: ["role", "company", "duration", "responsibilities"],
            },
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    graduationYear: { type: Type.STRING },
                },
                required: ["degree", "institution", "graduationYear"],
            },
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    technologies: { type: Type.STRING, description: "A single comma-separated string of technologies." },
                },
                required: ["name", "description", "technologies"],
            },
        },
    },
};

export const extractDataFromResumeText = async (resumeText: string): Promise<ResumeData> => {
    const prompt = `
Parse the following resume text and extract the information into a structured JSON object.
Infer the different sections (summary, skills, experience, education, projects) and populate the fields accordingly.
For skills and technologies, combine them into a single comma-separated string.
For experience responsibilities, combine all bullet points for a single role into one string.

Resume Text:
---
${resumeText}
---
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: resumeDataSchema as any, // Cast because of schema complexity
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const jsonText = response.text?.trim();

        if (!jsonText) {
            throw new Error("The AI could not understand the provided resume. The format might be too complex or unconventional. Please try filling out the form manually for best results.");
        }

        return JSON.parse(jsonText) as ResumeData;
    } catch (error) {
        console.error("Error extracting data from resume:", error);
        throw new Error(error instanceof Error ? `Failed to import data from resume: ${error.message}` : "An unknown error occurred during import.");
    }
};

// --- Resume Analyzer & Rectifier Functions ---

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        atsScore: { type: Type.INTEGER, description: "Overall ATS score from 0 to 100." },
        scoreBreakdown: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, description: "e.g., Keyword Optimization, Impact Quantification" },
                    score: { type: Type.INTEGER, description: "Score for this category (0-100)." },
                },
                required: ["category", "score"],
            },
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        keywords: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    frequency: { type: Type.INTEGER },
                },
                required: ["keyword", "frequency"],
            },
        },
        skillsGap: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING },
                    importance: { type: Type.INTEGER, description: "Importance from 1 (low) to 5 (high)." },
                    category: { type: Type.STRING, description: "e.g., Technical, Soft Skill." },
                },
                required: ["skill", "importance", "category"],
            },
        },
    },
    required: ["atsScore", "scoreBreakdown", "strengths", "weaknesses", "suggestions", "keywords", "skillsGap"],
};


export const analyzeResumeText = async (resumeText: string): Promise<AnalysisResult> => {
    const prompt = `
Analyze the following resume text and provide a detailed review in JSON format.
- Calculate an overall ATS score.
- Break down the score into categories: 'Keyword Optimization', 'Impact Quantification', 'Format Clarity', and 'Skill Coverage'.
- Identify 3 key strengths.
- Identify 3 key weaknesses.
- Provide 3 actionable suggestions for improvement.
- Extract the top 10-15 most frequent and relevant keywords.
- Identify 5-10 important missing skills, assigning an importance score from 1-5.

Resume Text:
---
${resumeText}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
            },
        });
        
        const jsonText = response.text?.trim();

        if (!jsonText) {
            throw new Error("The AI returned an empty analysis. This can be due to content safety filters. Please check the resume text and try again.");
        }
        
        const result = JSON.parse(jsonText);

        if (!result.atsScore || !result.scoreBreakdown) {
            throw new Error("The AI analysis was incomplete. Please try again.");
        }

        return result as AnalysisResult;

    } catch (error) {
        console.error("Error analyzing resume with Gemini:", error);
        throw new Error(error instanceof Error ? `Failed to analyze resume: ${error.message}` : "An unknown error occurred.");
    }
};

export const rectifyResumeText = async (resumeText: string, analysis: AnalysisResult): Promise<ResumeData> => {
    const missingSkills = analysis.skillsGap.map(s => s.skill).join(', ');
    const prompt = `
You are an expert resume writer and an ATS optimization specialist. You have been given a resume and a detailed analysis identifying its flaws.
Your task is to meticulously rewrite the resume to address all the feedback, transforming it into a top-tier, professional document. After rewriting, you will parse the improved content into a structured JSON object.

Original Resume Text:
---
${resumeText}
---

Analysis and Feedback to Implement:
---
- Key Weaknesses to Fix: ${analysis.weaknesses.join('; ')}
- Actionable Suggestions to Apply: ${analysis.suggestions.join('; ')}
- Missing Skills to Incorporate: ${missingSkills}
---

Instructions for Rectification (Your primary goal is to create a perfect resume):
1.  **Address All Feedback**: Your top priority is to fix every weakness and implement every suggestion from the analysis. Do not ignore any point.
2.  **Integrate Missing Skills**: Strategically and naturally weave the "Missing Skills to Incorporate" into the 'summary', 'skills', 'experience', and 'projects' sections where appropriate.
3.  **Quantify Everything (STAR Method)**: Rewrite all experience and project descriptions using the STAR method (Situation, Task, Action, Result). Every bullet point MUST end with a quantifiable result (e.g., "increased efficiency by 30%", "reduced server costs by $5k/month", "served 10,000 users", "achieved a 20% faster load time"). Vague statements are not acceptable.
4.  **Enhance Project Descriptions**: This is a critical step. For each project, you MUST rewrite the description as 2-4 distinct bullet points. Each bullet point needs to be a compelling, quantified achievement using the STAR method. Transform them from simple descriptions into impressive case studies that showcase technical skill and impact.
5.  **Final Polish**: Ensure the entire resume is professional, free of grammatical errors, and uses strong, confident action verbs throughout.

Parsing Instructions:
- After mentally improving the resume based on all the above instructions, parse the *new and improved* content into a single JSON object that strictly adheres to the provided schema.
- For skills and technologies, combine them into a single comma-separated string.
- For experience responsibilities, combine all bullet points for a single role into one string.
- The final output must be only the JSON object, with no other text before or after it.
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                temperature: 0.6,
                responseMimeType: 'application/json',
                responseSchema: resumeDataSchema as any,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        const jsonText = response.text?.trim();
        if (!jsonText) throw new Error("The AI could not automatically improve the resume. This might be a temporary issue. Please try again or make edits manually in the builder.");
        return JSON.parse(jsonText) as ResumeData;
    } catch (error) {
        console.error("Error rectifying resume with Gemini:", error);
        throw new Error(error instanceof Error ? `Failed to improve resume: ${error.message}` : "An unknown error occurred.");
    }
};