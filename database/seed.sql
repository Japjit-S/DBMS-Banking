-- ============================================================================
-- Banking Management System - Seed Data (DML)
-- Target DBMS: MySQL 8.x
-- Database Name: banking_management_system
-- ============================================================================

USE banking_management_system;

-- Disable foreign key checks temporarily for clean re-population
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM Transfer;
DELETE FROM BankTransaction;
DELETE FROM Account;
DELETE FROM Customer;
DELETE FROM Branch;

ALTER TABLE Transfer AUTO_INCREMENT = 1;
ALTER TABLE BankTransaction AUTO_INCREMENT = 1;
ALTER TABLE Account AUTO_INCREMENT = 1;
ALTER TABLE Customer AUTO_INCREMENT = 1;
ALTER TABLE Branch AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Branches (5 Records)
-- ----------------------------------------------------------------------------
INSERT INTO Branch (branch_id, branch_name, IFSC_code, address) VALUES
(1, 'Hyderabad Main Branch', 'SBIN0001234', 'Road No 12, Banjara Hills, Hyderabad, Telangana'),
(2, 'Hitec City Tech Branch', 'HDFC0004567', 'Cyber Towers Quad, Madhapur, Hyderabad, Telangana'),
(3, 'Bangalore Central Branch', 'ICIC0007890', '100ft Road, Indiranagar, Bengaluru, Karnataka'),
(4, 'Mumbai Nariman Point Branch', 'KKBK0002468', 'Maker Chambers, Nariman Point, Mumbai, Maharashtra'),
(5, 'New Delhi Connaught Place', 'PUNB0001357', 'Inner Circle, Connaught Place, New Delhi');

-- ----------------------------------------------------------------------------
-- 2. Customers (8 Records)
-- ----------------------------------------------------------------------------
INSERT INTO Customer (customer_id, name, email, phone, address, date_of_birth) VALUES
(1, 'Rajesh Sharma', 'rajesh.sharma@example.com', '+91 98765 43210', 'Plot 42, Jubilee Hills, Hyderabad', '1988-04-12'),
(2, 'Priya Patel', 'priya.patel@example.com', '+91 98234 56789', 'Flat 302, Palm Heights, Bengaluru', '1992-09-25'),
(3, 'Japjit Singh', 'japjit.singh@example.com', '+91 99887 76655', 'B-12 Defence Colony, New Delhi', '2003-06-15'),
(4, 'Ananya Sen', 'ananya.sen@example.com', '+91 97112 34567', '14 Ballygunge Circular Rd, Kolkata', '1995-11-03'),
(5, 'Rohan Verma', 'rohan.verma@example.com', '+91 98450 12345', '5th Main, Koramangala, Bengaluru', '1990-01-20'),
(6, 'Sneha Reddy', 'sneha.reddy@example.com', '+91 96321 85296', 'Street 3, Gachibowli, Hyderabad', '1998-07-14'),
(7, 'Vikram Malhotra', 'vikram.malhotra@example.com', '+91 98111 22334', 'C-8 Marine Drive, Mumbai', '1985-12-08'),
(8, 'Kavita Iyer', 'kavita.iyer@example.com', '+91 94440 98765', 'T-Nagar 4th Street, Chennai', '1994-03-30');

-- ----------------------------------------------------------------------------
-- 3. Accounts (9 Records: 8 Active, 1 Closed with 0 balance)
-- ----------------------------------------------------------------------------
INSERT INTO Account (account_id, customer_id, branch_id, account_number, account_type, balance, status, opening_date) VALUES
(1, 1, 1, 'ACC-1001001', 'Savings', 145000.00, 'Active', '2025-01-15'),
(2, 1, 2, 'ACC-1001002', 'Current', 520000.00, 'Active', '2025-02-01'),
(3, 2, 3, 'ACC-1001003', 'Savings',  89450.50, 'Active', '2025-02-20'),
(4, 3, 5, 'ACC-1001004', 'Savings', 312000.00, 'Active', '2025-03-05'),
(5, 4, 1, 'ACC-1001005', 'Savings',  45200.00, 'Active', '2025-03-25'),
(6, 5, 3, 'ACC-1001006', 'Current',  18500.00, 'Active', '2025-04-10'),
(7, 6, 2, 'ACC-1001007', 'Savings', 234000.00, 'Active', '2025-05-15'),
(8, 7, 4, 'ACC-1001008', 'Current', 890000.00, 'Active', '2025-06-05'),
(9, 8, 1, 'ACC-1001009', 'Savings',      0.00, 'Closed', '2025-07-20');

-- ----------------------------------------------------------------------------
-- 4. Bank Transactions (8 Records: 6 Deposits, 2 Withdrawals)
-- ----------------------------------------------------------------------------
INSERT INTO BankTransaction (transaction_id, account_id, transaction_type, amount, transaction_date, description) VALUES
(1, 1, 'Deposit',     50000.00, '2026-10-20 10:15:00', 'Initial branch cash deposit'),
(2, 2, 'Deposit',    200000.00, '2026-10-21 11:30:00', 'Vendor payment invoice #904'),
(3, 4, 'Deposit',     75000.00, '2026-10-22 09:45:00', 'Consultancy honorarium credit'),
(4, 1, 'Withdrawal',  15000.00, '2026-10-23 14:20:00', 'ATM Cash Withdrawal'),
(5, 3, 'Deposit',     30000.00, '2026-10-24 16:00:00', 'Monthly salary dividend'),
(6, 7, 'Deposit',    100000.00, '2026-10-25 13:10:00', 'Term deposit maturity credit'),
(7, 4, 'Withdrawal',  25000.00, '2026-10-26 17:40:00', 'Hardware equipment expense'),
(8, 8, 'Deposit',    250000.00, '2026-10-27 10:05:00', 'Commercial contract disbursement');

-- ----------------------------------------------------------------------------
-- 5. Transfers (2 Records: Both Completed)
-- ----------------------------------------------------------------------------
INSERT INTO Transfer (transfer_id, from_account_id, to_account_id, amount, transfer_date, status, description) VALUES
(1, 2, 1, 25000.00, '2026-10-26 11:00:00', 'Completed', 'Inter-account personal reserve rebalance'),
(2, 4, 3, 12000.00, '2026-10-27 14:30:00', 'Completed', 'DBMS research lab fee settlement');
