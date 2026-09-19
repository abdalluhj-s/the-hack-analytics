-- SQL Migration Schema for "The Hack" Automotive Survey & Call Analytics Dashboard
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Create table for surveys
CREATE TABLE IF NOT EXISTS public.surveys (
    id TEXT PRIMARY KEY,
    branch TEXT NOT NULL DEFAULT '',
    product TEXT DEFAULT '',
    call_status TEXT DEFAULT '',
    satisfaction TEXT DEFAULT '',
    agent TEXT DEFAULT '',
    technician TEXT DEFAULT '',
    salesperson TEXT DEFAULT '',
    customer_notes TEXT DEFAULT '',
    branch_notes TEXT DEFAULT '',
    customer_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    action_taken BOOLEAN DEFAULT false,
    action_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for public access (or authenticated depending on your setup)
CREATE POLICY "Allow public read access"
ON public.surveys FOR SELECT
USING (true);

CREATE POLICY "Allow public insert and update access"
ON public.surveys FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_surveys_branch ON public.surveys(branch);
CREATE INDEX IF NOT EXISTS idx_surveys_call_status ON public.surveys(call_status);
CREATE INDEX IF NOT EXISTS idx_surveys_satisfaction ON public.surveys(satisfaction);
CREATE INDEX IF NOT EXISTS idx_surveys_agent ON public.surveys(agent);
