#!/bin/bash

# Script d'initialisation PostgreSQL pour O2Switch
# Usage: ./init-postgres.sh <user> <password> <database>

set -e

if [ $# -lt 3 ]; then
    echo "Usage: $0 <user> <password> <database>"
    echo "Example: $0 nocalc mypassword nocalculator"
    exit 1
fi

USER=$1
PASSWORD=$2
DATABASE=$3

echo "🐘 Initialisation PostgreSQL..."

# Créer l'utilisateur et la base
psql -U postgres << EOF
CREATE USER $USER WITH PASSWORD '$PASSWORD';
CREATE DATABASE $DATABASE OWNER $USER;
GRANT ALL PRIVILEGES ON DATABASE $DATABASE TO $USER;
EOF

# Initialiser les tables
psql -U $USER -d $DATABASE << EOF
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  elo INTEGER DEFAULT 1000,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  player1_id INTEGER NOT NULL REFERENCES users(id),
  player2_id INTEGER NOT NULL REFERENCES users(id),
  questions TEXT NOT NULL,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  winner_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_events (
  id SERIAL PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id),
  player_id INTEGER NOT NULL REFERENCES users(id),
  question_index INTEGER NOT NULL,
  answer INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  time_ms INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
EOF

echo "✅ PostgreSQL initialisé avec succès!"
echo "Connection string: postgresql://$USER:$PASSWORD@localhost:5432/$DATABASE"
