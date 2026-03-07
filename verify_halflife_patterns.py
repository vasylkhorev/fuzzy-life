import os
import sys
import json
import subprocess
import math
import re

def parse_rle_to_dict(rle_str):
    lines = rle_str.strip().split('\n')
    body = ""
    for line in lines:
        if line.startswith('#'): continue
        if '=' in line: continue
        body += line.strip()
    
    body = body.replace('!', '')
    rows = body.split('$')
    
    grid = {}
    for r, row_str in enumerate(rows):
        c = 0
        count = ""
        for char in row_str:
            if char.isdigit():
                count += char
            else:
                num = int(count) if count else 1
                if char == 'A':
                    for i in range(num): grid[(r, c + i)] = 1
                elif char == 'B':
                    for i in range(num): grid[(r, c + i)] = 2
                c += num
                count = ""
    return grid

def parse_rule_string(rule_str):
    match = re.match(r'b([^_]+)_s(.*)', rule_str)
    if not match: return set(), set()
    b_str, s_str = match.groups()
    
    def parse_part(part_str):
        rules = set()
        parts = part_str.replace(',', ' ').split()
        for p in parts:
            if '-' in p:
                min_s, max_s = p.split('-')
                val = float(min_s)
                max_f = float(max_s)
                while val <= max_f + 1e-9:
                    rules.add(round(val * 2))
                    val += 0.5
            else:
                rules.add(round(float(p) * 2))
        return rules
    return parse_part(b_str), parse_part(s_str)

def step_dict(grid_dict, B, S):
    candidates = set()
    for (r, c) in grid_dict:
        candidates.add((r, c))
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                candidates.add((r+dr, c+dc))
                
    new_grid = {}
    for r, c in candidates:
        state = grid_dict.get((r, c), 0)
        n_sum = 0
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0: continue
                n_sum += grid_dict.get((r+dr, c+dc), 0)
                
        target = 0
        if state == 0 and n_sum in B:
            target = 2
        elif state >= 1 and n_sum in S:
            target = 2
            
        next_state = state
        if state < target: next_state += 1
        elif state > target: next_state -= 1
        
        if next_state > 0:
            new_grid[(r, c)] = next_state
            
    return new_grid

def get_canonical(grid_dict):
    if not grid_dict: return tuple(), 0, 0
    min_r = min(r for r, c in grid_dict)
    min_c = min(c for r, c in grid_dict)
    shape = tuple(sorted(((r - min_r, c - min_c, state) for (r, c), state in grid_dict.items())))
    return shape, min_r, min_c

def test_periodicity(rle_str, B, S, max_steps=400):
    curr_grid = parse_rle_to_dict(rle_str)
    if not curr_grid: return None, 0, 0
    
    shape, start_r, start_c = get_canonical(curr_grid)
    history = {shape: (0, start_r, start_c)}
    
    for step in range(1, max_steps + 1):
        curr_grid = step_dict(curr_grid, B, S)
        if not curr_grid: return None, 0, 0
        
        shape, min_r, min_c = get_canonical(curr_grid)
        if shape in history:
            past_step, past_r, past_c = history[shape]
            period = step - past_step
            dy = min_r - past_r
            dx = min_c - past_c
            return period, dy, dx
            
        history[shape] = (step, min_r, min_c)
        
    return None, 0, 0

def get_expected_speed_string(period, dy, dx):
    disp = max(abs(dy), abs(dx))
    if disp == 0:
        return f"Oscillator P{period}"
    
    gcd = math.gcd(disp, period)
    simp_disp = disp // gcd
    simp_period = period // gcd
    
    if simp_disp == 1 and simp_period == 1:
        return "Glider c"
    elif simp_disp == 1:
        return f"Glider c/{simp_period}"
    else:
        return f"Glider {simp_disp}c/{simp_period}"

def extract_patterns():
    node_script = """
    const fs = require('fs');
    try {
        let content = fs.readFileSync('src/patterns/halfLife.js', 'utf-8');
        content = content.replace('export default', 'module.exports = ');
        fs.writeFileSync('temp_halflife_export.js', content);
        const data = require('./temp_halflife_export.js');
        const result = {};
        for(let key of Object.keys(data)) {
            result[key] = data[key];
        }
        console.log(JSON.stringify(result));
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
    """
    with open('dump.js', 'w') as f:
        f.write(node_script)
    
    res = subprocess.run(['node', 'dump.js'], capture_output=True, text=True)
    if res.returncode != 0:
        print("Error exporting patterns:", res.stderr)
        os.remove('dump.js')
        return None
        
    data = json.loads(res.stdout)
    os.remove('dump.js')
    os.remove('temp_halflife_export.js')
    return data

