
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

def get_pinecone_index(index_name="pat-chunks", dimension=384, metric="cosine", region=None):
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

def upload_chunks_to_pinecone(chunks, chunk_embeddings, batch_size=70, index_name="pat-chunks", namespace="default", start_index=0):
    print(f"[Main] Preparing to upload PAT chunks to Pinecone from chunk_{start_index} to chunk_{start_index + len(chunks) - 1}...")
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
    print("[Main] PAT embeddings uploaded to Pinecone.")


def pinecone_retrieve(query, top_k=5, index_name="pat-chunks", namespace="default"):
    embedder = get_embedder()
    query_emb = embedder.encode(query, convert_to_numpy=True).tolist()
    index = get_pinecone_index(index_name=index_name)
    result = index.query(vector=query_emb, top_k=top_k, include_metadata=True, namespace=namespace)
    hits = result.get('matches', [])
    return [hit['metadata'].get('chunk', hit['id']) for hit in hits]

def hybrid_retrieve(query, top_k=3, alpha=0.7):
    global embedder, chunk_embeddings, corpus
    if embedder is None or chunk_embeddings is None or corpus is None:
        load_embeddings.use_pinecone = False
        load_embeddings()
        load_embeddings.use_pinecone = True
    # Semantic search
    query_emb = embedder.encode(query, convert_to_tensor=True)
    semantic_hits = util.semantic_search(query_emb, chunk_embeddings, top_k=len(corpus))[0]
    semantic_scores = {hit['corpus_id']: hit['score'] for hit in semantic_hits}
    # BM25 keyword search
    tokenized_chunks = [chunk.lower().split() for chunk in corpus]
    bm25 = BM25Okapi(tokenized_chunks)
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)
    bm25_min, bm25_max = min(bm25_scores), max(bm25_scores)
    bm25_scores_norm = [(s - bm25_min) / (bm25_max - bm25_min + 1e-8) for s in bm25_scores]
    sem_scores_list = [semantic_scores.get(idx, 0) for idx in range(len(corpus))]
    sem_min, sem_max = min(sem_scores_list), max(sem_scores_list)
    semantic_scores_norm = [(s - sem_min) / (sem_max - sem_min + 1e-8) for s in sem_scores_list]
    import numpy as np
    bm25_softmax = list(np.exp(bm25_scores_norm) / np.sum(np.exp(bm25_scores_norm)))
    sem_softmax = list(np.exp(semantic_scores_norm) / np.sum(np.exp(semantic_scores_norm)))
    combined_scores = {i: alpha * bm25_softmax[i] + (1 - alpha) * sem_softmax[i] for i in range(len(corpus))}
    top_indices = sorted(combined_scores, key=lambda i: combined_scores[i], reverse=True)[:top_k]
    return [corpus[i] for i in top_indices]

def is_footer(line):
    footers = [
        'Dipartimento Infrastrutture',
        'Agenzia Provinciale per le Opere Pubbliche (A.P.O.P.)',
        'Agenzia Provinciale per le Opere Pubbliche',
        'Provincia Autonoma di Trento',
        'Elenco Prezzi Provinciale 2025',
        'O P E R E    I N    A N A L I S I',
        'U.M. Quantità Prezzo unitario Importo',
        'Provviste necessarie alla formazione dell\'analisi'
    ]
    if re.match(r'^\d+/\d+$', line):
        return True
    for f in footers:
        if f in line:
            return True
    return False

# --- Embedding and Corpus Loader ---


# Global variables for model and data
embedder = None
chunk_embeddings = None
corpus = None

def get_embedder():
    global embedder
    if embedder is None:
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    return embedder

def load_embeddings(embeddings_path="chunk_embeddings_pat.pt", corpus_path="chunks.txt"):
    global embedder, chunk_embeddings, corpus
    if embedder is None:
        embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    if os.path.exists(corpus_path):
        with open(corpus_path, "r", encoding="utf-8") as f:
            corpus = [line.strip() for line in f if line.strip()]
        if not corpus:
            raise RuntimeError(f"Corpus file '{corpus_path}' is empty. Please generate or check your chunks.")
    else:
        corpus = None
        raise RuntimeError(f"Corpus file '{corpus_path}' not found. Please generate it before querying.")
    # Only load/generate .pt file if not using Pinecone (handled in hybrid_retrieve)
    if not getattr(load_embeddings, 'use_pinecone', True):
        if os.path.exists(embeddings_path):
            chunk_embeddings = torch.load(embeddings_path, map_location='cpu')
            if len(chunk_embeddings) != len(corpus):
                chunk_embeddings = embedder.encode(corpus, convert_to_tensor=True, show_progress_bar=True)
                torch.save(chunk_embeddings, embeddings_path)
        else:
            chunk_embeddings = embedder.encode(corpus, convert_to_tensor=True, show_progress_bar=True)
            torch.save(chunk_embeddings, embeddings_path)
    else:
        chunk_embeddings = None


