-- Manufacturing Pipeline — Neon Database Schema
-- Run this once in the Neon SQL Editor after connecting your database.
-- Neon dashboard → your project → SQL Editor → paste and run.

CREATE TABLE IF NOT EXISTS cards (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name           TEXT        NOT NULL DEFAULT '',
  status         TEXT        NOT NULL DEFAULT 'Needs Drawing',
  project        TEXT,
  machine        TEXT,
  material       TEXT,
  thickness      TEXT,
  part_type      TEXT,
  quantity       INTEGER,
  finish         TEXT,
  assigned_to    TEXT,
  cad_link       TEXT,
  notes          TEXT,
  step_file_url  TEXT,
  step_file_name TEXT,
  pdf_file_url   TEXT,
  pdf_file_name  TEXT,
  part_id        TEXT,
  submitted_by   TEXT,
  is_critical    BOOLEAN     NOT NULL DEFAULT FALSE,
  thumbnail_url  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
