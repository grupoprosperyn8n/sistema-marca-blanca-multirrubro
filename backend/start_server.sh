#!/bin/bash
cd "/home/diegol/Descargas/PROYECTOS AIONUI/sistema-marca-blanca-multirrubro/backend"
export $(grep -v '^#' .env | xargs)
source .venv/bin/activate
exec uvicorn main:app --host 0.0.0.0 --port 8000
