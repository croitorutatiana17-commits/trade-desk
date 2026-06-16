-- Add columns to jobs table that are missing from the schema cache
-- Run this in the Supabase SQL Editor or via: supabase db push

alter table jobs
  add column if not exists category       text,
  add column if not exists description    text,
  add column if not exists scheduled_date date,
  add column if not exists scheduled_time text,
  add column if not exists notes          text;
