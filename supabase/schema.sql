-- Supabase Schema for Wallmount Allied

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth TEXT,
  ssn TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  password TEXT,
  pin TEXT,
  license_number TEXT,
  license_state TEXT,
  license_url TEXT,
  account_number TEXT UNIQUE,
  checking_balance DECIMAL(12, 2) DEFAULT 0.0,
  savings_balance DECIMAL(12, 2) DEFAULT 0.0,
  available_checking_balance DECIMAL(12, 2) DEFAULT 0.0,
  available_savings_balance DECIMAL(12, 2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  account_status TEXT DEFAULT 'pending',
  verification_status TEXT DEFAULT 'pending',
  kyc_completed BOOLEAN DEFAULT FALSE,
  login_attempts INTEGER DEFAULT 0,
  lock_reason TEXT,
  suspension_reason TEXT,
  occupation TEXT,
  monthly_income DECIMAL(12, 2),
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'credit', 'debit', 'deposit', 'withdrawal', 'transfer', 'payment'
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'completed',
  from_account TEXT,
  to_account TEXT,
  created_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by TEXT
);

-- Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  account_number TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Set up Row Level Security (RLS)
-- We will disable RLS for now to ensure smooth migration from the file-based system,
-- but you should enable and configure it for production.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
