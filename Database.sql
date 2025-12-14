-- =========================================================
-- 1. DROP TABLES (CHILD → PARENT)
-- =========================================================

DROP TABLE IF EXISTS saving_goal_transaction CASCADE;
DROP TABLE IF EXISTS planned_expense CASCADE;
DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS budget CASCADE;
DROP TABLE IF EXISTS saving_goal CASCADE;
DROP TABLE IF EXISTS wallet CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Clean up older tables if they still exist in your DB
DROP TABLE IF EXISTS user_watchlist CASCADE;
DROP TABLE IF EXISTS sentiment CASCADE;
DROP TABLE IF EXISTS asset CASCADE;
DROP TABLE IF EXISTS alert CASCADE;
DROP TABLE IF EXISTS aimsg CASCADE;

-- =========================================================
-- 2. DROP ENUM TYPES IF EXIST
-- =========================================================

DROP TYPE IF EXISTS wallet_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS bill_status CASCADE;
DROP TYPE IF EXISTS recurrence_type CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;

-- =========================================================
-- 3. CREATE ENUM TYPES
-- =========================================================

CREATE TYPE wallet_type AS ENUM ('bank', 'cash', 'ewallet', 'crypto', 'stocks');
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'archived');

-- ENUMS FOR PLANNED EXPENSES
CREATE TYPE bill_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE recurrence_type AS ENUM ('one_time', 'daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');

-- =========================================================
-- 4. CREATE TABLES
-- =========================================================

-- ===========================
-- TABLE: USER
-- ===========================
CREATE TABLE "user" (
                        user_id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password VARCHAR(100) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_user_email ON "user" (email);

-- ===========================
-- TABLE: CATEGORY
-- ===========================
CREATE TABLE category (
                          category_id SERIAL PRIMARY KEY,
                          name VARCHAR(255) NOT NULL,
                          user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_category_user ON category (user_id);

-- ===========================
-- TABLE: WALLET
-- ===========================
CREATE TABLE wallet (
                        wallet_id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        type wallet_type NOT NULL,
                        purpose VARCHAR(255),
                        balance NUMERIC(12,2) DEFAULT 0 NOT NULL,
                        user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_wallet_user ON wallet (user_id);

-- ===========================
-- TABLE: SAVING_GOAL
-- ===========================
CREATE TABLE saving_goal (
                             goal_id SERIAL PRIMARY KEY,
                             name VARCHAR(255) NOT NULL,
                             target_amount NUMERIC(12,2) NOT NULL,
                             current_amount NUMERIC(12,2) DEFAULT 0 NOT NULL,
                             start_date DATE DEFAULT CURRENT_DATE NOT NULL,
                             goal_date DATE NOT NULL,
                             is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
                             status goal_status DEFAULT 'active' NOT NULL,
                             user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
                             wallet_id INT REFERENCES wallet(wallet_id) ON DELETE SET NULL,
                             created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_goal_user ON saving_goal (user_id);

-- ===========================
-- TABLE: BUDGET
-- ===========================
CREATE TABLE budget (
                        budget_id SERIAL PRIMARY KEY,
                        limit_amount NUMERIC(12,2) NOT NULL,
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
                        user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
                        category_id INT NOT NULL REFERENCES category(category_id) ON DELETE CASCADE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_budget_user_dates ON budget (user_id, start_date, end_date);

-- ===========================
-- TABLE: PLANNED_EXPENSE (Bills / Debts)
-- ===========================
CREATE TABLE planned_expense (
                                 planned_expense_id SERIAL PRIMARY KEY,
                                 name VARCHAR(255) NOT NULL,

    -- FINANCIALS
                                 amount_due NUMERIC(12,2) NOT NULL,             -- Goal Amount
                                 amount_paid NUMERIC(12,2) DEFAULT 0 NOT NULL,  -- Current Amount paid so far

    -- DATES
                                 start_date DATE DEFAULT CURRENT_DATE NOT NULL, -- When this bill/agreement started
                                 due_date DATE NOT NULL,                        -- Specific date the NEXT payment is due
                                 end_date DATE,                                 -- NEW: Date when recurrence stops (NULL = Forever)

    -- RECURRENCE SETTINGS
                                 frequency recurrence_type DEFAULT 'one_time' NOT NULL,
                                 recurring_day INT CHECK (recurring_day BETWEEN 1 AND 31), -- "Pay on the 15th"

    -- SETTINGS
                                 status bill_status DEFAULT 'pending' NOT NULL,
                                 priority priority_level DEFAULT 'medium' NOT NULL,
                                 description TEXT,

    -- RELATIONS
                                 user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
                                 category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
                                 created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_planned_expense_due ON planned_expense (user_id, due_date);
CREATE INDEX idx_planned_expense_status ON planned_expense (user_id, status);

-- ===========================
-- TABLE: TRANSACTION
-- ===========================
CREATE TABLE transaction (
                             transaction_id SERIAL PRIMARY KEY,
                             name VARCHAR(255) NOT NULL,
                             amount NUMERIC(12,2) NOT NULL,
                             transaction_date DATE NOT NULL,
                             description TEXT,
                             type transaction_type NOT NULL,
                             wallet_id INT REFERENCES wallet(wallet_id) ON DELETE CASCADE,
                             category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
                             created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transaction_date_wallet ON transaction (transaction_date, wallet_id);

-- ===========================
-- TABLE: SAVING_GOAL_TRANSACTION
-- ===========================
CREATE TABLE saving_goal_transaction (
                                         transaction_id SERIAL PRIMARY KEY,
                                         amount NUMERIC(12,2) NOT NULL,
                                         transaction_date DATE NOT NULL,
                                         is_contribution BOOLEAN NOT NULL,
                                         goal_id INT NOT NULL REFERENCES saving_goal(goal_id) ON DELETE CASCADE,
                                         wallet_id INT REFERENCES wallet(wallet_id) ON DELETE SET NULL,
                                         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_goal_tx_goal ON saving_goal_transaction (goal_id);