-- ===========================

-- 1. DROP TABLES (CHILD → PARENT)

-- ===========================

-- Using CASCADE to handle dependencies automatically

DROP TABLE IF EXISTS user_watchlist CASCADE;

DROP TABLE IF EXISTS transaction CASCADE;

DROP TABLE IF EXISTS budget CASCADE;

DROP TABLE IF EXISTS saving_goal CASCADE;

DROP TABLE IF EXISTS wallet CASCADE;

DROP TABLE IF EXISTS sentiment CASCADE;

DROP TABLE IF EXISTS asset CASCADE;

DROP TABLE IF EXISTS alert CASCADE;

DROP TABLE IF EXISTS aimsg CASCADE; -- Renamed from almsg in your original

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

CREATE TYPE wallet_type AS ENUM ('bank', 'ewallet', 'crypto', 'stocks');

CREATE TYPE asset_type AS ENUM ('stock', 'crypto');

CREATE TYPE transaction_type AS ENUM ('expense', 'income');



-- ===========================

-- 4. CREATE TABLES

-- ===========================



-- ===========================

-- TABLE: USER

-- ===========================

CREATE TABLE "user" (

                        user_id SERIAL PRIMARY KEY,

                        name VARCHAR(255) NOT NULL,

                        email VARCHAR(255) UNIQUE NOT NULL,

                        password VARCHAR(255) NOT NULL,

                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



-- ===========================

-- TABLE: CATEGORY

-- ===========================

CREATE TABLE category (

                          category_id SERIAL PRIMARY KEY,

                          name VARCHAR(255) NOT NULL,

                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                          user_id INT REFERENCES "user"(user_id)

);



-- ===========================

-- TABLE: BUDGET

-- ===========================

CREATE TABLE budget (

                        budget_id SERIAL PRIMARY KEY,

                        limit_amount NUMERIC(12,2),

                        start_date DATE,

                        end_date DATE,

                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                        user_id INT REFERENCES "user"(user_id),

                        category_id INT REFERENCES category(category_id)

);



-- ===========================

-- TABLE: SAVING_GOAL

-- ===========================

CREATE TABLE saving_goal (

                             goal_id SERIAL PRIMARY KEY,

                             name VARCHAR(255) NOT NULL,

                             target_amount NUMERIC(12,2),

                             current_amount NUMERIC(12,2) DEFAULT 0,

                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                             user_id INT REFERENCES "user"(user_id)

);



-- ===========================

-- TABLE: WALLET

-- ===========================

CREATE TABLE wallet (

                        wallet_id SERIAL PRIMARY KEY,

                        name VARCHAR(255),

                        type wallet_type,

                        purpose VARCHAR(255),

                        balance NUMERIC(12,2) DEFAULT 0,

                        previous_balance NUMERIC(12,2) DEFAULT 0,

                        wallet_balance NUMERIC(12,2) DEFAULT 0,

                        user_id INT REFERENCES "user"(user_id)

);



-- ===========================

-- TABLE: ASSET

-- ===========================

CREATE TABLE asset (

                       asset_id SERIAL PRIMARY KEY,

                       symbol VARCHAR(50),

                       asset_name VARCHAR(255),

                       asset_type asset_type,

                       current_price NUMERIC(12,2),

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



-- ===========================

-- TABLE: USER_WATCHLIST

-- ===========================

CREATE TABLE user_watchlist (

                                user_id INT REFERENCES "user"(user_id),

                                asset_id INT REFERENCES asset(asset_id),

                                PRIMARY KEY (user_id, asset_id)

);



-- ===========================

-- TABLE: TRANSACTION

-- ===========================

CREATE TABLE transaction (

                             transaction_id SERIAL PRIMARY KEY,

                             name VARCHAR(255),

                             amount NUMERIC(12,2),

                             transaction_date DATE,

                             description TEXT,

                             type transaction_type,

                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                             wallet_id INT REFERENCES wallet(wallet_id),

                             category_id INT REFERENCES category(category_id)

);



-- ===========================

-- TABLE: SENTIMENT

-- ===========================

CREATE TABLE sentiment (

                           sentiment_id SERIAL PRIMARY KEY,

                           news_headline TEXT,

                           source VARCHAR(255),

                           sentiment_score NUMERIC(5,2),

                           sentiment_label VARCHAR(50),

                           "timestamp" TIMESTAMP,

                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                           asset_id INT REFERENCES asset(asset_id)

);



-- ===========================

-- TABLE: ALERT

-- ===========================

CREATE TABLE alert (

                       alert_id SERIAL PRIMARY KEY,

                       type VARCHAR(100),

                       condition TEXT,

                       is_active BOOLEAN DEFAULT TRUE,

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                       user_id INT REFERENCES "user"(user_id)

);



-- ===========================

-- TABLE: AI_MSG

-- ===========================

CREATE TABLE aimsg (

                       al_msg_id SERIAL PRIMARY KEY,

                       "timestamp" TIMESTAMP,

                       actor VARCHAR(255),

                       message_content TEXT,

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                       user_id INT REFERENCES "user"(user_id)

);



-- ==================================================

-- 5. INSERT SAMPLE DATA (PARENT TABLES FIRST)

-- ==================================================



-- Insert Users (user_id 1, 2)

INSERT INTO "user" (name, email, password) VALUES

                                               ('Alice Smith', 'alice@example.com', 'hashed_password_123'),

                                               ('Bob Johnson', 'bob@example.com', 'hashed_password_456');



-- Insert Assets (asset_id 1, 2, 3, 4)

INSERT INTO asset (symbol, asset_name, asset_type, current_price) VALUES

                                                                      ('AAPL', 'Apple Inc.', 'stock', 175.20),

                                                                      ('GOOGL', 'Alphabet Inc.', 'stock', 130.50),

                                                                      ('BTC', 'Bitcoin', 'crypto', 65000.00),

                                                                      ('ETH', 'Ethereum', 'crypto', 3500.00);



-- Insert Categories (category_id 1-6)

-- Assigning categories to specific users

INSERT INTO category (name, user_id) VALUES

                                         ('Food', 1),           -- category_id = 1 (Alice)

                                         ('Transport', 1),      -- category_id = 2 (Alice)

                                         ('Salary', 1),         -- category_id = 3 (Alice)

                                         ('Groceries', 2),      -- category_id = 4 (Bob)

                                         ('Utilities', 2),      -- category_id = 5 (Bob)

                                         ('Freelance', 2);      -- category_id = 6 (Bob)



-- Insert Wallets (wallet_id 1, 2, 3)

INSERT INTO wallet (name, type, purpose, balance, user_id) VALUES

                                                               ('Main Bank', 'bank', 'Daily expenses', 1500.00, 1),  -- wallet_id = 1 (Alice)

                                                               ('Crypto Wallet', 'crypto', 'Investments', 5000.00, 1), -- wallet_id = 2 (Alice)

                                                               ('E-Wallet', 'ewallet', 'Online shopping', 350.50, 2);   -- wallet_id = 3 (Bob)



-- Insert Saving Goals

INSERT INTO saving_goal (name, target_amount, current_amount, user_id) VALUES

                                                                           ('New Laptop', 1500.00, 300.00, 1),

                                                                           ('Vacation Fund', 1000.00, 150.00, 2);



-- Insert Alerts

INSERT INTO alert (type, condition, is_active, user_id) VALUES

                                                            ('Price Alert', 'BTC > 68000', TRUE, 1),

                                                            ('Budget Alert', 'Food category > 80%', TRUE, 1);



-- Insert AI Messages

INSERT INTO aimsg ("timestamp", actor, message_content, user_id) VALUES

                                                                     (CURRENT_TIMESTAMP - INTERVAL '2 minutes', 'user', 'How much did I spend on food this month?', 1),

                                                                     (CURRENT_TIMESTAMP - INTERVAL '1 minute', 'ai', 'You have spent $120.50 on food this month.', 1);



-- Insert into Watchlist (Junction Table)

INSERT INTO user_watchlist (user_id, asset_id) VALUES

                                                   (1, 1), -- Alice watches Apple (asset_id 1)

                                                   (1, 3), -- Alice watches Bitcoin (asset_id 3)

                                                   (2, 2), -- Bob watches Google (asset_id 2)

                                                   (2, 4); -- Bob watches Ethereum (asset_id 4)



-- Insert Sentiments

INSERT INTO sentiment (news_headline, source, sentiment_score, sentiment_label, "timestamp", asset_id) VALUES

                                                                                                           ('Apple announces new M5 chip, stock expected to rise', 'TechNews', 0.85, 'Positive', CURRENT_TIMESTAMP, 1),

                                                                                                           ('Bitcoin faces regulatory hurdles in new market', 'CryptoToday', -0.40, 'Negative', CURRENT_TIMESTAMP, 3);



-- Insert Budgets

INSERT INTO budget (limit_amount, start_date, end_date, user_id, category_id) VALUES

                                                                                  (500.00, '2025-11-01', '2025-11-30', 1, 1), -- Alice's food budget (category_id 1)

                                                                                  (150.00, '2025-11-01', '2025-11-30', 2, 5); -- Bob's utilities budget (category_id 5)



-- Insert Transactions

INSERT INTO transaction (name, amount, transaction_date, description, type, wallet_id, category_id) VALUES

                                                                                                        ('Monthly Salary', 2500.00, '2025-11-01', 'November salary', 'income', 1, 3), -- Alice income (wallet 1, category 3)

                                                                                                        ('Dinner at Cafe', 45.50, '2025-11-03', 'Dinner with friends', 'expense', 1, 1), -- Alice expense (wallet 1, category 1)

                                                                                                        ('Bus Ticket', 2.75, '2025-11-04', 'Commute to work', 'expense', 1, 2), -- Alice expense (wallet 1, category 2)

                                                                                                        ('Freelance Project Payment', 300.00, '2025-11-02', 'Web design work', 'income', 3, 6), -- Bob income (wallet 3, category 6)

                                                                                                        ('Weekly Groceries', 85.20, '2025-11-05', 'Grocery run', 'expense', 3, 4); -- Bob expense (wallet 3, category 4)