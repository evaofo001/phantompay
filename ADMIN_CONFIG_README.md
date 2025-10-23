# Admin Wallet Configuration

## Overview
The admin wallet system has been updated to use dynamic configuration instead of hardcoded values. This makes the system more flexible and easier to maintain.

## Changes Made

### 1. Dynamic Configuration System
- Created `src/config/adminConfig.ts` to centralize all admin-related configuration
- Replaced hardcoded admin emails, secret codes, and platform statistics
- Made revenue and expense types configurable

### 2. Updated Components
- **AdminContext**: Now uses dynamic configuration for admin authentication and validation
- **AdminDashboard**: Uses dynamic configuration for platform statistics and revenue/expense types
- **adminClaims**: Updated to use dynamic admin email checking

### 3. Environment Variables Support
The system now supports environment variables for configuration:

```bash
# Admin secret code for withdrawal/transfer operations
REACT_APP_ADMIN_SECRET_CODE=PHANTOM2024

# Admin email addresses (comma-separated)
REACT_APP_ADMIN_EMAILS=phantompaywallet@gmail.com
```

## Configuration Options

### Admin Authentication
- **Admin Emails**: List of email addresses with admin privileges
- **Secret Code**: Code required for admin withdrawal/transfer operations
- **Role Assignment**: Automatic role assignment based on email (super_admin vs admin)

### Platform Statistics
- **Withdrawal Destinations**: Mobile money accounts, bank accounts, card accounts
- **Pending Verifications**: Number of withdrawal methods awaiting verification
- **Default Values**: Initial platform statistics

### Revenue & Expense Types
- **Revenue Types**: Configurable transaction fees, subscriptions, etc.
- **Expense Types**: Configurable savings interest, reward points, etc.
- **Visual Configuration**: Colors and icons for each type

## Benefits

1. **Flexibility**: Easy to update admin emails, secret codes, and platform statistics
2. **Maintainability**: Centralized configuration makes changes easier
3. **Security**: Secret codes can be changed without code modifications
4. **Scalability**: New revenue/expense types can be added through configuration
5. **Environment Support**: Different configurations for development, staging, and production

## Usage

### Adding New Admin Users
1. Update the `REACT_APP_ADMIN_EMAILS` environment variable
2. Add the email to the comma-separated list (currently only one admin: phantompaywallet@gmail.com)
3. Restart the application

### Changing Admin Secret Code
1. Update the `REACT_APP_ADMIN_SECRET_CODE` environment variable
2. Restart the application

### Updating Platform Statistics
1. Modify the configuration in `src/config/adminConfig.ts`
2. Or update the environment variables for default values
3. The admin dashboard will reflect the changes

### Adding New Revenue/Expense Types
1. Update the `revenueTypes` or `expenseTypes` arrays in `adminConfig.ts`
2. Add the appropriate icon mapping
3. The admin dashboard will automatically display the new types

## Security Considerations

- Admin secret codes should be strong and regularly rotated
- Admin email lists should be carefully managed
- Environment variables should be properly secured in production
- Consider implementing server-side validation for admin operations

## Future Enhancements

- Database-driven configuration for real-time updates
- Admin interface for configuration management
- Audit logging for configuration changes
- Role-based configuration access
