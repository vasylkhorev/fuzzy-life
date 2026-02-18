"""
1D Cellular Automaton Rule Explorer — NumPy Accelerated Edition
Uses NumPy vectorized operations + multiprocessing for maximum speed.
"""
import numpy as np
import random
import argparse
import json
import time
import sys
from multiprocessing import Pool, cpu_count

GRID_SIZE = 200
MAX_GENERATIONS = 200
TRIALS_PER_RULE = 50


def parse_rules(s):
    if not s:
        return []
    ranges = []
    for part in s.split(','):
        part = part.strip()
        if '-' in part:
            pieces = part.split('-')
            if len(pieces) == 2:
                try:
                    ranges.append((float(pieces[0]), float(pieces[1])))
                except ValueError:
                    pass
        else:
            try:
                v = float(part)
                ranges.append((v, v))
            except ValueError:
                pass
    return ranges


def build_rule_lookup(ranges, max_neighbors):
    """Pre-compute a boolean lookup table for rule checking."""
    lookup = np.zeros(max_neighbors + 1, dtype=np.bool_)
    for rmin, rmax in ranges:
        lo = max(0, int(rmin))
        hi = min(max_neighbors, int(rmax))
        for v in range(lo, hi + 1):
            lookup[v] = True
    return lookup


def get_trimmed(row):
    """Get trimmed string and offset of first 1."""
    nonzero = np.nonzero(row)[0]
    if len(nonzero) == 0:
        return '', 0
    first = nonzero[0]
    last = nonzero[-1]
    return row[first:last + 1].tobytes(), int(first)


def run_trial_numpy(initial, birth_lookup, survival_lookup, ns):
    """Run one trial using NumPy vectorized neighbor counting."""
    grid = np.zeros(GRID_SIZE, dtype=np.int8)
    start = (GRID_SIZE - len(initial)) // 2
    grid[start:start + len(initial)] = initial

    history = {}

    for gen in range(MAX_GENERATIONS):
        s, offset = get_trimmed(grid)
        if not s:
            break

        if s in history:
            prev_gen, prev_offset = history[s]
            period = gen - prev_gen
            shift = offset - prev_offset
            ptype = 'glider' if shift != 0 else 'oscillator'
            return ptype, period, shift

        history[s] = (gen, offset)

        # Vectorized neighbor counting using np.roll
        neighbors = np.zeros(GRID_SIZE, dtype=np.int32)
        for i in range(-ns, ns + 1):
            if i == 0:
                continue
            neighbors += np.roll(grid, -i).astype(np.int32)

        # Zero out edges that wrapped around
        for i in range(ns):
            neighbors[i] = 0
            neighbors[GRID_SIZE - 1 - i] = 0
        # Recount edges properly
        for col in range(ns):
            s_val = 0
            for i in range(-ns, ns + 1):
                if i == 0:
                    continue
                nc = col + i
                if 0 <= nc < GRID_SIZE:
                    s_val += grid[nc]
            neighbors[col] = s_val
        for col in range(GRID_SIZE - ns, GRID_SIZE):
            s_val = 0
            for i in range(-ns, ns + 1):
                if i == 0:
                    continue
                nc = col + i
                if 0 <= nc < GRID_SIZE:
                    s_val += grid[nc]
            neighbors[col] = s_val

        # Apply rules using lookup tables
        alive = grid >= 1
        dead = ~alive
        born = dead & birth_lookup[neighbors]
        survives = alive & survival_lookup[neighbors]
        grid = (born | survives).astype(np.int8)

    return None


def gen_random_rule(total_count):
    parts = []
    if random.random() > 0.3:
        for i in range(total_count + 1):
            if random.random() > 0.7:
                parts.append(str(i))
    else:
        num_intervals = 2 if random.random() > 0.8 else 1
        for _ in range(num_intervals):
            a = random.randint(0, total_count)
            b = random.randint(0, total_count)
            mn, mx = min(a, b), max(a, b)
            mx = max(mn + 1, mx)
            if mn == mx:
                parts.append(str(mn))
            else:
                parts.append(f'{mn}-{mx}')
    if not parts:
        return str(random.randint(1, total_count))
    return ','.join(parts)


def gen_brute_force_rule(index, total_possible):
    birth_bits = index % (1 << total_possible)
    survival_bits = index // (1 << total_possible)
    def bits_to_str(bits):
        active = [str(i) for i in range(total_possible) if (bits >> i) & 1]
        return ','.join(active)
    return bits_to_str(birth_bits), bits_to_str(survival_bits)


def evaluate_rule(task):
    """Worker function — runs in separate process."""
    idx, birth_str, survival_str, ns, width = task
    max_neighbors = ns * 2

    birth_ranges = parse_rules(birth_str)
    survival_ranges = parse_rules(survival_str)
    birth_lookup = build_rule_lookup(birth_ranges, max_neighbors)
    survival_lookup = build_rule_lookup(survival_ranges, max_neighbors)

    found = 0
    gliders = 0
    seen = set()

    for _ in range(TRIALS_PER_RULE):
        initial = np.array([1 if random.random() > 0.5 else 0 for _ in range(width)], dtype=np.int8)
        if not np.any(initial):
            continue
        result = run_trial_numpy(initial, birth_lookup, survival_lookup, ns)
        if result:
            ptype, period, shift = result
            sig = f'{ptype}-{period}-{shift}'
            if sig not in seen:
                seen.add(sig)
                found += 1
                if ptype == 'glider':
                    gliders += 1

    unique = len(seen)
    score = found * 2 + gliders * 15 + unique * 5
    return idx, birth_str, survival_str, score, found, gliders


