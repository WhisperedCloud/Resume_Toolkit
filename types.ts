export interface Experience {
  role: string;
  company: string;
  duration: string;
  responsibilities: string;
}

export interface Education {
  degree: string;
  institution: string;
  graduationYear: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  linkedIn: string;
  summary: string;
  skills: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
}

export interface ScoreBreakdown {
    category: string;
    score: number;
}

export interface Keyword {
    keyword: string;
    frequency: number;
}

export interface SkillGap {
    skill: string;
    importance: number;
    category: string;
}

export interface AnalysisResult {
    atsScore: number;
    scoreBreakdown: ScoreBreakdown[];
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keywords: Keyword[];
    skillsGap: SkillGap[];
}

export type TemplateId = 'classic' | 'modern' | 'professional' | 'technical';