def bm25_keyword_search(query, chunks, top_k=3):
    # Tokenize chunks and query
    tokenized_chunks = [chunk.lower().split() for chunk in corpus]
    bm25 = BM25Okapi(tokenized_chunks)
    tokenized_query = query.lower().split()
    scores = bm25.get_scores(tokenized_query)
    # Get top_k chunk indices
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [corpus[i] for i in top_indices]

def clean_number(num_str):
    # Remove all dots except the last one (decimal separator)
    num_str = num_str.strip()
    if not num_str:
        return None
    # Remove thousands separators
    if num_str.count('.') > 1:
        parts = num_str.split('.')
        num_str = ''.join(parts[:-1]) + '.' + parts[-1]
    num_str = num_str.replace(',', '.')
    try:
        return float(num_str)
    except Exception:
        return None

def load_txt_chunks(txt_path):
    print("[Main] Loading TXT document...")
    with open(txt_path, "r", encoding="utf-8") as f:
        txt_text = f.read()
    # Remove page breaks and irrelevant headers
    txt_text = re.sub(
        r'Elenco Prezzi Provinciale 2025\s*Provincia Autonoma di Trento.*?Provviste necessarie alla formazione dell\'analisi\.',
        '',
        txt_text,
        flags=re.DOTALL
    )
    main_chunks = re.split(r'(?=B\.\d{2}\.\d{2}\.\d{4}\.\d{3})', txt_text)
    structured_chunks = []
    for chunk in main_chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        # Split chunk into lines and clean footers/page numbers
        lines = [l.strip() for l in chunk.splitlines() if l.strip()]
        cleaned_lines = [l for l in lines if not is_footer(l)]
        # Find main activity code/title index
        main_idx = -1
        for idx, l in enumerate(cleaned_lines):
            if re.match(r'^B\.\d{2}\.\d{2}\.\d{4}\.\d{3}', l):
                main_idx = idx
                break
        if main_idx == -1:
            continue
        main_code = ''
        main_desc = ''
        unit = None
        quantity = None
        main_line = cleaned_lines[main_idx]
        main_line_match = re.match(r'^(B\.\d{2}\.\d{2}\.\d{4}\.\d{3})\s+(.+)$', main_line)
        if main_line_match:
            main_code = main_line_match.group(1)
            main_desc = main_line_match.group(2).strip()
        main_desc_match = re.match(r'(.+?)\s+([a-zA-Z²³]+)\s+([\d\.,]+)$', main_desc)
        if main_desc_match:
            main_desc = main_desc_match.group(1).strip()
            unit = main_desc_match.group(2)
            quantity = clean_number(main_desc_match.group(3))
        if unit is None or quantity is None:
            main_table_match = re.search(r'U\.M\.\s*Quantità.*?\n([a-zA-Z]+)\s+([\d\.,]+)', chunk)
            if main_table_match:
                unit = main_table_match.group(1)
                quantity = clean_number(main_table_match.group(2))
        desc_lines = []
        for l in cleaned_lines[main_idx+1:]:
            if re.match(r'^[A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3}', l):
                break
            desc_lines.append(l)
        desc_lines = [l for l in desc_lines if not is_footer(l)]
        if desc_lines:
            main_desc = main_desc + ' ' + ' '.join(desc_lines)
        main_desc = main_desc.strip()
        # Extract code, description, unit, quantity from main_line
        main_code = ''
        main_desc = ''
        unit = None
        quantity = None
        # Pattern: code, description, [unit] [quantity] at end
        main_line_match = re.match(r'^(B\.\d{2}\.\d{2}\.\d{4}\.\d{3})\s+(.+)$', main_line)
        if main_line_match:
            main_code = main_line_match.group(1)
            main_desc = main_line_match.group(2).strip()
        # Collect all lines after main_line up to first sub-item
        desc_lines = []
        for l in cleaned_lines[main_idx+1:]:
            if re.match(r'^[A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3}', l):
                break
            desc_lines.append(l)
        desc_lines = [l for l in desc_lines if not is_footer(l)]
        # Build main block text for robust unit/quantity extraction
        main_block_text = main_desc + ' ' + ' '.join(desc_lines)
        main_block_text = main_block_text.strip()
        # Try to find unit and quantity anywhere in the block (including 'cad.' and common units)
        unit_qty_match = re.search(r'\b([a-zA-Z²³\.]+)\s+([\d\.,]+)\b', main_block_text)
        if unit_qty_match:
            unit = unit_qty_match.group(1)
            quantity = clean_number(unit_qty_match.group(2))
        else:
            # Fallback to table extraction
            main_table_match = re.search(r'U\.M\.\s*Quantità.*?\n([a-zA-Z²³\.]+)\s+([\d\.,]+)', chunk)
            if main_table_match:
                unit = main_table_match.group(1)
                quantity = clean_number(main_table_match.group(2))
        main_desc = main_block_text

        # Sub-items: find all lines starting with sub-item code, collect block until next code or end
        sub_items = []
        subitem_idxs = [i for i, l in enumerate(cleaned_lines) if re.match(r'^[A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3}', l)]
        for idx, start in enumerate(subitem_idxs):
            end = subitem_idxs[idx+1] if idx+1 < len(subitem_idxs) else len(cleaned_lines)
            block = cleaned_lines[start:end]
            if not block:
                continue
            sub_code_match = re.match(r'^([A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3})\s*(.*)', block[0])
            if not sub_code_match:
                continue
            sub_code = sub_code_match.group(1)
            desc_lines = [sub_code_match.group(2)] + block[1:]
            desc_lines = [line for line in desc_lines if not is_footer(line)]
            # Remove summary/total lines from desc_lines (stop at first summary/total line)
            summary_patterns = [
                re.compile(r'^Summary:'),
                re.compile(r'^Importo totale dell[’\']analisi', re.IGNORECASE),
                re.compile(r'^Prezzo di applicazione', re.IGNORECASE),
                re.compile(r'^Riepilogo per categoria', re.IGNORECASE)
            ]
            filtered_desc_lines = []
            for l in desc_lines:
                if any(p.match(l) for p in summary_patterns):
                    break
                filtered_desc_lines.append(l)
            desc_lines = filtered_desc_lines
            # Try to extract unit/quantity from first line if present
            sub_desc = ''
            sub_unit = None
            sub_qty = None
            sub_unit_price = None
            sub_total = None
            formula = ''
            numbers = []
            # Look for inline unit/quantity at end of first line
            if desc_lines:
                first_line = desc_lines[0]
                m = re.match(r'(.+?)(?:\s+([a-zA-Z²³]+)\s+([\d\.,]+))?$', first_line)
                if m:
                    sub_desc = m.group(1).strip()
                    if m.group(2) and m.group(3):
                        sub_unit = m.group(2)
                        sub_qty = clean_number(m.group(3))
                else:
                    sub_desc = first_line.strip()
            # Parse rest of lines for formula, price, total, etc.
            desc = []
            for l in desc_lines[1:]:
                if 'Formula quantità:' in l:
                    formula_line = l.replace('Formula quantità:', '').strip()
                    parts = formula_line.split()
                    if len(parts) >= 5:
                        formula = parts[0]
                        sub_unit = parts[1]
                        sub_qty = clean_number(parts[2])
                        sub_unit_price = clean_number(parts[3])
                        sub_total = clean_number(parts[4])
                    elif len(parts) >= 4:
                        formula = parts[0]
                        sub_unit = parts[1]
                        sub_qty = clean_number(parts[2])
                        sub_unit_price = clean_number(parts[3])
                    elif len(parts) >= 3:
                        formula = parts[0]
                        sub_unit = parts[1]
                        sub_qty = clean_number(parts[2])
                    else:
                        formula = formula_line
                else:
                    desc.append(l)
            if desc:
                sub_desc = sub_desc + ' ' + ' '.join(desc)
            if not sub_unit:
                unit_match = re.search(r'\b(h|t|kg|m|m2|m3|l|pz)\b', sub_desc + ' ' + formula)
                if unit_match:
                    sub_unit = unit_match.group(1)
            sub_items.append({
                "code": sub_code,
                "description": sub_desc.strip(),
                "formula": formula,
                "unit": sub_unit,
                "quantity": sub_qty,
                "unit_price": sub_unit_price,
                "total": sub_total
            })

        structured_chunks.append({
            "main_code": main_code,
            "main_description": main_desc,
            "unit": unit,
            "quantity": quantity,
            "sub_items": sub_items
        })
    print(f"[Main] Document chunked into {len(structured_chunks)} structured activity chunks.")
    return structured_chunks

