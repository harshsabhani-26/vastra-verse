# Settings & Security System - Quick Start Guide

## 🎯 Overview

A comprehensive admin settings and security management system with:
- Store configuration
- Tax & GST settings
- Email & SMTP configuration
- System settings (maintenance mode, currency, timezone)
- Two-Factor Authentication (2FA)
- Password policies
- Account lockout protection
- Activity logging

---

## 🚀 Getting Started

### 1. Database Migration (REQUIRED FIRST)

**Option A: Using the migration script**
```bash
node scripts/migrate-settings.js
```

**Option B: Manual migration**
```bash
# Stop dev server completely
# Then run:
npm run db:push
npm run generate
```

**If you get file lock errors**:
1. Close VS Code completely
2. Kill all Node processes
3. Restart your computer (Windows file lock issue)
4. Try again

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Settings
Navigate to: `http://localhost:3001/admin/settings`

---

## 📋 Feature Guide

### Store Settings (`/admin/settings/store`)

Configure your store's basic information:
- **Store Name**: Display name for your store
- **Logo & Favicon**: Upload your branding
- **Contact Info**: Email, phone, full address
- **Business Registration**: GST, PAN, registration numbers
- **Social Media**: Facebook, Instagram, Twitter, YouTube links

### Tax Settings (`/admin/settings/tax`)

Manage GST and tax configuration:
- **Enable/Disable GST**: Toggle tax collection
- **GSTIN**: Your GST Identification Number (validated)
- **Tax Rates**: Configure CGST, SGST, IGST percentages
- **HSN Codes**: Default codes for products
- **Live Calculator**: Preview tax calculations

**GSTIN Format**: `22AAAAA0000A1Z5` (15 characters)

### System Settings (`/admin/settings/system`)

System-wide configuration:

**Maintenance Mode**:
- Quick toggle enable/disable
- Custom maintenance message
- Admin bypass (admins can still access)
- Visual indicator when active

**Currency & Localization**:
- Currency: INR, USD, EUR, GBP
- Symbol position (before/after)
- Decimal places (0 or 2)
- Timezone selection
- Date/time format preferences

**Security Settings**:
- Session timeout (5-480 minutes)
- Password minimum length (8-32 chars)
- Max login attempts (3-10)
- Lockout duration (5-1440 minutes)

### Activity Logs (`/admin/activity-logs`)

Monitor all admin actions:
- Filter by action type, status, date range
- View user, IP address, timestamp
- Color-coded status (success/failed/warning)
- Pagination (50 logs per page)
- Export to CSV (ready for implementation)

---

## 🔐 Security Features

### Two-Factor Authentication (2FA)

**Setup 2FA**:
```bash
POST /api/admin/security/2fa/setup
```

Response includes:
- QR code (scan with Google Authenticator/Authy)
- TOTP secret
- Backup codes (save these securely!)

**Verify & Enable**:
```bash
POST /api/admin/security/2fa/verify
Body: {
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"  # From authenticator app
}
```

**Disable 2FA**:
```bash
POST /api/admin/security/2fa/disable
Body: {
  "password": "your_password"
}
```

### Account Lockout

Automatic lockout after failed login attempts:
1. Failed attempts are tracked
2. After 5 attempts (configurable), account locks for 30 minutes
3. All attempts logged in activity logs
4. User sees lockout message with duration
5. Lockout auto-expires after duration

**Test it**:
- Try logging in with wrong password 5 times
- Account should lock
- Wait 30 minutes or unlock via admin

### Password Policies

Strong password enforcement:
- Minimum 12 characters (configurable)
- Requires: uppercase, lowercase, numbers, symbols
- Blocks common passwords
- Detects sequential/repeated characters
- Strength scoring: Weak → Medium → Strong → Very Strong

### Maintenance Mode

Enable site-wide maintenance:
1. Go to System Settings
2. Click "Enable" button in Maintenance Mode section
3. Edit custom message (optional)
4. Non-admin users see maintenance page
5. Admins can still access admin panel

**Quick Toggle**:
```bash
POST /api/admin/settings/system/toggle-maintenance
```

---

## 📚 API Reference

### Settings APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/settings/store` | GET | Get store settings |
| `/api/admin/settings/store` | PUT | Update store settings |
| `/api/admin/settings/tax` | GET | Get tax settings |
| `/api/admin/settings/tax` | PUT | Update tax settings |
| `/api/admin/settings/system` | GET | Get system settings |
| `/api/admin/settings/system` | PUT | Update system settings |
| `/api/admin/settings/system/toggle-maintenance` | POST | Toggle maintenance mode |

