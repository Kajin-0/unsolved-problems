# Erdős Problem #3: harmonic AP search

This folder contains a concrete partial-progress attack on Erdős Problem #3:

> If `A ⊆ N` and `∑_{n∈A} 1/n = ∞`, must `A` contain arbitrarily long arithmetic progressions?

The full problem is open.  The working target here is narrower: certified computational
search for large reciprocal-sum, 4-AP-free digit-restricted sets.

## Contents

- `src/modular_kempner_search.py` — branch-and-bound search for modular 4-free digit sets.
- `src/periodic_digit_ap.py` — finite automaton checker for periodic digit-restricted systems.
- `data/small_base_run_2026-07-07.csv` — first reproducible small-base run.
- `docs/research-note.md` — current mathematical target, first observations, and next milestone.

## Reproduce first run

```bash
cd research/erdos-3
python src/modular_kempner_search.py --verify-known --b-min 5 --b-max 34 --topn 1 \
  --csv data/small_base_run.csv
```

## Check Walker's base-11 set

```bash
python src/modular_kempner_search.py --verify-known --b-min 11 --b-max 11 --topn 1
```

## Test period-2 local augmentation of the base-11 set

```bash
python src/periodic_digit_ap.py \
  --base 11 \
  --digits "0,1,2,4,5,7" \
  --local-augment
```

Expected first observation: no one-digit period-2 augmentation of `{0,1,2,4,5,7}` preserves
4-AP-freeness under the automaton certificate.
