#!/bin/bash

# Servidor local para Render Evento Andina

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔════════════════════════════════════════════╗"
echo "║   Render Evento Andina - Servidor Local   ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Abrir en navegador:"
echo "  http://localhost:8080"
echo ""
echo "Pulsa Ctrl+C para detener"
echo "─────────────────────────────────────────────"
echo ""

# Verificar Node.js para servidores más robustos
if command -v npx &> /dev/null; then
    echo "Usando npx (servidor simple)..."
    npx --yes http-server -p 8080 -c-1
elif command -v python3 &> /dev/null; then
    echo "Usando Python3..."
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Usando Python..."
    python -m http.server 8080
else
    echo "Error: No se encontró Python ni Node.js"
    exit 1
fi