### Security APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/security/2fa/setup` | POST | Generate 2FA QR code |
| `/api/admin/security/2fa/verify` | POST | Verify & enable 2FA |
| `/api/admin/security/2fa/disable` | POST | Disable 2FA |
| `/api/admin/activity-logs` | GET | Get activity logs |

### Example: Update Store Settings
```javascript
const response = await fetch('/api/admin/settings/store', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storeName: 'My Saree Store',
    email: 'info@mysareestore.com',
    phone: '+91 98765 43210',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    zipCode: '400001'
  })
});
```

### Example: Enable 2FA
```javascript
// Step 1: Setup
const setup = await fetch('/api/admin/security/2fa/setup', {
  method: 'POST'
});
const { qrCode, secret, backupCodes } = await setup.json();
// Display QR code to user

// Step 2: Verify (user scans QR and enters code from app)
const verify = await fetch('/api/admin/security/2fa/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: secret,
    token: '123456' // From Google Authenticator
  })
});
```

---

## 🧪 Testing Checklist

### After Migration:

- [ ] Navigate to `/admin/settings`
- [ ] Configure store settings and save
- [ ] Set up tax settings with GSTIN
- [ ] Enable maintenance mode
  - [ ] Verify non-admin sees maintenance page
  - [ ] Verify admin can still access
  - [ ] Disable maintenance mode
- [ ] Setup 2FA on your account
  - [ ] Scan QR with Google Authenticator
  - [ ] Verify code works
  - [ ] Save backup codes
- [ ] Test account lockout
  - [ ] Create test user
  - [ ] Make 5 failed login attempts
  - [ ] Verify account locks for 30 minutes
- [ ] View activity logs
  - [ ] Filter by action type
  - [ ] Filter by date range
  - [ ] Verify all actions are logged

---

## 🐛 Troubleshooting

### Database Migration Fails
**Error**: `EPERM: operation not permitted`
**Solution**:
1. Stop all Node processes
2. Close VS Code
3. Run migration script again
4. If still fails, restart computer (Windows file lock)

### Settings Page Shows Loading Forever
**Cause**: Database not migrated
**Solution**: Run migration script first

### 2FA QR Code Not Displaying
**Cause**: `qrcode` package not installed
**Solution**: `npm install qrcode @types/qrcode`

### Activity Logs Empty
**Cause**: No actions logged yet
**Solution**: Perform some actions (login, update settings)

### Maintenance Mode Not Working
**Cause**: Middleware not configured or database not migrated
**Solution**:
1. Check `middleware.ts` exists in root
2. Restart dev server
3. Verify SystemSettings table exists

---

## 📊 Database Schema

### New Tables:
- `StoreSettings` - Store configuration
- `TaxSettings` - GST and tax settings
- `EmailSettings` - SMTP configuration
- `SystemSettings` - System-wide settings
- `ActivityLog` - Audit trail

### Enhanced Tables:
- `User` - Added 7 security fields
- `Session` - Added 3 tracking fields

---

## 🎯 Next Steps

1. **Configure Your Store**
   - Set store name and contact info
   - Upload logo and favicon
   - Add social media links

2. **Setup GST**
   - Enter your GSTIN
   - Configure tax rates
   - Set HSN codes

3. **Enable Security**
   - Setup 2FA on all admin accounts
   - Configure password policies
   - Review activity logs regularly

4. **Optional**
   - Configure email settings (when API is ready)
   - Create additional admin users
   - Set up session timeout

---

## 📝 Notes

- **TypeScript Errors**: May appear until database migration completes
- **File Locks**: Windows-specific issue with Prisma, restart if needed
- **2FA Backup Codes**: Save securely - needed if you lose your phone
- **Activity Logs**: Stored indefinitely - consider cleanup policy
- **Maintenance Mode**: Test before using in production

---

## 🆘 Support

For issues or questions:
1. Check TypeScript errors after migration
2. Review activity logs for failed actions
3. Test APIs directly using Postman/cURL
4. Check browser console for errors

---

**Built with**: Next.js, Prisma, NextAuth, TOTP (RFC 6238), bcryptjs, qrcode

**Version**: 1.0.0
**Status**: Production Ready (pending migration)
