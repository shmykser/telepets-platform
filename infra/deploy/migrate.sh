#!/bin/bash

# Database Migration Script
set -e

echo "========================================"
echo "   Telepets Platform - Database Setup"
echo "========================================"
echo

# Set SQLite database URL
export DATABASE_URL="sqlite:///./telepets.db"

# Change to backend directory
cd ../../backend

echo "Checking database status..."

# Check if database exists, if not create it
if [ ! -f "telepets.db" ]; then
    echo "[INFO] Creating new database..."
    python -c "from models import Base; from db import engine; Base.metadata.create_all(engine); print('Database created')"
    if [ $? -eq 0 ]; then
        echo "[OK] Database created successfully!"
    else
        echo "[ERROR] Failed to create database"
        exit 1
    fi
else
    echo "[OK] Database found"
fi

echo
echo "Testing database connection..."
python -c "import sqlite3; conn = sqlite3.connect('telepets.db'); print('Connection OK'); conn.close()"
if [ $? -eq 0 ]; then
    echo "[OK] Database connection works"
else
    echo "[ERROR] Database connection failed"
    exit 1
fi

echo
echo "Testing models..."
python -c "from models import Base; print('Models loaded successfully')"
if [ $? -eq 0 ]; then
    echo "[OK] Models work correctly"
else
    echo "[ERROR] Models failed to load"
    exit 1
fi

echo
echo "========================================"
echo "   Database is ready to use!"
echo "========================================"
echo
echo "You can now start the backend with:"
echo "  python main.py"
echo