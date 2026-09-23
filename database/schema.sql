-- ==============================================================================
-- Support Ticket Management System - MySQL Database Schema
-- Assessment Source of Truth: Junior Full Stack Developer Technical Assessment
-- ==============================================================================

-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS support_ticket_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE support_ticket_db;

-- ------------------------------------------------------------------------------
-- Table Cleanup (Reverse order of foreign key dependencies)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores credentials, role ('customer' or 'agent'), and user metadata.
-- Passwords must ALWAYS be stored as secure cryptographic hashes (bcrypt).
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'agent') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TICKETS TABLE
-- Stores support tickets created by customers and managed by support agents.
-- 'assigned_to' is NULLABLE because tickets may initially be unassigned.
-- ------------------------------------------------------------------------------
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    assigned_to INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Referential Integrity Constraints
    CONSTRAINT fk_tickets_customer FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_assigned_agent FOREIGN KEY (assigned_to)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Indexes for frequently filtered, sorted, and joined columns
    INDEX idx_tickets_user_id (user_id),
    INDEX idx_tickets_assigned_to (assigned_to),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_priority (priority),
    INDEX idx_tickets_created_at (created_at),
    INDEX idx_tickets_status_priority (status, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TICKET COMMENTS TABLE
-- Stores conversational responses and updates posted on tickets by customers or agents.
-- ------------------------------------------------------------------------------
CREATE TABLE ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Referential Integrity Constraints
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Indexes for fast thread retrieval
    INDEX idx_comments_ticket_id (ticket_id),
    INDEX idx_comments_user_id (user_id),
    INDEX idx_comments_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
