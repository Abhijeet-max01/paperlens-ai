export interface Paper {
  id: string;
  title: string;
  authors?: string;
  affiliations?: string[];
  emails?: string[];
  year?: number;
  filename: string;
  total_pages: number;
  processing_status: 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  error_message?: string;
  has_ocr_applied: boolean;
  is_test_document: boolean;
  unextractable_pages: number[];
  created_at: string;
  chunk_count: number;
  claim_count: number;
  limitation_count: number;
  searchable_passages_count: number;
  candidate_claims_count: number;
  author_limitations_count: number;
  ai_inferred_limitations_count: number;
  file_path?: string;
  sections_detected?: string[];
}

export interface ProcessingStage {
  id: number;
  name: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  detail: string;
}

export interface ProcessingTransparency {
  paper_id: string;
  title: string;
  filename: string;
  processing_status: string;
  total_pages: number;
  unextractable_pages: number[];
  has_ocr_applied: boolean;
  ocr_engine_available: boolean;
  chunk_count: number;
  claim_count: number;
  limitation_count: number;
  stages: ProcessingStage[];
}

export interface ProblemStatementItem {
  statement: string;
  section: string;
  page_number: number;
  chunk_id?: string;
}

export interface ContributionItem {
  statement: string;
  section: string;
  page_number: number;
  chunk_id?: string;
}

export interface MethodologyItem {
  description: string;
  section: string;
  page_number: number;
  chunk_id?: string;
}

export interface DatasetItem {
  dataset_info: string;
  section: string;
  page_number: number;
}

export interface NumericalResultItem {
  finding: string;
  section: string;
  page_number: number;
  chunk_id?: string;
  is_own_finding?: boolean;
  metric_category?: string;
}

export interface ClaimDetailItem {
  id: string;
  verbatim_text: string;
  normalized_claim: string;
  category: string;
  page_number: number;
  confidence_score: number;
  extracted_verb: string;
  extraction_method: string;
  is_candidate: boolean;
}

export interface AuthorLimitationItem {
  id: string;
  text: string;
  section: string;
  page_number: number;
  tier: string;
}

export interface InferredLimitationItem {
  title: string;
  description: string;
  evidence: string;
  page_number: number;
  tier: string;
  significance: string;
}

export interface PotentialGapItem {
  title: string;
  description: string;
  page_number: number;
  suggested_question: string;
}

export interface EvidencePassageItem {
  chunk_id: string;
  page_number: number;
  section_name: string;
  content: string;
  token_count: number;
  chunk_index: number;
}

export interface PaperAnalysis {
  paper_id: string;
  title: string;
  authors: string;
  affiliations?: string[];
  emails?: string[];
  year?: number;
  filename: string;
  total_pages: number;
  processing_status: string;
  has_ocr_applied: boolean;
  is_test_document: boolean;
  unextractable_pages: number[];
  sections_detected: string[];
  abstract: {
    text: string;
    source?: {
      section: string;
      page_number: number;
    };
    is_reliable?: boolean;
  };
  research_problems: ProblemStatementItem[];
  contributions: ContributionItem[];
  methodology_overview: MethodologyItem[];
  datasets: DatasetItem[];
  numerical_results: NumericalResultItem[];
  conclusion: {
    text: string;
    page_number?: number;
  };
  claims: ClaimDetailItem[];
  limitations_and_gaps: {
    author_stated_limitations: AuthorLimitationItem[];
    ai_inferred_limitations: InferredLimitationItem[];
    potential_research_gaps: PotentialGapItem[];
  };
  evidence_passages: EvidencePassageItem[];
}

export interface Task {
  id: string;
  paper_id?: string;
  task_type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress_percent: number;
  current_stage: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  stages?: ProcessingStage[];
}

export interface SearchResult {
  chunk_id: string;
  paper_id: string;
  paper_title: string;
  page_number: number;
  section_name: string;
  content: string;
  similarity_score: number;
  highlighted_snippet: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResult[];
}

export interface Claim {
  id: string;
  paper_id: string;
  paper_title?: string;
  chunk_id: string;
  page_number: number;
  verbatim_text: string;
  char_start_offset: number;
  char_end_offset: number;
  category: string;
  confidence_score: number;
  extracted_verb: string;
  normalized_claim?: string;
  extraction_method?: string;
  is_candidate?: boolean;
  created_at: string;
}