def main():
    print("Loading patterns from halfLife.js...")
    data = extract_patterns()
    if not data: return
    
    differences_found = 0
    total_patterns = 0
    new_data = {}
    
    for rule_key, patterns in data.items():
        B, S = parse_rule_string(rule_key)
        new_data[rule_key] = {}
        
        for name, details in patterns.items():
            total_patterns += 1
            rle = details.get('rle', '')
            old_desc = details.get('description', '')
            
            period, dy, dx = test_periodicity(rle, B, S, max_steps=400)
            
            if period is None:
                print(f"[{rule_key}] WARNING: Could not find periodicity for {name} within 400 steps")
                new_data[rule_key][name] = details
                continue
                
            expected_speed = get_expected_speed_string(period, dy, dx)
            
            name_mismatch = False
            if not name.startswith(expected_speed):
                name_mismatch = True
            if "Oscillator" in name and "Glider" in expected_speed:
                name_mismatch = True
            
            disp = max(abs(dy), abs(dx))
            desc_mismatch = False
            if "Glider" in expected_speed:
                desc_period_match = re.search(r'period\s+(\d+)', old_desc, re.IGNORECASE)
                desc_disp_match = re.search(r'displacement\s+(\d+)', old_desc, re.IGNORECASE)
                
                desc_period = int(desc_period_match.group(1)) if desc_period_match else None
                desc_disp = int(desc_disp_match.group(1)) if desc_disp_match else None
                
                if desc_period != period or desc_disp != disp:
                    desc_mismatch = True
            else:
                desc_period_match = re.search(r'Period\s+(\d+)', old_desc, re.IGNORECASE)
                desc_period = int(desc_period_match.group(1)) if desc_period_match else None
                if desc_period != period:
                    desc_mismatch = True
            
            if name_mismatch or desc_mismatch:
                new_name = expected_speed
                # Preserve suffix
                parts = name.split()
                if parts[-1].isdigit():
                    new_name += f" {parts[-1]}"
                    
                if "Glider" in expected_speed:
                    new_desc = f"Glider, speed {expected_speed.split(' ')[1]} (period {period}, displacement {disp})"
                else:
                    new_desc = f"Period {period} oscillator"
                    if "(smallest)" in old_desc:
                        new_desc += " (smallest)"
                        
                print("-" * 50)
                print(f"[{rule_key}] DIFFERENCE DETECTED:")
                print(f"  Current Name : {name}")
                if name_mismatch:
                    print(f"  Detected True: {expected_speed}")
                
                print(f"  Description  : {old_desc}")
                if desc_mismatch:
                    if "Glider" in expected_speed:
                        print(f"  Desc Should Be: Glider, speed {expected_speed.split(' ')[1]} (period {period}, displacement {disp})")
                    else:
                        print(f"  Desc Should Be: Period {period} oscillator")
                differences_found += 1
                
                new_data[rule_key][new_name] = {
                    'rle': rle,
                    'description': new_desc
                }
            else:
                new_data[rule_key][name] = details

    print("-" * 50)
    print(f"\nAnalysis complete! Found {differences_found} discrepancies out of {total_patterns} patterns.")
    
    if differences_found > 0:
        print(f"Updating halfLife.js with {differences_found} changes...")
        out = "// Auto-generated from halfLife.json - patterns as RLE\n"
        out += "const patterns = {\n"
        for rule in new_data:
            out += f"  '{rule}': {{\n"
            rule_patterns = new_data[rule]
            for name in rule_patterns:
                p = rule_patterns[name]
                rle_encoded = p['rle'].replace('\\', '\\\\').replace('\n', '\\n').replace("'", "\\'")
                desc_encoded = p['description'].replace("'", "\\'")
                out += f"    '{name}': {{\n"
                out += f"      rle: '{rle_encoded}',\n"
                out += f"      description: '{desc_encoded}',\n"
                out += f"    }},\n"
            out += f"  }},\n"
        out += "};\n\nexport default patterns;\n"
        
        with open('src/patterns/halfLife.js', 'w', encoding='utf-8') as f:
            f.write(out)
        print("Successfully wrote src/patterns/halfLife.js")

if __name__ == '__main__':
    main()
