-- Migration: Add fx_presets table
CREATE TABLE IF NOT EXISTS fx_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    params_json TEXT,
    created_at TEXT
);
