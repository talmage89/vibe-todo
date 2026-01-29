#!/bin/bash
# Fix epic parent relationships
# Run with: bash scripts/fix-epic-parents.sh

set -e

echo "=== Removing blocking dependencies ==="

# Database Schema (todo-apn)
echo "Fixing Database Schema epic..."
bd dep remove todo-apn todo-xl8 2>/dev/null || true

# Authentication (todo-ahg)
echo "Fixing Authentication epic..."
bd dep remove todo-ahg todo-dmd 2>/dev/null || true
bd dep remove todo-ahg todo-4g0 2>/dev/null || true
bd dep remove todo-ahg todo-8bh 2>/dev/null || true
bd dep remove todo-ahg todo-w3q 2>/dev/null || true
bd dep remove todo-ahg todo-3ey 2>/dev/null || true
bd dep remove todo-ahg todo-60p 2>/dev/null || true
bd dep remove todo-ahg todo-0ot 2>/dev/null || true

# UI Shell (todo-un4)
echo "Fixing UI Shell epic..."
bd dep remove todo-un4 todo-dxw 2>/dev/null || true
bd dep remove todo-un4 todo-9yh 2>/dev/null || true
bd dep remove todo-un4 todo-mnu 2>/dev/null || true
bd dep remove todo-un4 todo-nok 2>/dev/null || true
bd dep remove todo-un4 todo-45i 2>/dev/null || true
bd dep remove todo-un4 todo-8lo 2>/dev/null || true

# Project Management (todo-zju)
echo "Fixing Project Management epic..."
bd dep remove todo-zju todo-p8z 2>/dev/null || true
bd dep remove todo-zju todo-2hz 2>/dev/null || true
bd dep remove todo-zju todo-3jb 2>/dev/null || true
bd dep remove todo-zju todo-gll 2>/dev/null || true
bd dep remove todo-zju todo-n2u 2>/dev/null || true

# Task Management (todo-d0y)
echo "Fixing Task Management epic..."
bd dep remove todo-d0y todo-xam 2>/dev/null || true
bd dep remove todo-d0y todo-0jr 2>/dev/null || true
bd dep remove todo-d0y todo-1c5 2>/dev/null || true
bd dep remove todo-d0y todo-ett 2>/dev/null || true
bd dep remove todo-d0y todo-yvz 2>/dev/null || true
bd dep remove todo-d0y todo-683 2>/dev/null || true
bd dep remove todo-d0y todo-0aw 2>/dev/null || true

# List View (todo-av6)
echo "Fixing List View epic..."
bd dep remove todo-av6 todo-awv 2>/dev/null || true
bd dep remove todo-av6 todo-pin 2>/dev/null || true
bd dep remove todo-av6 todo-nic 2>/dev/null || true
bd dep remove todo-av6 todo-3vv 2>/dev/null || true
bd dep remove todo-av6 todo-0dt 2>/dev/null || true
bd dep remove todo-av6 todo-09t 2>/dev/null || true

# Kanban View (todo-t8r)
echo "Fixing Kanban View epic..."
bd dep remove todo-t8r todo-4jr 2>/dev/null || true
bd dep remove todo-t8r todo-jud 2>/dev/null || true
bd dep remove todo-t8r todo-6c1 2>/dev/null || true
bd dep remove todo-t8r todo-ov8 2>/dev/null || true
bd dep remove todo-t8r todo-r6j 2>/dev/null || true

# Search & Filtering (todo-9vq)
echo "Fixing Search epic..."
bd dep remove todo-9vq todo-j3z 2>/dev/null || true
bd dep remove todo-9vq todo-9o8 2>/dev/null || true
bd dep remove todo-9vq todo-aw6 2>/dev/null || true
bd dep remove todo-9vq todo-52z 2>/dev/null || true
bd dep remove todo-9vq todo-tp2 2>/dev/null || true

# Task Templates (todo-8hb)
echo "Fixing Templates epic..."
bd dep remove todo-8hb todo-sgi 2>/dev/null || true
bd dep remove todo-8hb todo-4v5 2>/dev/null || true
bd dep remove todo-8hb todo-t4w 2>/dev/null || true
bd dep remove todo-8hb todo-d46 2>/dev/null || true

# Sharing (todo-j9e)
echo "Fixing Sharing epic..."
bd dep remove todo-j9e todo-kqa 2>/dev/null || true
bd dep remove todo-j9e todo-90v 2>/dev/null || true
bd dep remove todo-j9e todo-9io 2>/dev/null || true
bd dep remove todo-j9e todo-d71 2>/dev/null || true
bd dep remove todo-j9e todo-pwf 2>/dev/null || true
bd dep remove todo-j9e todo-5mc 2>/dev/null || true