export interface ClaimPair {
  id: string;
  claim_a_id: string;
  claim_a_text: string;
  claim_a_paper_title: string;
  claim_a_page: number;
  claim_b_id: string;
  claim_b_text: string;
  claim_b_paper_title: string;
  claim_b_page: number;
  semantic_similarity: number;
  nli_label: 'ENTAILMENT' | 'CONTRADICTION' | 'NEUTRAL';
  scientific_relationship?: string;
  entailment_score: number;
  contradiction_score: number;
  neutral_score: number;
  context_comparison_note?: string;
  created_at: string;
}

export interface NLIMatrixCell {
  paper_a_id: string;
  paper_a_title: string;
  paper_b_id: string;
  paper_b_title: string;
  entailment_count: number;
  contradiction_count: number;
  neutral_count: number;
  sample_pairs: ClaimPair[];
}

export interface NLIMatrixResponse {
  total_comparisons: number;
  total_contradictions: number;
  total_entailments: number;
  matrix_cells: NLIMatrixCell[];
  pairs: ClaimPair[];
  epistemic_disclaimer: string;
}

export interface Limitation {
  id: string;
  paper_id: string;
  paper_title: string;
  page_number: number;
  limitation_text: string;
  section_found: string;
  tier: string;
  created_at: string;
}

export interface InferredGap {
  id: string;
  title: string;
  description: string;
  confidence_score: number;
  conflicting_paper_titles: string[];
  supporting_claim_snippets: string[];
  suggested_research_question: string;
  tier: string;
}

export interface GapAnalysisResponse {
  total_explicit_limitations: number;
  total_inferred_gaps: number;
  explicit_limitations: Limitation[];
  inferred_gaps: InferredGap[];
}

export interface CitationItem {
  citation_id: string;
  paper_id: string;
  paper_title: string;
  page_number: number;
  chunk_id: string;
  section_name: string;
  quoted_snippet: string;
  is_verified: boolean;
  provenance_verified?: boolean;
  semantic_support_status?: string;
  semantic_support_score?: number;
  associated_claim?: string;
  verification_note?: string;
}

export interface SearchedPaperItem {
  id: string;
  title: string;
  filename: string;
}

export interface EvidencePaperItem {
  id: string;
  title: string;
  chunk_count: number;
  page_numbers: number[];
}

export interface QAResponse {
  question: string;
  answer: string;
  synthesis_summary: string;
  direct_response?: string;
  summary_of_evidence?: string;
  supporting_findings?: string[];
  contradicting_findings?: string[];
  inconclusive_evidence?: string[];
  methodology_and_dataset_differences?: string[];
  balanced_interpretation?: string;
  searched_papers?: SearchedPaperItem[];
  evidence_papers?: EvidencePaperItem[];
  agreements: string[];
  discrepancies: string[];
  citations: CitationItem[];
  verified_citation_count: number;
  unverified_citation_count: number;
  unique_contributing_paper_count?: number;
  duplicate_evidence_filtered_count?: number;
  excluded_out_of_scope_count?: number;
}

export interface ClassMetric {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface EvalReport {
  evaluated_at: string;
  total_claim_pairs: number;
  macro_f1: number;
  weighted_f1: number;
  accuracy: number;
  class_metrics: Record<string, ClassMetric>;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
  retrieval_metrics?: {
    precision_at_3: number;
    recall_at_3: number;
    precision_at_5: number;
    recall_at_5: number;
    mrr: number;
    sample_queries_evaluated: number;
  };
  data_source_description: string;
}

export interface SystemHealth {
  status: string;
  app_name: string;
  version: string;
  device: string;
  hardware: string;
  cpu_count: number;
  tesseract_ocr_available: boolean;
  tesseract_path?: string;
  faiss_indexed_vectors: number;
  loaded_models_in_memory: string[];
}

export interface StatMetricItem {
  value: number;
  label: string;
  description: string;
}

export interface SystemStats {
  total_uploaded_papers: StatMetricItem;
  user_research_papers: StatMetricItem;
  test_fixture_papers: StatMetricItem;
  indexed_papers: StatMetricItem;
  processing_papers: StatMetricItem;
  failed_papers: StatMetricItem;
  total_extracted_claims: StatMetricItem;
  comparisons_performed: StatMetricItem;
  questions_asked: StatMetricItem;
  research_gaps_identified: StatMetricItem;
  searchable_passages: StatMetricItem;
  faiss_vectors: StatMetricItem;
}
