import os
import re
import torch
from sentence_transformers import SentenceTransformer, util
from rank_bm25 import BM25Okapi

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

def load_embeddings(embeddings_path="chunk_embeddings_pat.pt", corpus_path="chunks.txt"):
    global embedder, chunk_embeddings, corpus
    if embedder is None:
        embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    if os.path.exists(embeddings_path):
        chunk_embeddings = torch.load(embeddings_path, map_location='cpu')
    else:
        chunk_embeddings = None
    if os.path.exists(corpus_path):
        with open(corpus_path, "r", encoding="utf-8") as f:
            corpus = [line.strip() for line in f if line.strip()]
        if not corpus:
            raise RuntimeError(f"Corpus file '{corpus_path}' is empty. Please generate or check your chunks.")
    else:
        corpus = None
        raise RuntimeError(f"Corpus file '{corpus_path}' not found. Please generate it before querying.")

# Load embeddings and model at module load (startup)
load_embeddings()

def load_embeddings(embeddings_path="chunk_embeddings_pat.pt", corpus_path="chunks.txt"):
    global embedder, chunk_embeddings, corpus
    if embedder is None:
        embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    if os.path.exists(embeddings_path):
        chunk_embeddings = torch.load(embeddings_path, map_location='cpu')
    else:
        chunk_embeddings = None
    if os.path.exists(corpus_path):
        with open(corpus_path, "r", encoding="utf-8") as f:
            corpus = [line.strip() for line in f if line.strip()]
        if not corpus:
            raise RuntimeError(f"Corpus file '{corpus_path}' is empty. Please generate or check your chunks.")
    else:
        corpus = None
        raise RuntimeError(f"Corpus file '{corpus_path}' not found. Please generate it before querying.")

def bm25_keyword_search(query, chunks, top_k=3):
    # Tokenize chunks and query
    tokenized_chunks = [chunk.lower().split() for chunk in corpus]
    bm25 = BM25Okapi(tokenized_chunks)
    tokenized_query = query.lower().split()
    scores = bm25.get_scores(tokenized_query)
    # Get top_k chunk indices
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [corpus[i] for i in top_indices]

def hybrid_retrieve(query, top_k=1, alpha=0.1):
    # Semantic search
    query_emb = embedder.encode(query, convert_to_tensor=True)
    semantic_hits = util.semantic_search(query_emb, chunk_embeddings, top_k=len(corpus))[0]
    semantic_scores = {hit['corpus_id']: hit['score'] for hit in semantic_hits}

    # BM25 keyword search
    tokenized_chunks = [chunk.lower().split() for chunk in corpus]
    bm25 = BM25Okapi(tokenized_chunks)
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)
    import numpy as np

    # Z-score normalization for BM25
    bm25_mean = np.mean(bm25_scores) if len(bm25_scores) > 0 else 0
    bm25_std = np.std(bm25_scores) if len(bm25_scores) > 0 else 1
    bm25_scores_z = [(score - bm25_mean) / (bm25_std + 1e-8) for score in bm25_scores]

    # Z-score normalization for semantic scores
    sem_scores_list = [semantic_scores.get(idx, 0) for idx in range(len(corpus))]
    sem_mean = np.mean(sem_scores_list) if sem_scores_list else 0
    sem_std = np.std(sem_scores_list) if sem_scores_list else 1
    semantic_scores_z = [(score - sem_mean) / (sem_std + 1e-8) for score in sem_scores_list]

    # Dynamic alpha tuning: if BM25 and semantic scores are both low-variance, favor semantic more
    bm25_var = bm25_std
    sem_var = sem_std
    # If both variances are low, semantic is more reliable
    if bm25_var < 0.1 and sem_var < 0.1:
        dynamic_alpha = 0.2
    elif bm25_var > sem_var:
        dynamic_alpha = 0.7
    else:
        dynamic_alpha = 0.4

    # Combine scores (softmax on z-scores)
    bm25_softmax = list(np.exp(bm25_scores_z) / np.sum(np.exp(bm25_scores_z)))
    sem_softmax = list(np.exp(semantic_scores_z) / np.sum(np.exp(semantic_scores_z)))

    combined_scores = {}
    for idx in range(len(corpus)):
        bm25_score = bm25_softmax[idx]
        sem_score = sem_softmax[idx]
        combined_scores[idx] = dynamic_alpha * bm25_score + (1 - dynamic_alpha) * sem_score

    # Get top_k indices
    top_indices = sorted(combined_scores, key=lambda i: combined_scores[i], reverse=True)[:top_k]
    return [corpus[i] for i in top_indices]

    # Prioritize BM25 results, then add semantic results not already included
    combined = bm25_chunks + [c for c in semantic_chunks if c not in bm25_chunks]
    return combined[:top_k]


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
    query_emb = embedder.encode(query, convert_to_tensor=True)
    hits = util.semantic_search(query_emb, chunk_embeddings, top_k=top_k)[0]
    print(f"[Retrieval] Top {top_k} chunks retrieved.")
    return [corpus[hit['corpus_id']] for hit in hits]

