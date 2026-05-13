#!/bin/bash
# ============================================
# Entrypoint - Debian 11 Web Terminal
# ============================================
set -e

echo "========================================"
echo "  Debian 11 Web Terminal - Railway VM"
echo "========================================"
echo ""
echo "  OS      : Debian 11 (Bullseye)"
echo "  User    : root"
echo "  Pass    : debian11"
echo "  Terminal: ttyd (Web)"
echo "  Port    : 8080"
echo ""
echo "========================================"

# Print system info
echo "[*] System Info:"
echo "    Hostname : $(hostname)"
echo "    Kernel   : $(uname -r)"
echo "    Arch     : $(uname -m)"
echo "    CPU      : $(nproc) core(s)"
echo "    Memory   : $(free -h | awk '/Mem:/ {print $2}')"
echo "    Disk     : $(df -h / | awk 'NR==2 {print $4}') available"
echo ""

# Start ttyd - web terminal on port 8080
# -W: builtin websocket (no external server needed)
# -p 8080: listen on port 8080 (Railway default)
# --base-path: Railway compatibility
exec ttyd \
    --port 8080 \
    --writable \
    --base-path / \
    bash
