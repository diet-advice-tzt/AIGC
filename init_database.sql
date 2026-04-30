-- =============================================
-- 数据库初始化脚本
-- 项目名称: Race Server
-- 创建日期: 2026-03-27
-- 数据库: sky_take_out
-- =============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `sky_take_out` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `sky_take_out`;

-- =============================================
-- 表1: raceuser (用户表)
-- =============================================
DROP TABLE IF EXISTS `raceuser`;
CREATE TABLE `raceuser` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱（选填）',
    `count` BIGINT DEFAULT 0 COMMENT '计数',
    `login_time` DATETIME DEFAULT NULL COMMENT '登录时间',
    `logout_time` DATETIME DEFAULT NULL COMMENT '登出时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `avatar_image_url` VARCHAR(500) DEFAULT NULL COMMENT '头像图片URL',
    `name` VARCHAR(50) DEFAULT NULL COMMENT '姓名',
    `session_id` VARCHAR(100) DEFAULT NULL COMMENT '会话ID',
    `image_url` VARCHAR(500) DEFAULT NULL COMMENT '图片URL',
    `weather_image_url` VARCHAR(500) DEFAULT NULL COMMENT '天气图片URL',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =============================================
-- 表2: session (会话表)
-- =============================================
DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    `user_id` VARCHAR(50) NOT NULL COMMENT '用户ID',
    `session_key` VARCHAR(100) NOT NULL COMMENT '会话密钥',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `thread_id` VARCHAR(100) DEFAULT NULL COMMENT '线程ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_session_key` (`session_key`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- =============================================
-- 表3: chatrecord (聊天记录表)
-- =============================================
DROP TABLE IF EXISTS `chatrecord`;
CREATE TABLE `chatrecord` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `content` TEXT NOT NULL COMMENT '聊天内容',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `session_id` VARCHAR(100) NOT NULL COMMENT '会话ID',
    `thread_id` VARCHAR(100) DEFAULT NULL COMMENT '线程ID',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_chatrecord_user` FOREIGN KEY (`user_id`) REFERENCES `raceuser` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天记录表';

-- =============================================
-- 表4: imagelink (图片链接表)
-- =============================================
DROP TABLE IF EXISTS `imagelink`;
CREATE TABLE `imagelink` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '图片ID',
    `image_url` VARCHAR(500) NOT NULL COMMENT '图片URL',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `session_id` VARCHAR(100) NOT NULL COMMENT '会话ID',
    `thread_id` VARCHAR(100) DEFAULT NULL COMMENT '线程ID',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_imagelink_user` FOREIGN KEY (`user_id`) REFERENCES `raceuser` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图片链接表';

-- =============================================
-- 表5: user_steps (用户步数表)
-- =============================================
DROP TABLE IF EXISTS `user_steps`;
CREATE TABLE `user_steps` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `step_date` DATETIME NOT NULL COMMENT '步数日期',
    `steps` INT DEFAULT 0 COMMENT '步数',
    `ai_evaluation` VARCHAR(500) DEFAULT NULL COMMENT 'AI评估',
    `rank` INT DEFAULT NULL COMMENT '排名',
    `thread_id` VARCHAR(100) DEFAULT NULL COMMENT '线程ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_date` (`user_id`, `step_date`),
    KEY `idx_step_date` (`step_date`),
    KEY `idx_rank` (`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户步数表';

-- =============================================
-- 表6: user_track (用户轨迹表)
-- =============================================
DROP TABLE IF EXISTS `user_track`;
CREATE TABLE `user_track` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '轨迹ID',
    `track_id` VARCHAR(100) NOT NULL COMMENT '轨迹ID',
    `latitude` DECIMAL(10, 6) NOT NULL COMMENT '纬度',
    `longitude` DECIMAL(10, 6) NOT NULL COMMENT '经度',
    `location` POINT DEFAULT NULL COMMENT '地理位置点',
    `record_time` DATETIME NOT NULL COMMENT '记录时间',
    `total_distance` INT DEFAULT 0 COMMENT '总距离(米)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `user_id` INT NOT NULL COMMENT '用户ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_track_id` (`track_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_record_time` (`record_time`),
    SPATIAL KEY `idx_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户轨迹表';

-- =============================================
-- 初始化数据（可选）
-- =============================================

-- 插入测试用户（密码需要加密）
-- INSERT INTO `raceuser` (`username`, `password`, `email`, `count`) VALUES 
-- ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'admin@example.com', 0);

-- =============================================
-- 索引优化说明
-- =============================================
-- 1. raceuser表: 为username和email创建唯一索引，login_time创建普通索引
-- 2. session表: 为session_key创建唯一索引，user_id和created_at创建普通索引
-- 3. chatrecord表: 为user_id、session_id和created_at创建索引，并设置外键约束
-- 4. imagelink表: 为user_id、session_id和created_at创建索引，并设置外键约束
-- 5. user_steps表: 为user_id和step_date创建联合唯一索引，step_date和rank创建普通索引
-- 6. user_track表: 为track_id创建唯一索引，user_id和record_time创建普通索引，location创建空间索引

-- =============================================
-- 注意事项
-- =============================================
-- 1. 本脚本使用MySQL 5.7+语法
-- 2. location字段使用POINT类型，支持空间索引和空间查询
-- 3. 所有表使用utf8mb4字符集，支持emoji和特殊字符
-- 4. 外键约束设置了级联删除，删除用户时会自动删除相关记录
-- 5. updated_at字段自动更新时间戳
-- 6. user_steps表的user_id和step_date联合唯一索引确保每天每个用户只有一条记录
