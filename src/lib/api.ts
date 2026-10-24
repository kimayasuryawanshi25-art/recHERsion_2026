/**
 * HerHealth Companion - Typed API Client Wrapper
 * Handles CSRF token lifecycle, credentials: 'include', and strictly typed responses.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private csrfToken: string | null = null;
  private csrfPromise: Promise<string> | null = null;

  async getCsrfToken(forceRefresh = false): Promise<string> {
    if (this.csrfToken && !forceRefresh) {
      return this.csrfToken;
    }
    if (this.csrfPromise && !forceRefresh) {
      return this.csrfPromise;
    }

    this.csrfPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/csrf-token`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to retrieve CSRF token');
        const data = await res.json();
        this.csrfToken = data.csrfToken;
        return data.csrfToken;
      } finally {
        this.csrfPromise = null;
      }
    })();

    return this.csrfPromise;
  }

  private async request<T = any>(
    path: string,
    options: RequestInit = {},
    requiresCsrf = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !(options.body instanceof Blob)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (requiresCsrf || ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
      try {
        const token = await this.getCsrfToken();
        if (token) {
          headers['x-csrf-token'] = token;
        }
      } catch {
        // May be offline or unauthenticated
      }
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 403) {
      // Possible CSRF expiry; try once with fresh token
      const freshToken = await this.getCsrfToken(true);
      headers['x-csrf-token'] = freshToken;
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ message: retryRes.statusText }));
        throw new Error(err.message || `Request failed with status ${retryRes.status}`);
      }
      return retryRes.json();
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      return (await res.blob()) as unknown as T;
    }

    return res.json();
  }

  // --- Auth Endpoints ---
  auth = {
    me: async () => this.request('/auth/me'),
    login: async (email: string, password: string) =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: async (email: string, password: string) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: async () =>
      this.request('/auth/logout', {
        method: 'POST',
      }),
    deleteAccount: async (password: string) =>
      this.request('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      }),
  };

  // --- Sync Endpoints ---
  sync = {
    pull: async (since?: string) =>
      this.request(`/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ''}`),
    push: async (outbox: any[]) =>
      this.request('/sync/push', {
        method: 'POST',
        body: JSON.stringify({ outbox }),
      }),
  };

  // --- Profile Endpoints ---
  profile = {
    get: async () => this.request('/profile'),
    update: async (data: any) =>
      this.request('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    aboutMe: {
      get: async () => this.request('/profile/about-me'),
      saveSection: async (sectionKey: string, content: any) =>
        this.request(`/profile/about-me/${sectionKey}`, {
          method: 'PUT',
          body: JSON.stringify({ content }),
        }),
    },
    healthItems: {
      list: async () => this.request('/profile/health-items'),
      create: async (data: any) =>
        this.request('/profile/health-items', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: async (id: string) =>
        this.request(`/profile/health-items/${id}`, {
          method: 'DELETE',
        }),
    },
    lifeEvents: {
      list: async () => this.request('/profile/life-events'),
      create: async (data: any) =>
        this.request('/profile/life-events', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: async (id: string) =>
        this.request(`/profile/life-events/${id}`, {
          method: 'DELETE',
        }),
    },
    careTeam: {
      list: async () => this.request('/profile/care-team'),
      create: async (data: any) =>
        this.request('/profile/care-team', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: async (id: string) =>
        this.request(`/profile/care-team/${id}`, {
          method: 'DELETE',
        }),
    },
    medicines: {
      list: async () => this.request('/profile/medicines'),
      create: async (data: any) =>
        this.request('/profile/medicines', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: async (id: string) =>
        this.request(`/profile/medicines/${id}`, {
          method: 'DELETE',
        }),
    },
  };

  // --- Summaries & PDF ---
  summaries = {
    interview: async (payload: any) =>
      this.request('/summaries/interview', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    get: async (id: string) => this.request(`/summaries/${id}`),
    update: async (id: string, payload: any) =>
      this.request(`/summaries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    downloadPdf: async (id: string): Promise<Blob> =>
      this.request(`/summaries/${id}/pdf`, {
        method: 'POST',
      }),
  };

  // --- Life-Stage Transitions ---
  transitions = {
    suggest: async (payload?: any) =>
      this.request('/transitions/suggest', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      }),
    apply: async (payload: any) =>
      this.request('/transitions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  // --- Screening Timeline ---
  screening = {
    timeline: async () => this.request('/screening/timeline'),
  };

  // --- Observations ---
  observations = {
    list: async (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const q = params.toString();
      return this.request(`/observations${q ? `?${q}` : ''}`);
    },
    evidence: async (ruleId: string) => this.request(`/observations/${encodeURIComponent(ruleId)}/evidence`),
  };

  // --- Share Links ---
  share = {
    create: async (summaryId: string, expiryDays = 7, maxViews = 5) =>
      this.request('/share', {
        method: 'POST',
        body: JSON.stringify({ summaryId, expiryDays, maxViews }),
      }),
    list: async () => this.request('/share'),
    revoke: async (id: string) =>
      this.request(`/share/${id}`, {
        method: 'DELETE',
      }),
    getPublic: async (token: string) => this.request(`/share/public/${token}`),
  };

  // --- AI Summary & Consent ---
  ai = {
    getConsents: async () => this.request('/ai/consents'),
    updateConsent: async (consentType: string, granted: boolean) =>
      this.request('/ai/consents', {
        method: 'PUT',
        body: JSON.stringify({ consentType, granted }),
      }),
    draftSummary: async (entryIds: string[], promptContext?: string) =>
      this.request('/ai/draft-summary', {
        method: 'POST',
        body: JSON.stringify({ entryIds, promptContext }),
      }),
  };

  // --- Care Navigator ---
  navigator = {
    assess: async (inputs: any) =>
      this.request('/navigator/assess', {
        method: 'POST',
        body: JSON.stringify(inputs),
      }),
  };

  // --- Care Finder & Helplines ---
  finder = {
    helplines: async (category?: string) =>
      this.request(`/finder/helplines${category ? `?category=${encodeURIComponent(category)}` : ''}`),
    providers: async (params?: Record<string, any>) => {
      const q = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
        });
      }
      const qs = q.toString();
      return this.request(`/finder/providers${qs ? `?${qs}` : ''}`);
    },
  };

  // --- Appointment Debriefs & Follow-up Tasks ---
  debriefs = {
    list: async () => this.request('/debriefs'),
    create: async (data: any) =>
      this.request('/debriefs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    tasks: async (completed?: boolean) => {
      const q = completed !== undefined ? `?completed=${completed}` : '';
      return this.request(`/debriefs/tasks${q}`);
    },
    createTask: async (data: any) =>
      this.request('/debriefs/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTask: async (id: string, data: any) =>
      this.request(`/debriefs/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteTask: async (id: string) =>
      this.request(`/debriefs/tasks/${id}`, {
        method: 'DELETE',
      }),
  };
}

export const api = new ApiClient();
