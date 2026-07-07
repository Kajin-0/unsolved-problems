#!/usr/bin/env python3
"""Finite automaton checker for periodic digit-restricted 4-AP experiments.

This is an experimental generalization of ordinary Kempner sets.  Instead of
using one digit set D at every base-b position, use periodic digit sets
D_0, ..., D_{m-1}, where the j-th base-b digit is drawn from D_{j mod m}.

A 4-term arithmetic progression x0,x1,x2,x3 satisfies the two second-difference
relations

    x0 - 2*x1 + x2 = 0,
    x1 - 2*x2 + x3 = 0.

Reading base-b digits from least significant to most significant gives a finite
automaton on two carries.  If the automaton can return to carry (0,0) after a
nontrivial digit choice, then a finite 4-AP exists.
"""
from __future__ import annotations

import argparse
from collections import deque
from itertools import product
from typing import Sequence, Tuple


def parse_digit_set(text: str) -> Tuple[int, ...]:
    return tuple(sorted({int(x) for x in text.replace(",", " ").split()}))


def carry_range() -> range:
    # Coefficients in each relation are 1,-2,1; a safe carry range is [-4,4].
    return range(-4, 5)


def has_periodic_4ap(
    b: int,
    digit_sets: Sequence[Sequence[int]],
    witness: bool = False,
):
    """Return whether the periodic digit system contains a nontrivial 4-AP.

    The routine assumes 0 belongs to every digit set so that finite expansions
    may terminate.  It is an exact finite-state check for this digit model.
    """
    Ds = [tuple(sorted(set(D))) for D in digit_sets]
    if any(0 not in D for D in Ds):
        raise ValueError("0 must appear in every periodic digit set")

    m = len(Ds)
    C = list(carry_range())
    transitions = []
    for _, D in enumerate(Ds):
        tr = {(c1, c2): [] for c1 in C for c2 in C}
        for c1 in C:
            for c2 in C:
                for digs in product(D, repeat=4):
                    s1 = digs[0] - 2 * digs[1] + digs[2] + c1
                    s2 = digs[1] - 2 * digs[2] + digs[3] + c2
                    if s1 % b == 0 and s2 % b == 0:
                        n1, n2 = s1 // b, s2 // b
                        if n1 in C and n2 in C:
                            tr[(c1, c2)].append(
                                ((n1, n2), len(set(digs)) > 1, digs)
                            )
        transitions.append(tr)

    start = (0, 0, 0, False)  # position mod m, carry1, carry2, nontrivial?
    q = deque([(start, [])])
    seen = {start}

    while q:
        (r, c1, c2, nontriv), path = q.popleft()
        for (n1, n2), digit_nontriv, digs in transitions[r][(c1, c2)]:
            nontriv2 = nontriv or digit_nontriv
            r2 = (r + 1) % m
            next_state = (r2, n1, n2, nontriv2)
            next_path = path + [(r, digs, (c1, c2), (n1, n2))] if witness else []
            if n1 == 0 and n2 == 0 and nontriv2:
                return (True, next_path) if witness else True
            if next_state not in seen:
                seen.add(next_state)
                q.append((next_state, next_path))

    return (False, None) if witness else False


def local_augmentation_test(b: int, base_digits: Sequence[int]) -> None:
    """Test period-2 one-digit augmentations of a known digit set."""
    D = set(base_digits)
    missing = [x for x in range(b) if x not in D]
    print(f"base b={b}, |D|={len(D)}, missing={missing}")
    ok = []
    for x in missing:
        if not has_periodic_4ap(b, [sorted(D | {x}), sorted(D)]):
            ok.append((0, x))
        if not has_periodic_4ap(b, [sorted(D), sorted(D | {x})]):
            ok.append((1, x))
    print(f"one-digit period-2 augmentations preserving 4-AP-freeness: {ok}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=int, required=True)
    parser.add_argument(
        "--digits",
        action="append",
        required=True,
        help="Digit set for one residue class, e.g. '0,1,2,4,5,7'. Repeat for periodic sets.",
    )
    parser.add_argument("--witness", action="store_true")
    parser.add_argument("--local-augment", action="store_true")
    args = parser.parse_args()

    digit_sets = [parse_digit_set(x) for x in args.digits]
    if args.local_augment:
        if len(digit_sets) != 1:
            raise ValueError("--local-augment expects exactly one --digits set")
        local_augmentation_test(args.base, digit_sets[0])
        return

    result = has_periodic_4ap(args.base, digit_sets, witness=args.witness)
    print(result)


if __name__ == "__main__":
    main()
