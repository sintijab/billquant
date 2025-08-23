from rank_bm25 import BM25Okapi
def hybrid_retrieve(query, all_chunks, chunk_embeddings, embedder, top_k=3, alpha=0.7):
    # Semantic search
    query_emb = embedder.encode(query, convert_to_tensor=True)
    semantic_hits = util.semantic_search(query_emb, chunk_embeddings, top_k=len(all_chunks))[0]
    semantic_scores = {hit['corpus_id']: hit['score'] for hit in semantic_hits}

    # BM25 keyword search
    tokenized_chunks = [chunk.lower().split() for chunk in all_chunks]
    bm25 = BM25Okapi(tokenized_chunks)
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)
    import numpy as np
    # Normalize BM25 scores to [0,1]
    bm25_min = min(bm25_scores) if len(bm25_scores) > 0 else 0
    bm25_max = max(bm25_scores) if len(bm25_scores) > 0 else 1
    bm25_scores_norm = [(score - bm25_min) / (bm25_max - bm25_min + 1e-8) for score in bm25_scores]

    # Normalize semantic scores to [0,1]
    sem_scores_list = [semantic_scores.get(idx, 0) for idx in range(len(all_chunks))]
    sem_min = min(sem_scores_list) if sem_scores_list else 0
    sem_max = max(sem_scores_list) if sem_scores_list else 1
    semantic_scores_norm = [(score - sem_min) / (sem_max - sem_min + 1e-8) for score in sem_scores_list]

    # Apply softmax to sharpen the ranking
    bm25_softmax = list(np.exp(bm25_scores_norm) / np.sum(np.exp(bm25_scores_norm)))
    sem_softmax = list(np.exp(semantic_scores_norm) / np.sum(np.exp(semantic_scores_norm)))

    # Combine scores
    combined_scores = {}
    for idx in range(len(all_chunks)):
        bm25_score = bm25_softmax[idx]
        sem_score = sem_softmax[idx]
        combined_scores[idx] = alpha * bm25_score + (1 - alpha) * sem_score

    # Get top_k indices
    top_indices = sorted(combined_scores, key=lambda i: combined_scores[i], reverse=True)[:top_k]
    return [all_chunks[i] for i in top_indices]
import os
import re
import torch
from sentence_transformers import SentenceTransformer, util

def load_and_chunk_rag_txt(rag_folder="rag", out_file="all_chunks.txt"):
    chunks = []
    for fname in os.listdir(rag_folder):
        if fname.endswith(".txt"):
            with open(os.path.join(rag_folder, fname), "r", encoding="utf-8") as f:
                content = f.read()
                # Extract mainCategory and Description from the top
                main_cat_match = re.search(r"Main Category: (.*)", content)
                desc_match = re.search(r"Description: (.*)", content)
                main_category = main_cat_match.group(1).strip() if main_cat_match else ""
                description = desc_match.group(1).strip() if desc_match else ""
                # Split by 'Category:'
                category_chunks = re.split(r'Category:', content)
                for chunk in category_chunks[1:]:
                    chunk_clean = chunk.strip().replace('\n', ' ')
                    chunk_text = f"Main Category: {main_category} Description: {description} Category: {chunk_clean}"
                    chunks.append(chunk_text)
    with open(out_file, "w", encoding="utf-8") as f:
        for chunk in chunks:
            f.write(chunk + "\n")
    print(f"All chunks written to {out_file}")

