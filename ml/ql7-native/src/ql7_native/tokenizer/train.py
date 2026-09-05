from __future__ import annotations

from collections import Counter
import unicodedata

from .codec import QL7Tokenizer


def _text_of(row):
    if isinstance(row, dict):
        return str(row.get("text", ""))
    return str(row)


def _merge_sequence(sequence, pair, merged_id):
    left, right = pair
    out = []
    i = 0
    while i < len(sequence):
        if i + 1 < len(sequence) and sequence[i] == left and sequence[i + 1] == right:
            out.append(merged_id)
            i += 2
        else:
            out.append(sequence[i])
            i += 1
    return tuple(out)


def train(records, vocab_size=81920, min_frequency=2, max_merges=None):
    """Train deterministic byte-level BPE without third-party tokenizer code.

    Duplicate normalized byte sequences are weighted instead of expanded. Pair
    ties are resolved lexicographically, making the artifact reproducible for a
    fixed input multiset. Training stops when no pair reaches ``min_frequency``
    or the requested vocabulary/merge ceiling is reached.
    """
    target = max(QL7Tokenizer.BASE_VOCAB_SIZE, int(vocab_size))
    ceiling = target - QL7Tokenizer.BASE_VOCAB_SIZE
    if max_merges is not None:
        ceiling = min(ceiling, max(0, int(max_merges)))
    min_frequency = max(1, int(min_frequency))

    corpus = Counter()
    normalized_records = 0
    normalized_bytes = 0
    for row in records:
        text = unicodedata.normalize("NFKC", _text_of(row))
        sequence = tuple(text.encode("utf-8"))
        if not sequence:
            continue
        corpus[sequence] += 1
        normalized_records += 1
        normalized_bytes += len(sequence)

    merges = []
    next_id = QL7Tokenizer.BASE_VOCAB_SIZE

    for _ in range(ceiling):
        pair_counts = Counter()
        for sequence, weight in corpus.items():
            if len(sequence) > 1:
                pair_counts.update({pair: count * weight for pair, count in Counter(zip(sequence, sequence[1:])).items()})
        if not pair_counts:
            break
        best_frequency = max(pair_counts.values())
        if best_frequency < min_frequency:
            break
        best_pair = min(pair for pair, frequency in pair_counts.items() if frequency == best_frequency)
        merged_id = next_id
        next_id += 1
        merges.append((best_pair[0], best_pair[1], merged_id))

        updated = Counter()
        for sequence, weight in corpus.items():
            updated[_merge_sequence(sequence, best_pair, merged_id)] += weight
        corpus = updated

    tokenizer = QL7Tokenizer(merges=merges)
    return {
        "schema": "ql7.tokenizer-training-result",
        "schemaVersion": 2,
        "algorithm": "byte_bpe",
        "vocabSize": tokenizer.vocab_size,
        "requestedVocabSize": target,
        "byteFallback": True,
        "mergeCount": len(merges),
        "minFrequency": min_frequency,
        "records": normalized_records,
        "normalizedBytes": normalized_bytes,
        "tokenizer": tokenizer,
    }
