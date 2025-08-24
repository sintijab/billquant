import os
import numpy as np
import torch
import re
import os
import numpy as np
import torch
import re

import os
import re
import json
import torch
import numpy as np
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer, util
from rank_bm25 import BM25Okapi

load_dotenv()

def pinecone_retrieve(query, top_k=5, index_name="piemonte-chunks", namespace="default"):
    """
    Retrieve top_k most similar chunks from Pinecone using semantic search.
    """
    embedder = get_embedder()
    query_emb = embedder.encode(query, convert_to_numpy=True).tolist()
    index = get_pinecone_index(index_name=index_name)
    # Query Pinecone
    result = index.query(vector=query_emb, top_k=top_k, include_metadata=True, namespace=namespace)
    # Extract chunk texts from metadata
    hits = result.get('matches', [])
    # If you store the full chunk text in metadata, return it; otherwise, return IDs or other fields
    return [hit['metadata'].get('chunk', hit['id']) for hit in hits]

def get_pinecone_index(index_name="piemonte-chunks", dimension=384, metric="cosine", region=None):
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
def upload_chunks_to_pinecone(chunks, batch_size=70, index_name="piemonte-chunks", namespace="default"):
    """
    Uploads all chunks to Pinecone in batches, with embeddings and metadata.
    """
    print("[Main] Preparing to upload chunks to Pinecone...")
    corpus = [chunk for chunk in chunks]
    # Troubleshoot: check metadata size for each chunk
    for idx, chunk in enumerate(corpus):
        meta_size = len(chunk.encode('utf-8'))
        if meta_size > 40960:
            print(f"[Warning] Chunk {idx} metadata size {meta_size} bytes exceeds Pinecone limit (40960 bytes). Preview: {chunk[:200]}...")
    embedder = get_embedder()
    print("[Main] Encoding chunks for retrieval...")
    chunk_embeddings = embedder.encode(corpus, convert_to_numpy=True, show_progress_bar=True)
    index = get_pinecone_index(index_name=index_name, dimension=chunk_embeddings.shape[1])
    ids = [f"chunk_{i}" for i in range(len(corpus))]
    metadatas = [
        {"chunk": chunk} for chunk in chunks
    ]
    for i in range(0, len(corpus), batch_size):
        batch_ids = ids[i:i+batch_size]
        batch_embs = chunk_embeddings[i:i+batch_size]
        batch_metas = metadatas[i:i+batch_size]
        to_upsert = [
            (batch_ids[j], batch_embs[j], batch_metas[j])
            for j in range(len(batch_ids))
        ]
        index.upsert(vectors=to_upsert, namespace=namespace)
    print("[Main] Embeddings uploaded to Pinecone.")
from rank_bm25 import BM25Okapi
embedder_global = None
def get_embedder():
    global embedder_global
    if embedder_global is None:
        from sentence_transformers import SentenceTransformer
        embedder_global = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    return embedder_global

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
from sentence_transformers import SentenceTransformer, util

