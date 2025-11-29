-- ===========================
-- 1. DROP TABLES (CHILD → PARENT)
-- ===========================

DROP TABLE IF EXISTS saving_goal_transaction CASCADE;
DROP TABLE IF EXISTS user_watchlist CASCADE;
DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS budget CASCADE;
DROP TABLE IF EXISTS saving_goal CASCADE;
DROP TABLE IF EXISTS wallet CASCADE;
DROP TABLE IF EXISTS sentiment CASCADE;
DROP TABLE IF EXISTS asset CASCADE;
DROP TABLE IF EXISTS alert CASCADE;
DROP TABLE IF EXISTS aimsg CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- ===========================
-- 2. DROP ENUM TYPES IF EXIST
-- ===========================

DROP TYPE IF EXISTS wallet_type CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- ===========================
-- 3. CREATE ENUM TYPES
-- ===========================

CREATE TYPE wallet_type AS ENUM ('bank', 'cash', 'ewallet', 'crypto', 'stocks');
CREATE TYPE asset_type AS ENUM ('stock', 'crypto');
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer'); -- Added 'transfer' type

-- ===========================
-- 4. CREATE TABLES
-- ===========================

-- ===========================
-- TABLE: USER (Optimized for Auth)
-- ===========================
CREATE TABLE "user" (
                        user_id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
    -- Increased size for hashed passwords (bcrypt output is long)
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
-- TABLE: WALLET (Simplified Balance)
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
                             is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
                             user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
                             wallet_id INT REFERENCES wallet(wallet_id) ON DELETE SET NULL, -- Wallet where funds are held
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
                             category_id INT REFERENCES category(category_id) ON DELETE SET NULL, -- Keep transaction, lose category
                             created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transaction_date_wallet ON transaction (transaction_date, wallet_id);


-- ============================================
-- TABLE: SAVING_GOAL_TRANSACTION (Contribution/Withdrawal)
-- ============================================
CREATE TABLE saving_goal_transaction (
                                         transaction_id SERIAL PRIMARY KEY,
                                         amount NUMERIC(12,2) NOT NULL,
                                         transaction_date DATE NOT NULL,
                                         is_contribution BOOLEAN NOT NULL, -- TRUE for contribution, FALSE for withdrawal
                                         goal_id INT NOT NULL REFERENCES saving_goal(goal_id) ON DELETE CASCADE,
                                         wallet_id INT REFERENCES wallet(wallet_id) ON DELETE SET NULL,
                                         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_goal_tx_goal ON saving_goal_transaction (goal_id);


-- ===========================
-- TABLE: ASSET (Global/Public Data)
-- ===========================
CREATE TABLE asset (
                       asset_id SERIAL PRIMARY KEY,
                       symbol VARCHAR(50) UNIQUE NOT NULL,
                       asset_name VARCHAR(255) NOT NULL,
                       asset_type asset_type NOT NULL,
                       current_price NUMERIC(12,2) NOT NULL,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_asset_symbol ON asset (symbol);


-- ===========================
-- TABLE: USER_WATCHLIST (Junction Table)
-- ===========================
CREATE TABLE user_watchlist (
                                user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
                                asset_id INT REFERENCES asset(asset_id) ON DELETE CASCADE,
                                PRIMARY KEY (user_id, asset_id)
);


-- ===========================
-- TABLE: SENTIMENT
-- ===========================
CREATE TABLE sentiment (
                           sentiment_id SERIAL PRIMARY KEY,
                           news_headline TEXT NOT NULL,
                           source VARCHAR(255),
                           sentiment_score NUMERIC(5,2),
                           sentiment_label VARCHAR(50),
                           "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
                           asset_id INT REFERENCES asset(asset_id) ON DELETE CASCADE,
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sentiment_asset_time ON sentiment (asset_id, "timestamp");


-- ===========================
-- TABLE: ALERT
-- ===========================
CREATE TABLE alert (
                       alert_id SERIAL PRIMARY KEY,
                       type VARCHAR(100) NOT NULL,
                       condition TEXT NOT NULL,
                       is_active BOOLEAN DEFAULT TRUE NOT NULL,
                       user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_alert_user ON alert (user_id);


-- ===========================
-- TABLE: AI_MSG (Renamed to 'aimsg' in your previous query)
-- ===========================
CREATE TABLE aimsg (
                       ai_msg_id SERIAL PRIMARY KEY,
                       "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       actor VARCHAR(255) NOT NULL, -- 'user' or 'ai'
                       message_content TEXT NOT NULL,
                       user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_aimsg_user ON aimsg (user_id);


-- ============================================
-- 5. INSERT SAMPLE DATA (AUTHENTICATION)
-- ============================================

-- Alice (1) & Bob (2) use 'password123'
INSERT INTO "user" (name, email, password) VALUES
                                               ('Alice Smith', 'alice@example.com', '$2b$10$v4.k.7L7.E1jS1yX8.B2E.S4D8A6X9D7G3V8I3H1L2V9E6R7C4F1A3'), -- user_id = 1
                                               ('Bob Johnson', 'bob@example.com', '$2b$10$W9M7Z8S6X5C4V3B2N1A0Q9P8O7I6U5Y4T3R2E1W0Q9A8S7D6F5G4H3'),   -- user_id = 2

-- New Users (3-7) use 'securepass123'
                                               ('Charlie Davis', 'charlie@test.com', '$2b$10$T9R8Q7P6O5N4M3L2K1J0I9H8G7F6E5D4C3B2A1Z0Y9X8W7V6U5T4S3'), -- user_id = 3
                                               ('Diana Evans', 'diana@test.com', '$2b$10$H7G8F9E0D1C2B3A4Z5Y6X7W8V9U0T1S2R3Q4P5O6N7M8L9K0J1I2H3G4'),   -- user_id = 4
                                               ('Ethan Green', 'ethan@test.com', '$2b$10$J0I9H8G7F6E5D4C3B2A1Z0Y9X8W7V6U5T4S3R2Q1P0O9N8M7L6K5J4I3'),   -- user_id = 5
                                               ('Fiona Hall', 'fiona@test.com', '$2b$10$K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8'),   -- user_id = 6
                                               ('Greg Jones', 'greg@test.com', '$2b$10$V6U5T4S3R2Q1P0O9N8M7L6K5J4I3H2G1F0E9D8C7B6A5Z4Y3X2W1V0U9');   -- user_id = 7


-- ============================================
-- 6. INSERT SAMPLE DATA (CORE FINANCIALS)
-- ============================================

-- Insert Categories (User 1-7)
INSERT INTO category (name, user_id) VALUES
                                         ('Food', 1),           -- 1
                                         ('Transport', 1),      -- 2
                                         ('Salary', 1),         -- 3
                                         ('Groceries', 2),      -- 4
                                         ('Utilities', 2),      -- 5
                                         ('Freelance', 2),      -- 6
                                         ('Rent', 3),           -- 7
                                         ('Entertainment', 4),  -- 8
                                         ('Health', 5),         -- 9
                                         ('Pet Supplies', 6),   -- 10
                                         ('Investments', 7),    -- 11
                                         ('Other Income', 3);   -- 12


-- Insert Wallets (User 1-7)
INSERT INTO wallet (name, type, purpose, balance, user_id) VALUES
                                                               ('Alice Main Bank', 'bank', 'Daily expenses', 1500.00, 1),  -- 1
                                                               ('Alice Crypto Wallet', 'crypto', 'Investments', 5000.00, 1), -- 2
                                                               ('Bob E-Wallet', 'ewallet', 'Online shopping', 350.50, 2),   -- 3
                                                               ('Charlie Checking', 'bank', 'Rent/Bills', 2500.00, 3),      -- 4
                                                               ('Diana Cash', 'cash', 'Discretionary spending', 80.00, 4),   -- 5
                                                               ('Ethan Savings', 'bank', 'Emergency fund', 10000.00, 5),    -- 6
                                                               ('Fiona Credit Card', 'bank', 'Monthly bills', -500.00, 6),  -- 7 (Negative balance for Credit Card)
                                                               ('Greg Stocks Portfolio', 'stocks', 'Long term growth', 2000.00, 7); -- 8


-- Insert Saving Goals
INSERT INTO saving_goal (name, target_amount, current_amount, user_id, wallet_id, is_pinned) VALUES
                                                                                                 ('New Laptop', 1500.00, 300.00, 1, 1, TRUE),    -- Alice
                                                                                                 ('Vacation Fund', 1000.00, 150.00, 2, 3, FALSE), -- Bob
                                                                                                 ('Emergency Fund Goal', 5000.00, 0.00, 3, 4, TRUE), -- Charlie
                                                                                                 ('New Phone', 800.00, 50.00, 4, 5, FALSE),      -- Diana
                                                                                                 ('Car Down Payment', 10000.00, 500.00, 5, 6, TRUE), -- Ethan
                                                                                                 ('Dream Wedding', 20000.00, 5000.00, 6, 7, FALSE),  -- Fiona
                                                                                                 ('Retirement', 50000.00, 1000.00, 7, 8, TRUE);  -- Greg


-- Insert Budgets
INSERT INTO budget (limit_amount, start_date, end_date, user_id, category_id, is_pinned) VALUES
                                                                                             (500.00, '2025-11-01', '2025-11-30', 1, 1, TRUE),   -- Alice's Food
                                                                                             (150.00, '2025-11-01', '2025-11-30', 2, 5, FALSE),  -- Bob's Utilities
                                                                                             (1200.00, '2025-11-01', '2025-11-30', 3, 7, TRUE),  -- Charlie's Rent
                                                                                             (200.00, '2025-11-01', '2025-11-30', 4, 8, FALSE),  -- Diana's Entertainment
                                                                                             (300.00, '2025-11-01', '2025-11-30', 5, 9, TRUE),   -- Ethan's Health
                                                                                             (100.00, '2025-11-01', '2025-11-30', 6, 10, FALSE), -- Fiona's Pet Supplies
                                                                                             (500.00, '2025-11-01', '2025-11-30', 7, 11, TRUE);  -- Greg's Investments


-- Insert Transactions (15+ transactions across multiple users)
INSERT INTO transaction (name, amount, transaction_date, description, type, wallet_id, category_id) VALUES
-- User 1 (Alice, Wallet 1)
('Monthly Salary', 2500.00, '2025-11-01', 'November salary', 'income', 1, 3),
('Dinner at Cafe', 45.50, '2025-11-03', 'Dinner with friends', 'expense', 1, 1),
('Bus Ticket', 2.75, '2025-11-04', 'Commute to work', 'expense', 1, 2),
('Weekly Groceries', 65.00, '2025-11-07', 'Weekend shopping', 'expense', 1, 1),

-- User 2 (Bob, Wallet 3)
('Freelance Project Payment', 300.00, '2025-11-02', 'Web design work', 'income', 3, 6),
('Weekly Groceries', 85.20, '2025-11-05', 'Grocery run', 'expense', 3, 4),
('Electric Bill', 45.00, '2025-11-10', 'Monthly utility payment', 'expense', 3, 5),

-- User 3 (Charlie, Wallet 4)
('Rent Payment', 1200.00, '2025-11-01', 'Monthly rent', 'expense', 4, 7),
('Side Job Income', 500.00, '2025-11-05', 'Consulting gig', 'income', 4, 12),
('Coffee Shop', 15.00, '2025-11-08', 'Breakfast and coffee', 'expense', 4, 1),

-- User 4 (Diana, Wallet 5)
('Movie Tickets', 35.00, '2025-11-12', 'New release', 'expense', 5, 8),
('Refund', 20.00, '2025-11-15', 'Item return', 'income', 5, NULL), -- Uncategorized income

-- User 5 (Ethan, Wallet 6)
('Gym Membership', 99.99, '2025-11-14', 'Monthly fitness fee', 'expense', 6, 9),
('Bonus Deposit', 1500.00, '2025-11-15', 'Year-end bonus', 'income', 6, 3),

-- User 6 (Fiona, Wallet 7)
('Vet Visit', 80.00, '2025-11-16', 'Dog checkup', 'expense', 7, 10),

-- User 7 (Greg, Wallet 8)
('Stock Purchase: GOOGL', 100.00, '2025-11-17', 'Buy GOOGL shares', 'expense', 8, 11),
('Cryptocurrency Trade Fee', 5.00, '2025-11-18', 'BTC transaction fee', 'expense', 8, 11);


-- Insert Saving Goal Transactions (Manual Contributions)
INSERT INTO saving_goal_transaction (amount, transaction_date, is_contribution, goal_id, wallet_id) VALUES
                                                                                                        (300.00, '2025-11-01', TRUE, 1, 1),  -- Alice to Laptop (goal 1)
                                                                                                        (150.00, '2025-11-03', TRUE, 2, 3),  -- Bob to Vacation (goal 2)
                                                                                                        (200.00, '2025-11-06', TRUE, 3, 4),  -- Charlie to Emergency (goal 3)
                                                                                                        (50.00, '2025-11-13', TRUE, 4, 5),   -- Diana to Phone (goal 4)
                                                                                                        (500.00, '2025-11-16', TRUE, 5, 6),  -- Ethan to Car (goal 5)
                                                                                                        (5000.00, '2025-11-17', TRUE, 6, 7); -- Fiona to Wedding (goal 6)


-- Insert Assets (Global, 5+ assets)
INSERT INTO asset (symbol, asset_name, asset_type, current_price) VALUES
                                                                      ('AAPL', 'Apple Inc.', 'stock', 175.20), -- 1
                                                                      ('GOOGL', 'Alphabet Inc.', 'stock', 130.50), -- 2
                                                                      ('BTC', 'Bitcoin', 'crypto', 65000.00), -- 3
                                                                      ('ETH', 'Ethereum', 'crypto', 3500.00), -- 4
                                                                      ('TSLA', 'Tesla, Inc.', 'stock', 250.00), -- 5
                                                                      ('SOL', 'Solana', 'crypto', 110.00); -- 6


-- Insert Watchlist (Ensuring each user watches at least one asset)
INSERT INTO user_watchlist (user_id, asset_id) VALUES
                                                   (1, 1), (1, 3), -- Alice
                                                   (2, 2), (2, 4), -- Bob
                                                   (3, 5),         -- Charlie
                                                   (4, 6),         -- Diana
                                                   (5, 1),         -- Ethan
                                                   (6, 2),         -- Fiona
                                                   (7, 3);         -- Greg


-- Insert Sentiments
INSERT INTO sentiment (news_headline, source, sentiment_score, sentiment_label, "timestamp", asset_id) VALUES
                                                                                                           ('Apple announces new M5 chip, stock expected to rise', 'TechNews', 0.85, 'Positive', CURRENT_TIMESTAMP - INTERVAL '1 day', 1),
                                                                                                           ('Bitcoin faces regulatory hurdles in new market', 'CryptoToday', -0.40, 'Negative', CURRENT_TIMESTAMP - INTERVAL '2 hours', 3),
                                                                                                           ('Tesla stock dips after CEO announcement', 'MarketWatch', -0.65, 'Negative', CURRENT_TIMESTAMP - INTERVAL '1 hour', 5);


-- Insert Alerts
INSERT INTO alert (type, condition, is_active, user_id) VALUES
                                                            ('Price Alert', 'BTC > 68000', TRUE, 1), -- Alice
                                                            ('Budget Alert', 'Food category > 80%', TRUE, 1), -- Alice
                                                            ('Price Alert', 'TSLA < 240', TRUE, 3),  -- Charlie
                                                            ('Goal Alert', 'Emergency Fund 100%', TRUE, 5); -- Ethan


-- Insert AI Messages
INSERT INTO aimsg ("timestamp", actor, message_content, user_id) VALUES
                                                                     (CURRENT_TIMESTAMP - INTERVAL '2 minutes', 'user', 'How much did I spend on food this month?', 1),
                                                                     (CURRENT_TIMESTAMP - INTERVAL '1 minute', 'ai', 'You have spent $110.50 on food this month.', 1),
                                                                     (CURRENT_TIMESTAMP - INTERVAL '5 minutes', 'user', 'Am I saving enough for rent?', 3),
                                                                     (CURRENT_TIMESTAMP - INTERVAL '4 minutes', 'ai', 'Your rent budget is healthy this month.', 3);