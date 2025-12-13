export interface UnpackEntry {
  ts: string; // ISO string
  intensity: number; // 0-100
  words: string[];
  impact: string | null;
  activityType: string | null;
}

export interface SessionState {
  intensity: number;
  words: string[];
  impact: string | null;
  step: string;
}

export interface AgentResponse {
  activityText: string;
  activityType: string;
  skip?: boolean;
}