def load_and_chunk_rag_txt(rag_folder="rag", out_file="all_chunks.txt"):
    chunks = []
    def split_large_chunk(chunk_text, main_category, description, category_name):
        # Recursively split chunk_text if it exceeds 40960 bytes
        max_bytes = 40960
        chunk_bytes = chunk_text.encode('utf-8')
        if len(chunk_bytes) <= max_bytes:
            return [chunk_text]
        # Find all 'Work:' positions
        work_positions = [m.start() for m in re.finditer(r'Work:', chunk_text)]
        # If no 'Work:' found, force split at cutoff
        if not work_positions:
            # Try to avoid breaking utf-8
            cutoff = max_bytes
            while cutoff > 0 and (ord(chunk_text[cutoff-1]) & 0xC0) == 0x80:
                cutoff -= 1
            first_part = chunk_text[:cutoff].strip()
            rest_part = chunk_text[cutoff:].strip()
            result = []
            if first_part:
                result.append(first_part)
            if rest_part:
                result.extend(split_large_chunk(rest_part, main_category, description, category_name))
            return result
        # Find the last 'Work:' before the limit
        split_pos = None
        for pos in work_positions:
            if len(chunk_text[:pos].encode('utf-8')) < max_bytes:
                split_pos = pos
            else:
                break
        if split_pos is None:
            # All 'Work:' are after the limit, so force split at cutoff
            cutoff = max_bytes
            while cutoff > 0 and (ord(chunk_text[cutoff-1]) & 0xC0) == 0x80:
                cutoff -= 1
            first_part = chunk_text[:cutoff].strip()
            rest_part = chunk_text[cutoff:].strip()
            result = []
            if first_part:
                result.append(first_part)
            if rest_part:
                result.extend(split_large_chunk(rest_part, main_category, description, category_name))
            return result
        # Split at the found 'Work:'
        first_part = chunk_text[:split_pos].strip()
        rest_part = chunk_text[split_pos:].strip()
        result = []
        if first_part:
            result.append(first_part)
        if rest_part:
            # Recursively split the rest, which starts with 'Work:'
            result.extend(split_large_chunk(rest_part, main_category, description, category_name))
        return result

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
                for cat_chunk in category_chunks[1:]:
                    # The first line up to the first Activity is the category name
                    cat_chunk = cat_chunk.strip()
                    if not cat_chunk:
                        continue
                    # Find the category name (up to first Activity or end)
                    activity_match = re.search(r'Activity:', cat_chunk)
                    if activity_match:
                        category_name = cat_chunk[:activity_match.start()].strip()
                        rest = cat_chunk[activity_match.start():]
                    else:
                        category_name = cat_chunk.strip()
                        rest = ''
                    # Split by Activity:
                    activity_chunks = re.split(r'(Activity:)', rest)
                    # activity_chunks is like ['', 'Activity:', ' ...', 'Activity:', ' ...', ...]
                    # So we process in pairs
                    for i in range(1, len(activity_chunks), 2):
                        activity_header = activity_chunks[i]
                        activity_body = activity_chunks[i+1] if (i+1) < len(activity_chunks) else ''
                        chunk_clean = (activity_header + activity_body).strip().replace('\n', ' ')
                        # Remove 'Note:' followed by 6 empty whitespaces
                        chunk_clean = re.sub(r'Note:\s{6,}', 'Note:', chunk_clean)
                        # Remove all occurrences of 4 consecutive whitespaces
                        chunk_clean = re.sub(r' {4,}', ' ', chunk_clean)
                        chunk_text = f"Main Category: {main_category} Description: {description} Category: {category_name} {chunk_clean}"
                        # If chunk_text exceeds Pinecone limit, split by Work:
                        split_chunks = split_large_chunk(chunk_text, main_category, description, category_name)
                        for sc in split_chunks:
                            chunks.append(sc)
                    # If there was no Activity, still add the category as a chunk
                    if not activity_match:
                        chunk_clean = category_name.replace('\n', ' ')
                        chunk_clean = re.sub(r'Note:\s{6,}', 'Note:', chunk_clean)
                        chunk_clean = re.sub(r' {4,}', ' ', chunk_clean)
                        chunk_text = f"Main Category: {main_category} Description: {description} Category: {chunk_clean}"
                        split_chunks = split_large_chunk(chunk_text, main_category, description, category_name)
                        for sc in split_chunks:
                            chunks.append(sc)
    with open(out_file, "w", encoding="utf-8") as f:
        for chunk in chunks:
            f.write(chunk + "\n")
    print(f"All chunks written to {out_file}")

def embed_and_retrieve(query, all_chunks_file="all_chunks.txt", top_k=3, embeddings_path="chunk_embeddings_piemonte.pt", use_pinecone=True):
    import re
    try:
        from mistral_utils import answer_question
    except ImportError:
        def answer_question(q):
            return q  # fallback: identity

    # Always get candidates, then run accuracy and parsing logic
    if use_pinecone:
        print("[RAG] Using Pinecone for semantic search...")
        retrieve_fn = pinecone_retrieve
    else:
        # Local retrieval logic setup
        with open(all_chunks_file, "r", encoding="utf-8") as f:
            all_chunks = [c.strip() for c in f if c.strip()]
        embedder = get_embedder()
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
        def retrieve_fn(q, top_k=5):
            return hybrid_retrieve(q, all_chunks, chunk_embeddings, embedder, top_k=top_k, alpha=0.1)

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
            print(candidates)
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
    # Only upload to Pinecone if all_chunks.txt exists
    all_chunks_path = "all_chunks.txt"
    if not os.path.exists(all_chunks_path):
        print(f"[Info] {all_chunks_path} not found. Generating it using load_and_chunk_rag_txt()...")
        load_and_chunk_rag_txt(rag_folder="./rag", out_file=all_chunks_path)
    with open(all_chunks_path, "r", encoding="utf-8") as f:
        all_chunks = [c.strip() for c in f if c.strip()]
    # Upload all chunks to Pinecone (batching, with metadata)
    upload_chunks_to_pinecone(all_chunks)
    # Optionally, test retrieval (existing logic remains)
    user_query = input("Enter your query: ")
    results = embed_and_retrieve(user_query, all_chunks_file=all_chunks_path, top_k=1)
    print("\nTop relevant chunks:")
    for i, chunk in enumerate(results, 1):
        print(f"\n--- Chunk {i} ---\n{chunk}")