# ANSI colors
G = '\033[90m'; W = '\033[97m'; GR = '\033[92m'; Y = '\033[93m'
M = '\033[95m'; C = '\033[96m'; B = '\033[1m'; R = '\033[0m'; D = '\033[2m'


def score_color(s):
    if s == 0: return G
    if s < 20: return W
    if s < 50: return C
    if s < 100: return GR
    if s < 200: return Y
    return M + B


def main():
    parser = argparse.ArgumentParser(description='Fast 1D Rule Explorer (NumPy)')
    parser.add_argument('-s', '--strategy', default='random', choices=['random', 'brute-force'])
    parser.add_argument('-c', '--count', type=int, default=0, help='Rules to explore (0=all for brute-force)')
    parser.add_argument('-w', '--width', type=int, default=6)
    parser.add_argument('-n', '--neighborhood', type=int, default=2)
    parser.add_argument('-t', '--top', type=int, default=30)
    parser.add_argument('-j', '--jobs', type=int, default=0, help='Workers (0=auto)')
    parser.add_argument('-f', '--format', default='text', choices=['text', 'json'])
    args = parser.parse_args()

    ns = args.neighborhood
    total_count = ns * 2
    total_possible = ns * 2 + 1
    num_workers = args.jobs if args.jobs > 0 else cpu_count()

    if args.strategy == 'brute-force':
        max_rules = 1 << (2 * total_possible)
        if args.count > 0:
            max_rules = min(args.count, max_rules)
    else:
        max_rules = args.count if args.count > 0 else 10000

    print(f'{C}╔══════════════════════════════════════════════════╗{R}')
    print(f'{C}║     {B}1D Rule Explorer (NumPy Accelerated){R}{C}       ║{R}')
    print(f'{C}╠══════════════════════════════════════════════════╣{R}')
    print(f'{C}║{R}  Strategy:      {W}{args.strategy:>32}{R} {C}║{R}')
    print(f'{C}║{R}  Rules to try:  {W}{max_rules:>32}{R} {C}║{R}')
    print(f'{C}║{R}  Width:         {W}{args.width:>32}{R} {C}║{R}')
    print(f'{C}║{R}  Neighborhood:  {W}{ns:>32}{R} {C}║{R}')
    print(f'{C}║{R}  Workers:       {W}{num_workers:>32}{R} {C}║{R}')
    print(f'{C}╚══════════════════════════════════════════════════╝{R}')
    print()

    # Build task list
    tasks = []
    for i in range(max_rules):
        if args.strategy == 'brute-force':
            b, sv = gen_brute_force_rule(i, total_possible)
        else:
            b = gen_random_rule(total_count)
            sv = gen_random_rule(total_count)
        tasks.append((i, b, sv, ns, args.width))

    start_time = time.time()
    top_rules = []
    best_score = 0
    done = 0
    hits = 0

    with Pool(num_workers) as pool:
        for idx, birth, surv, score, found, gliders in pool.imap_unordered(evaluate_rule, tasks, chunksize=64):
            done += 1
            elapsed = time.time() - start_time
            rate = done / elapsed if elapsed > 0 else 0

            if score > 0:
                hits += 1
                is_best = score > best_score
                if is_best:
                    best_score = score

                clr = score_color(score)
                star = f'{Y}{B}★{R}' if is_best else f'{D}·{R}'
                print(
                    f'  {D}{done:>6}/{max_rules}{R}  {star}  '
                    f'{clr}score={score:<4}{R}  '
                    f'gliders={M}{gliders}{R}  found={GR}{found}{R}  '
                    f'B={C}{birth:<15}{R}  S={C}{surv:<15}{R}  '
                    f'{D}({rate:.0f}/s){R}'
                )

                top_rules.append({
                    'birthRules': birth,
                    'survivalRules': surv,
                    'score': score,
                    'stats': {'found': found, 'gliders': gliders}
                })
                top_rules.sort(key=lambda x: -x['score'])
                top_rules = top_rules[:args.top]

            elif done % 500 == 0:
                print(f'  {D}{done:>6}/{max_rules}  ·  searching... ({rate:.0f}/s)  hits: {hits}{R}')

    elapsed = time.time() - start_time
    print()
    print(f'  {GR}✅ Done in {elapsed:.2f}s ({max_rules / elapsed:.0f} rules/sec) — {hits} interesting rules found{R}')
    print()

    if args.format == 'json':
        print(json.dumps(top_rules, indent=2))
    else:
        print(f'{B}  Top {len(top_rules)} Rules:{R}')
        print(f'  {C}┌─────┬───────┬─────────┬───────┬─────────────────────┬─────────────────────┐{R}')
        print(f'  {C}│{R} {B}{"#":<3}{R} {C}│{R} {B}{"Score":<5}{R} {C}│{R} {B}{"Glider":<7}{R} {C}│{R} {B}{"Found":<5}{R} {C}│{R} {B}{"Birth":<19}{R} {C}│{R} {B}{"Survival":<19}{R} {C}│{R}')
        print(f'  {C}├─────┼───────┼─────────┼───────┼─────────────────────┼─────────────────────┤{R}')
        for i, r in enumerate(top_rules):
            b = r['birthRules'][:19]
            s = r['survivalRules'][:19]
            clr = score_color(r['score'])
            print(f'  {C}│{R} {clr}{i+1:<3}{R} {C}│{R} {clr}{r["score"]:<5}{R} {C}│{R} {M}{r["stats"]["gliders"]:<7}{R} {C}│{R} {GR}{r["stats"]["found"]:<5}{R} {C}│{R} {W}{b:<19}{R} {C}│{R} {W}{s:<19}{R} {C}│{R}')
        print(f'  {C}└─────┴───────┴─────────┴───────┴─────────────────────┴─────────────────────┘{R}')


if __name__ == '__main__':
    main()
