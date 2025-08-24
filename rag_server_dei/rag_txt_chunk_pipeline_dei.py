embedder_global = None
def get_embedder():
    global embedder_global
    if embedder_global is None:
        from sentence_transformers import SentenceTransformer
        embedder_global = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    return embedder_global
from sentence_transformers import util
from rank_bm25 import BM25Okapi
def hybrid_retrieve(query, all_chunks, chunk_embeddings, embedder=None, top_k=3, alpha=0.7):
    # Semantic search
    if embedder is None:
        embedder = get_embedder()
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
import json
from sentence_transformers import SentenceTransformer, util
def get_pinecone_index(index_name="dei-chunks", dimension=384, metric="cosine", region=None):
    from pinecone import Pinecone, ServerlessSpec
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        raise RuntimeError("PINECONE_API_KEY not set in environment.")
    if region is None:
        region = os.getenv("PINECONE_REGION", "us-east-1")
    pc = Pinecone(api_key=api_key)
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric=metric,
            spec=ServerlessSpec(
                cloud="aws",
                region=region
            )
        )
    return pc.Index(index_name)

def upload_chunks_to_pinecone(chunks, chunk_embeddings, batch_size=70, index_name="dei-chunks", namespace="default", start_index=0):
    print(f"[Main] Preparing to upload DEI chunks to Pinecone from chunk_{start_index} to chunk_{start_index + len(chunks) - 1}...")
    ids = [f"chunk_{i}" for i in range(start_index, start_index + len(chunks))]
    metadatas = [
        {"chunk": chunk} for chunk in chunks
    ]
    index = get_pinecone_index(index_name=index_name, dimension=chunk_embeddings.shape[1])
    for i in range(0, len(chunks), batch_size):
        batch_ids = ids[i:i+batch_size]
        batch_embs = chunk_embeddings[i:i+batch_size]
        batch_metas = metadatas[i:i+batch_size]
        to_upsert = [
            (batch_ids[j], batch_embs[j], batch_metas[j])
            for j in range(len(batch_ids))
        ]
        index.upsert(vectors=to_upsert, namespace=namespace)
    print("[Main] DEI embeddings uploaded to Pinecone.")

def pinecone_retrieve(query, top_k=5, index_name="dei-chunks", namespace="default"):
    embedder = get_embedder()
    query_emb = embedder.encode(query, convert_to_numpy=True).tolist()
    index = get_pinecone_index(index_name=index_name)
    result = index.query(vector=query_emb, top_k=top_k, include_metadata=True, namespace=namespace)
    hits = result.get('matches', [])
    return [hit['metadata'].get('chunk', hit['id']) for hit in hits]

def embed_and_retrieve_dei(query, all_chunks_file="DEI_chunks.txt", top_k=3, embeddings_path="chunk_embeddings_dei.pt", use_pinecone=True):
    import re
    try:
        from mistral_utils import answer_question
    except ImportError:
        def answer_question(q):
            return q  # fallback: identity
    with open(all_chunks_file, "r", encoding="utf-8") as f:
        all_chunks = [c.strip() for c in f if c.strip()]
    embedder = get_embedder()
    chunk_embeddings = None
    if not use_pinecone:
        # Only generate/load .pt file if using local retrieval
        if os.path.exists(embeddings_path):
            chunk_embeddings = torch.load(embeddings_path, map_location='cpu')
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
        if use_pinecone:
            candidates = pinecone_retrieve(q, top_k=5)
        else:
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
    if best_accuracy < 85 and queries != [query]:
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
                    if use_pinecone:
                        candidates = pinecone_retrieve(alt, top_k=5)
                    else:
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
        # For DEI_chunks.txt format: Code: <code> Description: <desc> Unit: <unit> Price: <price>
        import re
        results = []
        # Updated regex: allow for empty unit value (unit can be empty or any non-newline string)
        pattern = r"Code:\s*([^\s]+)\s+Description:\s*(.*?)\s+Unit:\s*([^\n]*)\s+Price:\s*([0-9]+\.[0-9]{2})"
        matches = re.findall(pattern, chunk)
        resources = []
        for code, desc, unit, price in matches:
            resources.append({
                "code": code,
                "description": desc,
                "unit": unit.strip(),
                "price": price,
                "total": "",
                "formula": "",
                "quantity": ""
            })
        # Each chunk is a flat resource list, so wrap in a single result object
        if resources:
            results.append({
                "code": "",
                "title": "",
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
    # Use pre-chunked file for upload, not re-chunking from raw source
    corpus_path = "DEI_chunks.txt"
    embeddings_path = "chunk_embeddings_dei.pt"
    if not os.path.exists(corpus_path):
        raise RuntimeError(f"Corpus file '{corpus_path}' not found. Please generate it before uploading.")
    with open(corpus_path, "r", encoding="utf-8") as f:
        all_chunks = [line.strip() for line in f if line.strip()]
    # --- Check for oversized chunks and skip them ---
    max_metadata_bytes = 40960
    filtered_corpus = []
    filtered_indices = []
    for idx, chunk in enumerate(all_chunks):
        meta = {"chunk": chunk}
        meta_bytes = len(json.dumps(meta, ensure_ascii=False).encode("utf-8"))
        if meta_bytes > max_metadata_bytes:
            print(f"[Warning] Skipping chunk at index {idx} (ID chunk_{idx}) due to metadata size {meta_bytes} bytes > 40kB limit.")
            continue
        filtered_corpus.append(chunk)
        filtered_indices.append(idx)
    if not filtered_corpus:
        raise RuntimeError("No valid chunks to upload after filtering oversized chunks.")
    embedder_local = get_embedder()
    print("[Main] Encoding chunks for retrieval...")
    chunk_embeddings = embedder_local.encode(filtered_corpus, convert_to_numpy=True, show_progress_bar=True)
    # --- Upload all valid chunks to Pinecone ---
    upload_chunks_to_pinecone(filtered_corpus, chunk_embeddings, batch_size=70, index_name="dei-chunks", namespace="default", start_index=0)
    # Retrieval example
    user_query = input("Enter your query: ")
    # To use local retrieval, set use_pinecone=False
    results = embed_and_retrieve_dei(user_query, all_chunks_file="DEI_chunks.txt", top_k=1, use_pinecone=True)
    print("\nTop relevant chunks:")
    for i, chunk in enumerate(results, 1):
        print(f"\n--- Chunk {i} ---\n{chunk}")
