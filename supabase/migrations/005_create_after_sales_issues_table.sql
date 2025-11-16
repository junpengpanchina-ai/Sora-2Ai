-- Create table for customer feedback / after-sales issues
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS after_sales_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  issue_category TEXT,
  issue_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_after_sales_issues_status ON after_sales_issues(status);
CREATE INDEX IF NOT EXISTS idx_after_sales_issues_created_at ON after_sales_issues(created_at DESC);

DROP TRIGGER IF EXISTS update_after_sales_issues_updated_at ON after_sales_issues;
CREATE TRIGGER update_after_sales_issues_updated_at
  BEFORE UPDATE ON after_sales_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