def retrieve(query, top_k=1):
    print("[Retrieval] Encoding query and searching for relevant chunks...")
    embedder_local = get_embedder()
    query_emb = embedder_local.encode(query, convert_to_tensor=True)
    hits = util.semantic_search(query_emb, chunk_embeddings, top_k=top_k)[0]
    print(f"[Retrieval] Top {top_k} chunks retrieved.")
    return [corpus[hit['corpus_id']] for hit in hits]


def rag_query(query, use_pinecone=True):
    print(f"[RAG] Processing query: {query}")
    from mistral_utils import answer_question
    # Use Mistral to generate a list of strong synonym queries (activity categories) in Italian
    refined_query = answer_question(f"Define the construction activity category in italian that describes it best in Prezziario with one to max 10 words, exclude any other commentary, for: {query}")
    if isinstance(refined_query, dict) and "error" in refined_query:
        return refined_query
    print(f"[RAG] Refined query/categories: {refined_query}")
    if isinstance(refined_query, str):
        queries = [q.strip() for q in re.split(r'[\n,;]+', refined_query) if q.strip()]
    else:
        queries = [str(refined_query)]
    all_candidates = []
    for q in queries:
        print(f"[RAG] Searching with synonym/category: {q}")
        if use_pinecone:
            candidates = pinecone_retrieve(q, top_k=5)
        else:
            candidates = hybrid_retrieve(q, top_k=5, alpha=0.1)
        all_candidates.extend(candidates)
    all_candidates = list(dict.fromkeys(all_candidates))
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
    if best_accuracy < 85:
        print(f"[RAG] Best accuracy only {best_accuracy}, generating alternative phrasings...")
        alt_queries = answer_question(f"Give 5 alternative ways to describe the same construction activity as: {query}, in italian, each as a single line, no commentary.")
        if isinstance(alt_queries, str):
            alt_queries = [q.strip() for q in re.split(r'[\n,;]+', alt_queries) if q.strip()]
        elif not isinstance(alt_queries, list):
            alt_queries = [str(alt_queries)]
        for alt in alt_queries:
            print(f"[RAG] Trying alternative: {alt}")
            if use_pinecone:
                candidates = pinecone_retrieve(alt, top_k=3)
            else:
                candidates = hybrid_retrieve(alt, top_k=3, alpha=0.1)
            print(candidates)
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
    print(f"[RAG] Best accuracy: {best_accuracy} (chunk {best_idx+1})")
    print("[RAG] Pipeline complete.")
    if best_chunk:
        return [best_chunk]
    else:
        return all_candidates[:3]