# Settings & Profile (todo-6mu)
echo "Fixing Settings epic..."
bd dep remove todo-6mu todo-zu4 2>/dev/null || true
bd dep remove todo-6mu todo-xxi 2>/dev/null || true
bd dep remove todo-6mu todo-e59 2>/dev/null || true
bd dep remove todo-6mu todo-kyy 2>/dev/null || true
bd dep remove todo-6mu todo-k0v 2>/dev/null || true
bd dep remove todo-6mu todo-qyo 2>/dev/null || true

echo ""
echo "=== Setting parent relationships ==="

# Database Schema children
echo "Setting Database Schema children..."
bd update todo-axk --parent=todo-apn
bd update todo-97l --parent=todo-apn
bd update todo-7rl --parent=todo-apn
bd update todo-07f --parent=todo-apn
bd update todo-see --parent=todo-apn
bd update todo-xl8 --parent=todo-apn

# Authentication children
echo "Setting Authentication children..."
bd update todo-dmd --parent=todo-ahg
bd update todo-4g0 --parent=todo-ahg
bd update todo-8bh --parent=todo-ahg
bd update todo-w3q --parent=todo-ahg
bd update todo-3ey --parent=todo-ahg
bd update todo-60p --parent=todo-ahg
bd update todo-0ot --parent=todo-ahg

# UI Shell children
echo "Setting UI Shell children..."
bd update todo-dxw --parent=todo-un4
bd update todo-9yh --parent=todo-un4
bd update todo-mnu --parent=todo-un4
bd update todo-nok --parent=todo-un4
bd update todo-45i --parent=todo-un4
bd update todo-8lo --parent=todo-un4

# Project Management children
echo "Setting Project Management children..."
bd update todo-p8z --parent=todo-zju
bd update todo-2hz --parent=todo-zju
bd update todo-3jb --parent=todo-zju
bd update todo-gll --parent=todo-zju
bd update todo-n2u --parent=todo-zju

# Task Management children
echo "Setting Task Management children..."
bd update todo-xam --parent=todo-d0y
bd update todo-0jr --parent=todo-d0y
bd update todo-1c5 --parent=todo-d0y
bd update todo-ett --parent=todo-d0y
bd update todo-yvz --parent=todo-d0y
bd update todo-683 --parent=todo-d0y
bd update todo-0aw --parent=todo-d0y

# List View children
echo "Setting List View children..."
bd update todo-awv --parent=todo-av6
bd update todo-pin --parent=todo-av6
bd update todo-nic --parent=todo-av6
bd update todo-3vv --parent=todo-av6
bd update todo-0dt --parent=todo-av6
bd update todo-09t --parent=todo-av6

# Kanban View children
echo "Setting Kanban View children..."
bd update todo-4jr --parent=todo-t8r
bd update todo-jud --parent=todo-t8r
bd update todo-6c1 --parent=todo-t8r
bd update todo-ov8 --parent=todo-t8r
bd update todo-r6j --parent=todo-t8r

# Search & Filtering children
echo "Setting Search children..."
bd update todo-j3z --parent=todo-9vq
bd update todo-9o8 --parent=todo-9vq
bd update todo-aw6 --parent=todo-9vq
bd update todo-52z --parent=todo-9vq
bd update todo-tp2 --parent=todo-9vq

# Task Templates children
echo "Setting Templates children..."
bd update todo-sgi --parent=todo-8hb
bd update todo-4v5 --parent=todo-8hb
bd update todo-t4w --parent=todo-8hb
bd update todo-d46 --parent=todo-8hb

# Sharing children
echo "Setting Sharing children..."
bd update todo-kqa --parent=todo-j9e
bd update todo-90v --parent=todo-j9e
bd update todo-9io --parent=todo-j9e
bd update todo-d71 --parent=todo-j9e
bd update todo-pwf --parent=todo-j9e
bd update todo-5mc --parent=todo-j9e

# Settings & Profile children
echo "Setting Settings children..."
bd update todo-zu4 --parent=todo-6mu
bd update todo-xxi --parent=todo-6mu
bd update todo-e59 --parent=todo-6mu
bd update todo-kyy --parent=todo-6mu
bd update todo-k0v --parent=todo-6mu
bd update todo-qyo --parent=todo-6mu

echo ""
echo "=== Done! Verifying ==="
bd epic status
