export interface LintingIssue {
  text: string;
  message: string;
  rule: string;
}

export interface AnalysisMetadata {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost: string;
  timestamp: string;
}

export interface Issue {
  start: string;
  end: string;
  message: string;
  rule: string;
}

export interface AnalysisResponse {
  metadata?: {
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cost: string;
    timestamp: string;
  };
  issues: Issue[];
  rawResponse: string;
}

export interface AiService {
  lastResponse: string;
}
