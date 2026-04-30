-- ========================================
-- H2 内嵌数据库初始化脚本
-- 自动创建表结构和初始数据
-- ========================================

CREATE TABLE IF NOT EXISTS raceuser (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    email VARCHAR(255),
    avatar VARCHAR(500),
    login_time TIMESTAMP,
    logout_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    count BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS session_table (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_key VARCHAR(255) UNIQUE,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    user_id VARCHAR(255),
    content TEXT,
    role VARCHAR(50),
    thread_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_link (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    user_id VARCHAR(255),
    image_url VARCHAR(500),
    prompt TEXT,
    thread_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_steps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    steps INT DEFAULT 0,
    step_date DATE,
    rank INT DEFAULT 0,
    thread_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_track (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    track_id VARCHAR(255),
    user_id VARCHAR(255),
    latitude DOUBLE,
    longitude DOUBLE,
    record_time TIMESTAMP,
    total_distance DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试用户
INSERT INTO raceuser (username, password, email) VALUES ('demo', '123456', 'demo@example.com');

SELECT '✅ H2 数据库初始化完成！' AS message;