from __future__ import annotations

import json
import unicodedata
from pathlib import Path
from typing import Iterable, Sequence


class QL7Tokenizer:
    """QL7-owned deterministic byte-level BPE tokenizer with lossless UTF-8 fallback.

    Schema v2 stores BPE merge rules as ``[left_id, right_id, merged_id]`` triples.
    Legacy v1 artifacts containing pair-only merges remain readable; merged ids are
    deterministically reconstructed as 256 + merge_rank.
    """

    SCHEMA = "ql7.tokenizer"
    SCHEMA_VERSION = 2
    BASE_VOCAB_SIZE = 256

    def __init__(self, vocab=None, merges=None, token_bytes=None):
        self.merges = self._normalize_merges(merges or [])
        self.token_bytes = self._build_token_bytes(token_bytes)
        self.vocab = self._build_vocab(vocab)
        self.inverse = {v: k for k, v in self.vocab.items()}
        self._merge_rank = {
            (left, right): (rank, merged)
            for rank, (left, right, merged) in enumerate(self.merges)
        }
        self._validate()

    @staticmethod
    def _normalize_text(text: str) -> str:
        return unicodedata.normalize("NFKC", str(text))

    @classmethod
    def _normalize_merges(cls, merges):
        rows = []
        for rank, row in enumerate(merges):
            if not isinstance(row, (list, tuple)) or len(row) not in (2, 3):
                raise ValueError("invalid_bpe_merge")
            left, right = int(row[0]), int(row[1])
            merged = int(row[2]) if len(row) == 3 else cls.BASE_VOCAB_SIZE + rank
            rows.append((left, right, merged))
        return rows

    def _build_token_bytes(self, token_bytes):
        out = {i: bytes([i]) for i in range(self.BASE_VOCAB_SIZE)}
        if token_bytes:
            if isinstance(token_bytes, dict):
                items = token_bytes.items()
            else:
                items = enumerate(token_bytes)
            for key, value in items:
                if value in (None, ""):
                    continue
                idx = int(key)
                if isinstance(value, str):
                    out[idx] = bytes.fromhex(value)
                elif isinstance(value, (bytes, bytearray)):
                    out[idx] = bytes(value)
                else:
                    out[idx] = bytes(int(x) & 0xFF for x in value)
        for left, right, merged in self.merges:
            if left not in out or right not in out:
                raise ValueError("bpe_merge_forward_reference")
            materialized = out[left] + out[right]
            previous = out.get(merged)
            if previous is not None and previous != materialized:
                raise ValueError("bpe_token_bytes_mismatch")
            out[merged] = materialized
        return out

    def _build_vocab(self, vocab):
        out = {}
        if vocab:
            for key, value in vocab.items():
                out[str(key)] = int(value)
        # Canonical byte names are always available.
        for i in range(self.BASE_VOCAB_SIZE):
            out.setdefault(f"<0x{i:02X}>", i)
        # Canonical merged-token names are deterministic and byte-derived.
        for idx, materialized in sorted(self.token_bytes.items()):
            if idx < self.BASE_VOCAB_SIZE:
                continue
            out.setdefault(f"<BPE:{materialized.hex().upper()}>", idx)
        return out

    def _validate(self):
        seen_ids = set(range(self.BASE_VOCAB_SIZE))
        seen_pairs = set()
        for rank, (left, right, merged) in enumerate(self.merges):
            if left not in seen_ids or right not in seen_ids:
                raise ValueError(f"bpe_merge_forward_reference:{rank}")
            if merged in seen_ids:
                raise ValueError(f"bpe_merge_id_reused:{merged}")
            pair = (left, right)
            if pair in seen_pairs:
                raise ValueError(f"bpe_duplicate_pair:{left}:{right}")
            seen_pairs.add(pair)
            seen_ids.add(merged)
        if set(self.token_bytes) != seen_ids:
            # Extra token byte rows would make the merge lineage ambiguous.
            extras = sorted(set(self.token_bytes) - seen_ids)
            if extras:
                raise ValueError(f"bpe_unreachable_token_ids:{extras[:8]}")

    @property
    def vocab_size(self) -> int:
        return max(self.token_bytes.keys(), default=255) + 1

    def encode(self, text) -> list[int]:
        symbols = list(self._normalize_text(text).encode("utf-8"))
        if len(symbols) < 2 or not self._merge_rank:
            return symbols

        # Standard rank-ordered BPE: repeatedly apply the currently lowest-rank
        # adjacent merge and merge all non-overlapping occurrences of that pair.
        while len(symbols) > 1:
            best_pair = None
            best_rank = None
            best_merged = None
            for i in range(len(symbols) - 1):
                row = self._merge_rank.get((symbols[i], symbols[i + 1]))
                if row is None:
                    continue
                rank, merged = row
                if best_rank is None or rank < best_rank:
                    best_pair = (symbols[i], symbols[i + 1])
                    best_rank = rank
                    best_merged = merged
            if best_pair is None:
                break
            left, right = best_pair
            merged_symbols = []
            i = 0
            while i < len(symbols):
                if i + 1 < len(symbols) and symbols[i] == left and symbols[i + 1] == right:
                    merged_symbols.append(best_merged)
                    i += 2
                else:
                    merged_symbols.append(symbols[i])
                    i += 1
            symbols = merged_symbols
        return symbols

    def decode(self, ids: Iterable[int]) -> str:
        chunks = []
        for raw in ids:
            idx = int(raw)
            materialized = self.token_bytes.get(idx)
            if materialized is None:
                # Byte fallback is only valid for canonical byte ids. Unknown
                # promoted ids are a corrupt tokenizer/model contract, not bytes.
                if 0 <= idx < self.BASE_VOCAB_SIZE:
                    materialized = bytes([idx])
                else:
                    raise ValueError(f"unknown_token_id:{idx}")
            chunks.append(materialized)
        return b"".join(chunks).decode("utf-8", "replace")

    @classmethod
    def load(cls, path):
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        if payload.get("schema") not in (None, cls.SCHEMA):
            raise ValueError("tokenizer_schema_mismatch")
        return cls(
            vocab=payload.get("vocab"),
            merges=payload.get("merges"),
            token_bytes=payload.get("tokenBytes"),
        )

    def to_dict(self):
        return {
            "schema": self.SCHEMA,
            "schemaVersion": self.SCHEMA_VERSION,
            "algorithm": "byte_bpe",
            "normalization": "NFKC",
            "byteFallback": True,
            "vocabSize": self.vocab_size,
            "vocab": self.vocab,
            "merges": [list(row) for row in self.merges],
            "tokenBytes": {
                str(idx): materialized.hex()
                for idx, materialized in sorted(self.token_bytes.items())
                if idx >= self.BASE_VOCAB_SIZE
            },
        }

    def save(self, path):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(self.to_dict(), ensure_ascii=False, sort_keys=True, separators=(",", ":")),
            encoding="utf-8",
        )
