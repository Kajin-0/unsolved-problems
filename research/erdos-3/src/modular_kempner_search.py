#!/usr/bin/env python3
"""Search modular 4-AP-free digit sets for Erdős Problem #3 experiments.

This module studies Kempner/digit-restricted sets

    K_b(D) = { n >= 0 : every base-b digit of n lies in D }

via Walker's sufficient certificate: if D is 4-free modulo b, then K_b(D)
is 4-AP-free.  The program is intentionally conservative: every reported
set is certified by a direct cyclic modular progression check.

Run examples:
    python src/modular_kempner_search.py --b-min 5 --b-max 30 --topn 5
    python src/modular_kempner_search.py --verify-known
"""
from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from math import log
from pathlib import Path
from typing import List, Sequence, Set, Tuple


@dataclass(frozen=True)
class Candidate:
    b: int
    digits: Tuple[int, ...]
    nodes: int

    @property
    def size(self) -> int:
        return len(self.digits)

    @property
    def digit_sum(self) -> int:
        return sum(self.digits)

    @property
    def alpha(self) -> float:
        # Logarithmic/fractal density exponent for K_b(D).
        return log(self.size) / log(self.b) if self.b > 1 and self.size > 1 else 0.0

    @property
    def density(self) -> float:
        return self.size / self.b


def forbidden_masks_mod_b(b: int, k: int = 4) -> List[int]:
    """Return bitmasks for k-term cyclic APs in Z/bZ.

    A digit set D is rejected when it contains every residue in one of these
    masks.  This checks all nonzero differences d mod b.  Degenerate masks
    with repeated residues are included only when the distinct-residue mask
    has size >= 2; singleton masks are ignored because singleton constant
    progressions correspond to the trivial common-difference-zero obstruction.
    """
    masks: Set[int] = set()
    for a in range(b):
        for d in range(1, b):
            residues = {(a + i * d) % b for i in range(k)}
            if len(residues) >= 2:
                masks.add(sum(1 << r for r in residues))
    return sorted(masks)


def is_modular_k_free(b: int, digits: Sequence[int], k: int = 4) -> bool:
    mask = sum(1 << d for d in digits)
    return all((mask & f) != f for f in forbidden_masks_mod_b(b, k))


def search_best_digit_sets(
    b: int,
    k: int = 4,
    topn: int = 10,
    require_zero: bool = True,
) -> Tuple[List[Candidate], int]:
    """Branch-and-bound search for large modular k-free digit sets.

    Objective is lexicographic: maximize |D|, then minimize sum(D), then
    minimize max(D).  This is a fast structural search, not a final harmonic
    sum optimizer.  Actual harmonic sums require the Baillie-Schmelzer method
    or a high-precision post-processor.
    """
    forb = forbidden_masks_mod_b(b, k)
    contains: List[List[int]] = [[] for _ in range(b)]
    for f in forb:
        for x in range(b):
            if (f >> x) & 1:
                contains[x].append(f)

    best: List[Tuple[Tuple[int, int, int], int]] = []
    nodes = 0

    def score(mask: int) -> Tuple[int, int, int]:
        digits = [i for i in range(b) if (mask >> i) & 1]
        return (len(digits), -sum(digits), -max(digits) if digits else 0)

    def add(mask: int) -> None:
        if require_zero and not (mask & 1):
            return
        item = (score(mask), mask)
        best.append(item)
        best.sort(reverse=True)
        del best[topn:]

    def dfs(i: int, mask: int) -> None:
        nonlocal nodes
        nodes += 1
        if i == b:
            add(mask)
            return

        current = mask.bit_count()
        remaining = b - i
        min_size = best[-1][0][0] if len(best) >= topn else -1
        if current + remaining < min_size:
            return

        # Include i first.  This biases toward denser, low-digit candidates.
        newmask = mask | (1 << i)
        if not any((newmask & f) == f for f in contains[i]):
            dfs(i + 1, newmask)

        # Exclude i.  If 0 is required, do not explore branches without 0.
        if not (require_zero and i == 0):
            dfs(i + 1, mask)

    dfs(0, 0)
    candidates: List[Candidate] = []
    for _, mask in best:
        digits = tuple(i for i in range(b) if (mask >> i) & 1)
        candidates.append(Candidate(b=b, digits=digits, nodes=nodes))
    return candidates, nodes


def verify_known() -> None:
    known = [
        (11, (0, 1, 2, 4, 5, 7)),
        (22, (0, 1, 2, 4, 5, 7, 8, 9, 14, 17)),
        (55, (0, 1, 2, 4, 5, 9, 10, 11, 14, 16, 17, 18, 21, 24, 30, 37, 39, 41, 42, 45, 47)),
    ]
    for b, D in known:
        ok = is_modular_k_free(b, D, 4)
        print(f"b={b:3d} |D|={len(D):2d} alpha={log(len(D))/log(b):.6f} modular_4_free={ok} D={D}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--b-min", type=int, default=5)
    parser.add_argument("--b-max", type=int, default=30)
    parser.add_argument("--topn", type=int, default=5)
    parser.add_argument("--csv", type=Path, default=None)
    parser.add_argument("--verify-known", action="store_true")
    args = parser.parse_args()

    if args.verify_known:
        verify_known()

    rows = []
    for b in range(args.b_min, args.b_max + 1):
        candidates, nodes = search_best_digit_sets(b, 4, args.topn, True)
        for rank, cand in enumerate(candidates, start=1):
            rows.append({
                "b": cand.b,
                "rank": rank,
                "size": cand.size,
                "density": f"{cand.density:.8f}",
                "alpha": f"{cand.alpha:.8f}",
                "digit_sum": cand.digit_sum,
                "nodes": nodes,
                "digits": " ".join(map(str, cand.digits)),
            })
        best = candidates[0]
        print(
            f"b={b:3d} nodes={nodes:9d} best |D|={best.size:2d} "
            f"alpha={best.alpha:.6f} D={best.digits}"
        )

    if args.csv:
        args.csv.parent.mkdir(parents=True, exist_ok=True)
        with args.csv.open("w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        print(f"wrote {args.csv}")


if __name__ == "__main__":
    main()
