
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  metadata?: {
    score?: number;
    feedback?: string;
    detectedSignLanguage?: string;
  };
}

export type SpokenLanguage = 'English' | 'Spanish' | 'Swahili' | 'French' | 'Arabic';
export type SignLanguage = 'ASL' | 'BSL' | 'KSL' | 'ISL' | 'LSE';

export interface AppSettings {
  spokenLanguage: SpokenLanguage;
  signLanguage: SignLanguage;
  conversationMode: boolean;
  theme: 'light' | 'dark' | 'high-contrast';
  processingSpeed: 'balanced' | 'accurate';
  accuracyThreshold: number; // 0-100
}

export interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
  stage?: 'analyzing' | 'generating_response' | 'scoring';
}

export interface AnalysisResult {
  translation: string;
  reply?: string;
  score: number;
  feedback: string;
  detectedSignLanguage: string;
}

export interface Drill {
  id: string;
  question: string;
  expectedSign: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface SessionStats {
  totalTranslations: number;
  averageAccuracy: number;
  languagesUsed: string[];
  impactMetric: number; // Mock "People Connected"
}
