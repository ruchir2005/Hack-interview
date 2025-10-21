// Simple in-memory database for interview data
// This can be replaced with SQLite, Firebase, or any other database later

export interface InterviewData {
  sessionId: string;
  resumeData: {
    fileName?: string;
    jobRole: string;
    companyName: string;
    yearsOfExperience: number;
    jobDescription: string;
  };
  currentQuestion?: string;
  currentRound?: string;
  timestamp: number;
}

// In-memory storage (will be replaced with actual DB)
const interviewStore = new Map<string, InterviewData>();

export const db = {
  // Save interview data
  saveInterviewData: (data: InterviewData): void => {
    interviewStore.set(data.sessionId, data);
    // Also persist to localStorage for now
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`interview_${data.sessionId}`, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  },

  // Get interview data by session ID
  getInterviewData: (sessionId: string): InterviewData | null => {
    // Try memory first
    let data = interviewStore.get(sessionId);
    
    // Fallback to localStorage
    if (!data && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`interview_${sessionId}`);
        if (stored) {
          data = JSON.parse(stored);
          if (data) {
            interviewStore.set(sessionId, data);
          }
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
      }
    }
    
    return data || null;
  },

  // Update interview data
  updateInterviewData: (sessionId: string, updates: Partial<InterviewData>): void => {
    const existing = db.getInterviewData(sessionId);
    if (existing) {
      const updated = { ...existing, ...updates };
      db.saveInterviewData(updated);
    }
  },

  // Delete interview data
  deleteInterviewData: (sessionId: string): void => {
    interviewStore.delete(sessionId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`interview_${sessionId}`);
      } catch (e) {
        console.error('Failed to delete from localStorage:', e);
      }
    }
  },

  // Get all interview sessions
  getAllSessions: (): InterviewData[] => {
    return Array.from(interviewStore.values());
  }
};
