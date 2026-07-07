# Erdős Problem #3: computational partial-progress note

## Problem

Erdős Problem #3 asks whether every set `A ⊆ N` with divergent reciprocal sum

```math
\sum_{n\in A} \frac{1}{n}=\infty
```

must contain arithmetic progressions of arbitrarily large finite length.

The full problem remains open. A sufficient finite-density route would be a bound

```math
r_k(N) \ll_k \frac{N}{(\log N)(\log\log N)^2},
```

where `r_k(N)` is the largest size of a subset of `{1,...,N}` with no nontrivial
`k`-term AP.

## Computational target

The realistic partial target here is not the full conjecture.  The current target is:

1. Reproduce Walker's digit-restricted/Kempner certificates for 4-AP-free sets.
2. Search nearby and generalized digit systems for new lower-bound candidates for `M_4`.
3. Certify candidates by an exact modular or finite-automaton check before estimating harmonic sums.

For a digit set `D ⊂ {0,...,b-1}`, define

```math
K_b(D)=\{n\ge 0:\text{ every base-}b\text{ digit of }n\text{ lies in }D\}.
```

Walker proves that if `D` is 4-free modulo `b`, then `K_b(D)` is 4-AP-free.  This repo's
first search uses exactly that certificate.

## First run: small-base modular search

The file `data/small_base_run_2026-07-07.csv` records a branch-and-bound run for bases
`5 ≤ b ≤ 34`, optimizing first for `|D|`, then for low digit sum.  The run reproduces
known structurally important cases:

- `b=11`, `D={0,1,2,4,5,7}`, with `alpha=log(6)/log(11)=0.74722174`.
- `b=22`, `D={0,1,2,4,5,7,8,9,14,17}`, with `alpha=log(10)/log(22)=0.74491962`.

This confirms the modular checker is aligned with Walker's 4-free table.

## New experimental direction: periodic digit systems

A modest extension is to replace one digit set by periodic digit sets

```math
D_0,D_1,\dots,D_{m-1},
```

where the digit in position `j` must lie in `D_{j mod m}`.

A 4-term AP `x_0,x_1,x_2,x_3` satisfies the two second-difference equations

```math
x_0-2x_1+x_2=0,
\qquad
x_1-2x_2+x_3=0.
```

Reading these equations digit-by-digit in base `b` gives a finite automaton over two
carry variables.  The script `src/periodic_digit_ap.py` implements this check.

One immediate negative result from the first local test:

> The Walker base-11 digit set `{0,1,2,4,5,7}` is locally maximal against all one-digit
> period-2 augmentations.  Adding any missing digit to either residue class introduces
> a 4-term AP under the automaton certificate.

This is not a theorem about all possible period-2 systems, but it is useful evidence:
the base-11 record-adjacent set is not easily improved by alternating one augmented digit
layer with the original layer.

## Next milestone

A serious computational milestone is to find a certified periodic digit system with
larger density exponent than Walker's base-55 example:

```math
\alpha = \frac{1}{m\log b}\sum_{j=0}^{m-1}\log |D_j| > \frac{\log 21}{\log 55}\approx 0.75974.
```

Such a system would not automatically beat Walker's harmonic sum `4.43975`, but it would
be a plausible candidate for full Baillie-Schmelzer harmonic post-processing.
