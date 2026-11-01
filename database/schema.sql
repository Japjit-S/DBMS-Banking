-- ============================================================================
-- Banking Management System - Database Schema (DDL)
-- Target DBMS: MySQL 8.x
-- Database Name: banking_management_system
-- ============================================================================

-- Guard for clean recreation of the entire database
DROP DATABASE IF EXISTS banking_management_system;
CREATE DATABASE banking_management_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE banking_management_system;

-- Drop tables in reverse-dependency order for clean script re-executions
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Transfer;
DROP TABLE IF EXISTS BankTransaction;
DROP TABLE IF EXISTS Account;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Branch;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- Table 1: Branch
-- Stores physical and tech bank branch entities.
-- ----------------------------------------------------------------------------
CREATE TABLE Branch (
    branch_id INT AUTO_INCREMENT,
    branch_name VARCHAR(100) NOT NULL,
    IFSC_code VARCHAR(11) NOT NULL,
    address VARCHAR(255) NOT NULL,
    CONSTRAINT pk_branch PRIMARY KEY (branch_id),
    CONSTRAINT uq_branch_ifsc UNIQUE (IFSC_code)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Table 2: Customer
-- Stores customer personal identification and contact details.
-- ----------------------------------------------------------------------------
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    CONSTRAINT pk_customer PRIMARY KEY (customer_id),
    CONSTRAINT uq_customer_email UNIQUE (email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Table 3: Account
-- Financial account records tied to a Customer and a Branch.
-- Uses ON DELETE RESTRICT to safeguard ledger and referential integrity.
-- ----------------------------------------------------------------------------
CREATE TABLE Account (
    account_id INT AUTO_INCREMENT,
    customer_id INT NOT NULL,
    branch_id INT NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    opening_date DATE NOT NULL,
    CONSTRAINT pk_account PRIMARY KEY (account_id),
    CONSTRAINT uq_account_number UNIQUE (account_number),
    CONSTRAINT fk_account_customer FOREIGN KEY (customer_id)
        REFERENCES Customer(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_account_branch FOREIGN KEY (branch_id)
        REFERENCES Branch(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_account_type CHECK (account_type IN ('Savings', 'Current')),
    CONSTRAINT chk_account_status CHECK (status IN ('Active', 'Closed')),
    CONSTRAINT chk_account_balance CHECK (balance >= 0.00)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Table 4: BankTransaction
-- Deposits and withdrawals on accounts.
-- Uses ON DELETE RESTRICT to prevent deletion of ledger history.
-- ----------------------------------------------------------------------------
CREATE TABLE BankTransaction (
    transaction_id INT AUTO_INCREMENT,
    account_id INT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255) NOT NULL,
    CONSTRAINT pk_bank_transaction PRIMARY KEY (transaction_id),
    CONSTRAINT fk_transaction_account FOREIGN KEY (account_id)
        REFERENCES Account(account_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('Deposit', 'Withdrawal')),
    CONSTRAINT chk_transaction_amount CHECK (amount > 0.00)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Table 5: Transfer
-- Direct account-to-account funds transfers.
-- Uses ON DELETE RESTRICT on both source and destination account references.
-- ----------------------------------------------------------------------------
CREATE TABLE Transfer (
    transfer_id INT AUTO_INCREMENT,
    from_account_id INT NOT NULL,
    to_account_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transfer_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Completed',
    description VARCHAR(255) NOT NULL,
    CONSTRAINT pk_transfer PRIMARY KEY (transfer_id),
    CONSTRAINT fk_transfer_from_account FOREIGN KEY (from_account_id)
        REFERENCES Account(account_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_transfer_to_account FOREIGN KEY (to_account_id)
        REFERENCES Account(account_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_transfer_amount CHECK (amount > 0.00),
    CONSTRAINT chk_transfer_status CHECK (status IN ('Completed', 'Failed', 'Pending')),
    CONSTRAINT chk_transfer_distinct_accounts CHECK (from_account_id <> to_account_id)
) ENGINE=InnoDB;