# --- Flatten structured chunks for embedding ---
def chunk_to_text(chunk):
    lines = []
    lines.append(f"{chunk.get('main_code', '')} {chunk.get('main_description', '')}")
    lines.append(f"Unit: {chunk.get('unit', '')}, Quantity: {chunk.get('quantity', '')}")
    for sub in chunk.get('sub_items', []):
        lines.append(
            f"{sub.get('code', '')} {sub.get('description', '')} | Formula: {sub.get('formula', '')} | UM: {sub.get('unit', '')} | Qty: {sub.get('quantity', '')} | Price: {sub.get('unit_price', '')} | Total: {sub.get('total', '')}"
        )
    return '\n'.join(lines)

if __name__ == "__main__":
    # Use pre-chunked file for upload, not re-chunking from raw source
    import numpy as np
    corpus_path = "chunks.txt"
    if not os.path.exists(corpus_path):
        raise RuntimeError(f"Corpus file '{corpus_path}' not found. Please generate it before uploading.")
    with open(corpus_path, "r", encoding="utf-8") as f:
        all_chunks = [line.strip() for line in f if line.strip()]
    # Upload all chunks in chunks.txt
    corpus = all_chunks
    # --- Check for oversized chunks and skip them ---
    # Pinecone metadata size limit is 40kB (40960 bytes)
    max_metadata_bytes = 40960
    filtered_corpus = []
    filtered_indices = []
    import json
    for idx, chunk in enumerate(corpus):
        meta = {"chunk": chunk}
        meta_bytes = len(json.dumps(meta, ensure_ascii=False).encode("utf-8"))
        if meta_bytes > max_metadata_bytes:
            print(f"[Warning] Skipping chunk at index {idx} (ID chunk_{idx}) due to metadata size {meta_bytes} bytes > 40kB limit.")
            continue
        filtered_corpus.append(chunk)
        filtered_indices.append(idx)
    if not filtered_corpus:
        raise RuntimeError("No valid chunks to upload after filtering oversized chunks.")
    # --- Embedding Retriever ---
    embedder_local = get_embedder()
    print("[Main] Encoding chunks for retrieval...")
    chunk_embeddings = embedder_local.encode(filtered_corpus, convert_to_numpy=True, show_progress_bar=True)
    # --- Upload all valid chunks to Pinecone ---
    upload_chunks_to_pinecone(filtered_corpus, chunk_embeddings, batch_size=70, index_name="pat-chunks", namespace="default", start_index=0)
    # --- Print ranked chunks for the query (optional, can be commented out) ---
    # To use local retrieval, set use_pinecone=False
    # user_query = "prezzo totale DEMOLIZIONE MANTI DI COPERTURA manto in lamiera"
    # result = rag_query(user_query, use_pinecone=False)
    # print(f"[Main] Final answer: {result}")