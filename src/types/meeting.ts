export interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface Citation {
  timestamp: string;
}

export interface AnalysisItem {
  text?: string;
  task?: string;
  assignee?: string | null;
  citations: Citation[];
}

export interface AnalysisResult {
  summary: AnalysisItem[];
  actionItems: AnalysisItem[];
  decisions: AnalysisItem[];
  followUps: AnalysisItem[];
}