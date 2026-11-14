import json
import logging
from datetime import datetime
from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

from app.config import settings
from app.core.nli_engine import nli_engine
from app.core.embeddings import embedding_engine
from app.core.vector_store import vector_store

logger = logging.getLogger(__name__)

class BenchmarkEvaluationEngine:
    def __init__(self):
        self.claim_benchmark_file = settings.EVAL_DIR / "claim_benchmark.json"
        self.retrieval_benchmark_file = settings.EVAL_DIR / "retrieval_benchmark.json"

    def evaluate_nli_benchmark(self) -> Dict[str, Any]:
        """
        Runs empirical evaluation across the curated claim relationship benchmark.
        Computes real Precision, Recall, F1, and Confusion Matrix using scikit-learn.
        Never fabricates metrics.
        """
        if not self.claim_benchmark_file.exists():
            raise FileNotFoundError(f"Benchmark file not found at {self.claim_benchmark_file}")

        with open(self.claim_benchmark_file, "r", encoding="utf-8") as f:
            benchmark_data = json.load(f)

        candidate_pairs = []
        y_true = []

        for item in benchmark_data:
            claim_a = {
                "id": f"{item['id']}_a",
                "verbatim_text": item["claim_a"],
                "paper_title": item.get("domain", "Benchmark Paper A"),
                "page_number": 1
            }
            claim_b = {
                "id": f"{item['id']}_b",
                "verbatim_text": item["claim_b"],
                "paper_title": item.get("domain", "Benchmark Paper B"),
                "page_number": 1
            }
            candidate_pairs.append((claim_a, claim_b, 0.85))
            y_true.append(item["ground_truth"])

        # Execute actual inference
        predictions = nli_engine.predict_pairs(candidate_pairs)
        y_pred = [p["nli_label"] for p in predictions]

        labels = ["CONTRADICTION", "ENTAILMENT", "NEUTRAL"]
        report = classification_report(
            y_true,
            y_pred,
            labels=labels,
            output_dict=True,
            zero_division=0
        )
        cm = confusion_matrix(y_true, y_pred, labels=labels)

        class_metrics = {}
        for label in labels:
            metrics = report.get(label, {})
            class_metrics[label] = {
                "precision": round(metrics.get("precision", 0.0), 4),
                "recall": round(metrics.get("recall", 0.0), 4),
                "f1_score": round(metrics.get("f1-score", 0.0), 4),
                "support": int(metrics.get("support", 0))
            }

        retrieval_metrics = self.evaluate_retrieval_benchmark()

        return {
            "evaluated_at": datetime.utcnow().isoformat(),
            "total_claim_pairs": len(benchmark_data),
            "macro_f1": round(report.get("macro avg", {}).get("f1-score", 0.0), 4),
            "weighted_f1": round(report.get("weighted avg", {}).get("f1-score", 0.0), 4),
            "accuracy": round(report.get("accuracy", 0.0), 4),
            "class_metrics": class_metrics,
            "confusion_matrix": {
                "labels": labels,
                "matrix": cm.tolist()
            },
            "retrieval_metrics": retrieval_metrics,
            "data_source_description": "Curated empirical benchmark of 30 scientific claim pairs across attention, optimization, RL, and architectures."
        }

    def evaluate_retrieval_benchmark(self) -> Dict[str, Any]:
        """
        Evaluates retrieval performance (P@3, R@3, P@5, R@5, MRR) against a standardized,
        reproducible benchmark corpus with labeled relevance ground truth.
        """
        if not self.retrieval_benchmark_file.exists():
            return None

        with open(self.retrieval_benchmark_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not data or "corpus" not in data or "queries" not in data:
            return None

        corpus = data["corpus"]
        queries = data["queries"]

        # Encode benchmark passages
        corpus_texts = [doc["text"] for doc in corpus]
        corpus_ids = [doc["id"] for doc in corpus]
        corpus_embeddings = embedding_engine.embed_texts(corpus_texts)

        p_at_3_list, r_at_3_list = [], []
        p_at_5_list, r_at_5_list = [], []
        mrr_list = []

        for q_item in queries:
            query = q_item["query"]
            relevant_ids = set(q_item.get("relevant_corpus_ids", []))

            # Encode query using BGE instruction prefix
            q_emb = embedding_engine.embed_query(query)

            # Compute cosine similarities
            sims = np.dot(corpus_embeddings, q_emb)
            ranked_indices = np.argsort(sims)[::-1]

            hits_3 = 0
            hits_5 = 0
            first_hit_rank = 0

            for rank_idx, doc_idx in enumerate(ranked_indices[:5]):
                doc_id = corpus_ids[doc_idx]
                is_relevant = doc_id in relevant_ids
                if is_relevant:
                    if rank_idx < 3:
                        hits_3 += 1
                    hits_5 += 1
                    if first_hit_rank == 0:
                        first_hit_rank = rank_idx + 1

            target_count = max(1, len(relevant_ids))
            p_at_3_list.append(hits_3 / 3.0)
            r_at_3_list.append(hits_3 / target_count)
            p_at_5_list.append(hits_5 / 5.0)
            r_at_5_list.append(hits_5 / target_count)
            mrr_list.append(1.0 / first_hit_rank if first_hit_rank > 0 else 0.0)

        n = max(1, len(queries))
        return {
            "precision_at_3": round(sum(p_at_3_list) / n, 4),
            "recall_at_3": round(sum(r_at_3_list) / n, 4),
            "precision_at_5": round(sum(p_at_5_list) / n, 4),
            "recall_at_5": round(sum(r_at_5_list) / n, 4),
            "mrr": round(sum(mrr_list) / n, 4),
            "sample_queries_evaluated": len(queries),
            "benchmark_corpus_size": len(corpus)
        }

eval_engine = BenchmarkEvaluationEngine()
