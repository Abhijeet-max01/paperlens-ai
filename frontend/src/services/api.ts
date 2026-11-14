import {
  Paper,
  Task,
  SearchResponse,
  Claim,
  NLIMatrixResponse,
  ClaimPair,
  GapAnalysisResponse,
  QAResponse,
  EvalReport,
  SystemHealth,
  PaperAnalysis,
  ProcessingTransparency,
  SystemStats
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Keep default error text
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Papers
  async listPapers(params?: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    includeTestPapers?: boolean;
  }): Promise<Paper[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.sortBy) searchParams.append('sort_by', params.sortBy);
    if (params?.sortOrder) searchParams.append('sort_order', params.sortOrder);
    if (params?.includeTestPapers !== undefined) {
      searchParams.append('include_test_papers', String(params.includeTestPapers));
    }
    const queryStr = searchParams.toString();
    const res = await fetch(`${API_BASE}/papers${queryStr ? `?${queryStr}` : ''}`);
    return handleResponse<Paper[]>(res);
  },

  async getPaper(id: string): Promise<Paper> {
    const res = await fetch(`${API_BASE}/papers/${id}`);
    return handleResponse<Paper>(res);
  },

  async getPaperAnalysis(id: string): Promise<PaperAnalysis> {
    const res = await fetch(`${API_BASE}/papers/${id}/analysis`);
    return handleResponse<PaperAnalysis>(res);
  },

  async getPaperProcessing(id: string): Promise<ProcessingTransparency> {
    const res = await fetch(`${API_BASE}/papers/${id}/processing`);
    return handleResponse<ProcessingTransparency>(res);
  },

  async uploadPaper(file: File): Promise<Task> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/papers/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<Task>(res);
  },

  async deletePaper(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/papers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  getPDFUrl(id: string): string {
    return `${API_BASE}/papers/${id}/pdf`;
  },

  getDownloadPDFUrl(id: string): string {
    return `${API_BASE}/papers/${id}/download`;
  },

  async reanalyzePaper(id: string): Promise<PaperAnalysis> {
    const res = await fetch(`${API_BASE}/papers/${id}/reanalyze`, {
      method: 'POST',
    });
    return handleResponse<PaperAnalysis>(res);
  },

  // Tasks
  async getTask(taskId: string): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`);
    return handleResponse<Task>(res);
  },

  // Search
  async semanticSearch(query: string, topK: number = 5, minSimilarity: number = 0.35, paperIds?: string[]): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/search/semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: topK,
        min_similarity: minSimilarity,
        paper_ids: paperIds && paperIds.length > 0 ? paperIds : null,
      }),
    });
    return handleResponse<SearchResponse>(res);
  },

  // Claims
  async listClaims(paperId?: string, category?: string, minConfidence: number = 0.0): Promise<Claim[]> {
    const params = new URLSearchParams();
    if (paperId) params.append('paper_id', paperId);
    if (category) params.append('category', category);
    if (minConfidence > 0) params.append('min_confidence', minConfidence.toString());

    const res = await fetch(`${API_BASE}/claims?${params.toString()}`);
    return handleResponse<Claim[]>(res);
  },

  async extractPaperClaims(paperId: string): Promise<Claim[]> {
    const res = await fetch(`${API_BASE}/claims/extract/${paperId}`, {
      method: 'POST',
    });
    return handleResponse<Claim[]>(res);
  },

  // NLI Matrix & Contradictions
  async compareMatrix(paperIds?: string[], similarityThreshold: number = 0.60, maxPairs: number = 50): Promise<NLIMatrixResponse> {
    const res = await fetch(`${API_BASE}/nli/compare-matrix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_ids: paperIds && paperIds.length > 0 ? paperIds : null,
        similarity_threshold: similarityThreshold,
        max_pairs: maxPairs,
      }),
    });
    return handleResponse<NLIMatrixResponse>(res);
  },

  async listContradictions(): Promise<ClaimPair[]> {
    const res = await fetch(`${API_BASE}/nli/contradictions`);
    return handleResponse<ClaimPair[]>(res);
  },

  // Gaps
  async getGaps(): Promise<GapAnalysisResponse> {
    const res = await fetch(`${API_BASE}/gaps/all`);
    return handleResponse<GapAnalysisResponse>(res);
  },

  // QA
  async askQuestion(question: string, paperIds?: string[], topK: number = 6): Promise<QAResponse> {
    const res = await fetch(`${API_BASE}/qa/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        paper_ids: paperIds && paperIds.length > 0 ? paperIds : null,
        top_k: topK,
      }),
    });
    return handleResponse<QAResponse>(res);
  },

  // Evaluation
  async getBenchmarkReport(): Promise<EvalReport> {
    const res = await fetch(`${API_BASE}/eval/benchmark-results`);
    return handleResponse<EvalReport>(res);
  },

  // System
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/system/health`);
    return handleResponse<SystemHealth>(res);
  },

  async getSystemStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/system/stats`);
    return handleResponse<SystemStats>(res);
  },
};
