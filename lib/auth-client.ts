// Client-side authentication utilities
// This handles session management on the client side

interface SessionData {
  sessionId: string;
  userId: string;
  role: string;
  timestamp: number;
}

// Get or create unique tab ID for this session
function getTabId(): string {
  if (typeof window === 'undefined') return 'server';
  
  // Try to get existing tab ID from sessionStorage (per-tab storage)
  let tabId = sessionStorage.getItem('tab-id');
  
  if (!tabId) {
    // Generate new tab ID
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tab-id', tabId);
  }
  
  return tabId;
}

// Simple session management functions
export const authClient = {
  // Get current session from localStorage
  getCurrentSession(): SessionData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const tabId = getTabId();
      const sessionData = localStorage.getItem(`current-session-${tabId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Check if session is expired (24 hours)
        const now = Date.now();
        const sessionAge = now - parsed.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge > maxAge) {
          this.clearSession();
          return null;
        }

        return parsed;
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
      this.clearSession();
    }
    return null;
  },

  // Set session data
  setSession(sessionId: string, userId: string, role: string): void {
    if (typeof window === 'undefined') return;
    
    const sessionData: SessionData = {
      sessionId,
      userId,
      role,
      timestamp: Date.now()
    };
    
    const tabId = getTabId();
    localStorage.setItem(`current-session-${tabId}`, JSON.stringify(sessionData));
  },

  // Clear session
  clearSession(): void {
    if (typeof window === 'undefined') return;
    const tabId = getTabId();
    localStorage.removeItem(`current-session-${tabId}`);
  },

  // Get headers for API requests
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const session = this.getCurrentSession();
    if (session?.sessionId) {
      headers['x-session-id'] = session.sessionId;
    }

    return headers;
  },

  // Enhanced fetch with automatic session headers
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = this.getAuthHeaders();
    
    const enhancedOptions: RequestInit = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    };

    return fetch(url, enhancedOptions);
  }
};