def embed_and_retrieve(query, all_chunks_file="all_chunks.txt", top_k=3, embeddings_path="chunk_embeddings_piemonte.pt"):
    import re
    try:
        from mistral_utils import answer_question
    except ImportError:
        def answer_question(q):
            return q  # fallback: identity
    with open(all_chunks_file, "r", encoding="utf-8") as f:
        all_chunks = [c.strip() for c in f if c.strip()]
    embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    if os.path.exists(embeddings_path):
        chunk_embeddings = torch.load(embeddings_path, map_location='cpu')
        # Fix: If chunk_embeddings is a meta tensor, reload properly
        try:
            if hasattr(chunk_embeddings, 'is_meta') and chunk_embeddings.is_meta:
                print('[RAG] chunk_embeddings is meta tensor, re-encoding on CPU...')
                chunk_embeddings = embedder.encode(all_chunks, convert_to_tensor=True, show_progress_bar=True)
                torch.save(chunk_embeddings, embeddings_path)
        except Exception:
            # Fallback: if any error, re-encode
            chunk_embeddings = embedder.encode(all_chunks, convert_to_tensor=True, show_progress_bar=True)
            torch.save(chunk_embeddings, embeddings_path)
        if len(chunk_embeddings) != len(all_chunks):
            chunk_embeddings = embedder.encode(all_chunks, convert_to_tensor=True, show_progress_bar=True)
            torch.save(chunk_embeddings, embeddings_path)
    else:
        chunk_embeddings = embedder.encode(all_chunks, convert_to_tensor=True, show_progress_bar=True)
        torch.save(chunk_embeddings, embeddings_path)

    # Use Mistral to generate a list of strong synonym queries (activity categories) in Italian
    try:
        refined_query = answer_question(f"Define the construction activity category in italian that describes it best in Prezziario with one to max 10 words, exclude any other commentary, for: {query}")
        # If the model returns a dict with error or rate limit, fallback
        if isinstance(refined_query, dict) and ("error" in refined_query or "rate limit" in str(refined_query).lower()):
            print("[RAG] Mistral failed or rate limit exceeded, using original query.")
            queries = [query]
        else:
            print(f"[RAG] Refined query/categories: {refined_query}")
            if isinstance(refined_query, str):
                queries = [q.strip() for q in re.split(r'[\n,;]+', refined_query) if q.strip()]
            else:
                queries = [str(refined_query)]
    except Exception as e:
        print(f"[RAG] Mistral exception: {e}. Using original query.")
        queries = [query]
    # Retrieve candidates for each synonym/category
    all_candidates = []
    for q in queries:
        print(f"[RAG] Searching with synonym/category: {q}")
        candidates = hybrid_retrieve(q, all_chunks, chunk_embeddings, embedder, top_k=5, alpha=0.1)
        all_candidates.extend(candidates)
    # Deduplicate
    all_candidates = list(dict.fromkeys(all_candidates))
    # Re-rank with Mistral
    best_accuracy = 0
    best_chunk = None
    best_idx = 0
    for i, chunk in enumerate(all_candidates):
        title = chunk.split("\n")[0] if "\n" in chunk else chunk[:500]
        prompt = f"Is the following construction activity relevant to the query '{query}'? Activity: '{title}'. Return number from 1 to 100 representing accuracy."
        try:
            acc_str = answer_question(prompt)
            try:
                accuracy = int(''.join(filter(str.isdigit, str(acc_str))))
            except Exception:
                accuracy = 0
        except Exception:
            accuracy = 0
        print(f"Chunk {i+1} title: {title}\nAccuracy: {accuracy}")
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_chunk = chunk
            best_idx = i
    # If best accuracy < 90, try alternative phrasings, unless Mistral failed/rate limited
    mistral_failed = False
    if best_accuracy < 90 and queries != [query]:
        try:
            print(f"[RAG] Best accuracy only {best_accuracy}, generating alternative phrasings...")
            alt_queries = answer_question(f"Give 5 alternative ways to describe the same construction activity as: {query}, in italian, each as a single line, no commentary.")
            if isinstance(alt_queries, dict) and ("error" in alt_queries or "rate limit" in str(alt_queries).lower()):
                print("[RAG] Mistral failed or rate limit exceeded for alternatives, skipping.")
                mistral_failed = True
            else:
                if isinstance(alt_queries, str):
                    alt_queries = [q.strip() for q in re.split(r'[\n,;]+', alt_queries) if q.strip()]
                elif not isinstance(alt_queries, list):
                    alt_queries = [str(alt_queries)]
                for alt in alt_queries:
                    print(f"[RAG] Trying alternative: {alt}")
                    candidates = hybrid_retrieve(alt, all_chunks, chunk_embeddings, embedder, top_k=5, alpha=0.1)
                    for i, chunk in enumerate(candidates):
                        title = chunk.split("\n")[0] if "\n" in chunk else chunk[:500]
                        prompt = f"Is the following construction activity relevant to the query '{query}'? Activity: '{title}'. Return number from 1 to 100 representing accuracy."
                        try:
                            acc_str = answer_question(prompt)
                            try:
                                accuracy = int(''.join(filter(str.isdigit, str(acc_str))))
                            except Exception:
                                accuracy = 0
                        except Exception:
                            accuracy = 0
                        print(f"[ALT] Chunk {i+1} title: {title}\nAccuracy: {accuracy}")
                        if accuracy > best_accuracy:
                            best_accuracy = accuracy
                            best_chunk = chunk
                            best_idx = i
        except Exception as e:
            print(f"[RAG] Mistral exception for alternatives: {e}. Skipping alternatives.")
            mistral_failed = True
    print(f"[RAG] Best accuracy: {best_accuracy} (chunk {best_idx+1})")
    print("[RAG] Pipeline complete.")
    # Helper to parse a chunk into the required structure
    def parse_chunk(chunk):
        import re
        # Find all Activity blocks
        activity_pattern = r"Activity:(.*?)(?=Activity:|$)"
        activities = re.findall(activity_pattern, chunk, re.DOTALL)
        results = []
        for activity_block in activities:
            # Title: from start to first Work
            work_match = re.search(r"Work:(.*?)Codice:", activity_block, re.DOTALL)
            title = ""
            if work_match:
                title = activity_block.split('Work:')[0].strip()
            else:
                title = activity_block.strip()
            # Find all Work blocks
            work_blocks = re.split(r"Work:", activity_block)
            resources = []
            for wb in work_blocks[1:]:
                # Extract fields
                desc = wb.split('Codice:')[0].strip() if 'Codice:' in wb else wb.strip()
                code = ""
                unit = ""
                price = ""
                # Extract code, unit, price
                code_match = re.search(r"Codice:\s*([^,\n]*)", wb)
                if code_match:
                    code = code_match.group(1).strip()
                unit_match = re.search(r"U\.M\.:\s*([^,\n]*)", wb)
                if unit_match:
                    unit = unit_match.group(1).strip()
                price_match = re.search(r"Euro:\s*([^,\n]*)", wb)
                if price_match:
                    price = price_match.group(1).strip()
                resources.append({
                    "description": desc,
                    "code": code,
                    "unit": unit,
                    "price": price,
                    "total": "",
                    "formula": "",
                    "quantity": ""
                })
            results.append({
                "code": "",
                "title": title,
                "unit": "",
                "quantity": "",
                "resources": resources
            })
        return results

    # Map all candidates using the parser and flatten the list
    mapped = []
    for chunk in all_candidates:
        mapped.extend(parse_chunk(chunk))
    return mapped

if __name__ == "__main__":
    load_and_chunk_rag_txt(rag_folder="./rag", out_file="all_chunks.txt")
    user_query = input("Enter your query: ")
    results = embed_and_retrieve(user_query, all_chunks_file="all_chunks.txt", top_k=1)
    print("\nTop relevant chunks:")
    for i, chunk in enumerate(results, 1):
        print(f"\n--- Chunk {i} ---\n{chunk}")