def rag_query(query):
    global embedder, chunk_embeddings, corpus
    if embedder is None or chunk_embeddings is None or corpus is None:
        try:
            load_embeddings()
        except Exception as e:
            return {"error": str(e)}
    if corpus is None:
        return {"error": "Corpus is not loaded. Please check your chunks.txt file."}
    print(f"[RAG] Processing query: {query}")
    from mistral_utils import answer_question
    # Use Mistral to generate a list of strong synonym queries (activity categories) in Italian
    refined_query = answer_question(f"Define the construction activity category in italian that describes it best in Prezziario with one to max 10 words, exclude any other commentary, for: {query}")
    if isinstance(refined_query, dict) and "error" in refined_query:
        return refined_query
    print(f"[RAG] Refined query/categories: {refined_query}")
    # If the model returns a comma- or newline-separated list, split into queries
    if isinstance(refined_query, str):
        queries = [q.strip() for q in re.split(r'[\n,;]+', refined_query) if q.strip()]
    else:
        queries = [str(refined_query)]
    # Retrieve candidates for each synonym/category
    all_candidates = []
    for q in queries:
        print(f"[RAG] Searching with synonym/category: {q}")
        candidates = hybrid_retrieve(q, top_k=5, alpha=0.1)
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
    # If best accuracy < 90, try alternative phrasings
    if best_accuracy < 90:
        print(f"[RAG] Best accuracy only {best_accuracy}, generating alternative phrasings...")
        alt_queries = answer_question(f"Give 5 alternative ways to describe the same construction activity as: {query}, in italian, each as a single line, no commentary.")
        if isinstance(alt_queries, str):
            alt_queries = [q.strip() for q in re.split(r'[\n,;]+', alt_queries) if q.strip()]
        elif not isinstance(alt_queries, list):
            alt_queries = [str(alt_queries)]
        for alt in alt_queries:
            print(f"[RAG] Trying alternative: {alt}")
            candidates = hybrid_retrieve(alt, top_k=3, alpha=0.1)
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
    # Allow dynamic txt_file path for chunking/embedding
    import sys
    if len(sys.argv) > 1:
        txt_file = sys.argv[1]
    else:
        txt_file = "Analisi_2025Pdf_250722_081209-compressed.txt"
    chunks = load_txt_chunks(txt_file)
    corpus = [chunk_to_text(chunk) for chunk in chunks]
    # --- Embedding Retriever ---
    embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    if os.path.exists("chunk_embeddings_pat.pt"):
        print("[Main] Loading chunk embeddings from disk...")
        chunk_embeddings = torch.load("chunk_embeddings_pat.pt", map_location='cpu')
    else:
        print("[Main] Encoding chunks for retrieval...")
        chunk_embeddings = embedder.encode(corpus, convert_to_tensor=True, show_progress_bar=True)
        torch.save(chunk_embeddings, "chunk_embeddings_pat.pt")
        print("[Main] Chunk embeddings saved to disk.")
    print("[Main] Chunk embeddings ready.")

    with open("chunks.txt", "w", encoding="utf-8") as f:
        for chunk in chunks:
            f.write(chunk_to_text(chunk).replace("\n", " ") + "\n")
    print("[Main] Chunks saved to disk.")

    # --- Print ranked chunks for the query ---
    user_query = "prezzo totale DEMOLIZIONE MANTI DI COPERTURA manto in lamiera"
    result = rag_query(user_query)
    print(f"[Main] Final answer: {result}")