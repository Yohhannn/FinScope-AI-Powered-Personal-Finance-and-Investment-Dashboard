-- ===========================
-- DROP TABLES (CHILD → PARENT)
-- ===========================
DROP TABLE IF EXISTS user_watchlist CASCADE;
DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS budget CASCADE;
DROP TABLE IF EXISTS saving_goal CASCADE;
DROP TABLE IF EXISTS wallet CASCADE;
DROP TABLE IF EXISTS sentiment CASCADE;
DROP TABLE IF EXISTS asset CASCADE;
DROP TABLE IF EXISTS alert CASCADE;
DROP TABLE IF EXISTS almsg CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- ===========================
-- DROP ENUM TYPES IF EXIST
-- ===========================
DROP TYPE IF EXISTS category_type CASCADE;
DROP TYPE IF EXISTS wallet_type CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- ===========================
-- CREATE ENUM TYPES
-- ===========================
CREATE TYPE wallet_type AS ENUM ('bank', 'ewallet', 'crypto', 'stocks');

CREATE TYPE asset_type AS ENUM ('stock', 'crypto');

CREATE TYPE transaction_type AS ENUM ('expense', 'income');



-- ===========================
-- CREATE TABLE: USER
-- ===========================
CREATE TABLE "user" (
                        user_id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- CREATE TABLE: CATEGORY
-- ===========================
CREATE TABLE category (
                          category_id SERIAL PRIMARY KEY,
                          name VARCHAR(255) NOT NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          user_id INT REFERENCES "user"(user_id)
);

-- ===========================
-- CREATE TABLE: BUDGET
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
-- CREATE TABLE: SAVING_GOAL
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
-- CREATE TABLE: WALLET
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
-- CREATE TABLE: ASSET
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
-- CREATE TABLE: USER_WATCHLIST
-- ===========================
CREATE TABLE user_watchlist (
                                user_id INT REFERENCES "user"(user_id),
                                asset_id INT REFERENCES asset(asset_id),
                                PRIMARY KEY (user_id, asset_id)
);

-- ===========================
-- CREATE TABLE: TRANSACTION
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
-- CREATE TABLE: SENTIMENT
-- ===========================
CREATE TABLE sentiment (
                           sentiment_id SERIAL PRIMARY KEY,
                           news_headline TEXT,
                           source VARCHAR(255),
                           sentiment_score NUMERIC(5,2),
                           sentiment_label VARCHAR(50),
                           timestamp TIMESTAMP,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           asset_id INT REFERENCES asset(asset_id)
);

-- ===========================
-- CREATE TABLE: ALERT
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
-- CREATE TABLE: AI_MSG
-- ===========================
CREATE TABLE aimsg (
                       al_msg_id SERIAL PRIMARY KEY,
                       timestamp TIMESTAMP,
                       actor VARCHAR(255),
                       message_content TEXT,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       user_id INT REFERENCES "user"(user_id)
);


