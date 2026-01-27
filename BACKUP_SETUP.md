# Backup & Data Management System - Setup Instructions

## Database Migration Required

The backup and data management system has been implemented, but you need to run a manual SQL migration to create the required database tables.

### Step 1: Run the SQL Migration

You have two options:

#### Option A: Using a Database Client (Recommended)

1. Open your PostgreSQL database client (pgAdmin, DBeaver, etc.)
2. Connect to your `silk_heritage` database
3. Open the file: `prisma/migrations/manual_backup_tables.sql`
4. Execute the SQL script

#### Option B: Using Command Line

```bash
# Connect to PostgreSQL
psql -U your_username -d silk_heritage

# Run the migration file
\i prisma/migrations/manual_backup_tables.sql

# Verify tables were created
\dt BackupLog
\dt DataImportLog
```

### Step 2: Verify the Migration

After running the migration, verify the tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('BackupLog', 'DataImportLog');
```

You should see both tables listed.

### Step 3: Create Backups Directory

The system stores backups in the `/backups` directory. Create it:

```bash
mkdir backups
```

### Step 4: Access the Backup Management Page

Navigate to: `/admin/backup`

You should see:
- **Backups tab**: Backup history and manual backup button
- **Import/Export tab**: CSV export buttons and product import

## Features Overview

### 1. Manual Backup
- Click "Create Manual Backup" button
- Backups are compressed JSON files containing all data
- Stored in `/backups` directory
- Includes all: users, products, orders, payments, refunds, coupons, etc.

### 2. Automatic Backup (For Production)
- Set up a cron job to hit: `POST /api/admin/backup/auto`
- Add `BACKUP_API_KEY` to your `.env` file
- Example cron: `0 2 * * * curl -X POST -H "x-api-key: YOUR_KEY" https://yourdomain.com/api/admin/backup/auto`

### 3. Restore Backup
- Click "Restore" icon on any completed backup
- **WARNING**: This replaces ALL current data
- Must type "RESTORE" to confirm
- Users will be logged out after restore

### 4. CSV Export
- Export products, customers, or orders as CSV
- Compatible with Excel and Google Sheets
- Uses UTF-8 encoding

### 5. Product Bulk Import
- Download the template first
- Fill in product data
- Upload CSV file
- System validates all rows before importing
- Shows detailed error messages for failed rows
- Can update existing products if SKU matches

## Configuration

### Backup Retention

Edit `lib/backup/backupService.ts` to change retention period:

```typescript
const RETENTION_DAYS = 30; // Keep backups for 30 days
```

### Automatic Cleanup

Old backups are automatically deleted when creating new backups.

### Security

- All endpoints require ADMIN role
- Automatic backup endpoint supports API key authentication
- File download has path traversal protection
- Restore requires explicit confirmation

## Troubleshooting

### "Backup directory not found"
- Create the `/backups` directory in your project root

### "Failed to create backup"
- Check database connection
- Ensure sufficient disk space
- Check permissions on `/backups` directory

### "Import failed"
- Download the template to see required format
- Check for missing required fields
- Verify category names exist in database
- Check CSV encoding (should be UTF-8)

### Tables don't exist error
- Run the SQL migration script (see Step 1)
- Restart your dev server after migration

## Next Steps

1. Run the SQL migration
2. Create a test backup
3. Test CSV export
4. Try product import with the template
5. Set up automatic backups for production (optional)

## Production Deployment Notes

**Important for Production:**

1. **Move backups to cloud storage**: The current implementation stores backups locally. For production, integrate with AWS S3, Google Cloud Storage, or similar.

2. **Set up automatic backups**: Use a cron service (Vercel Cron, AWS EventBridge, etc.) to trigger automatic backups daily.

3. **Add `BACKUP_API_KEY` to environment variables**: For automatic backup authentication.

4. **Monitor backup size**: Large databases may need chunked backups or differential backups.

5. **Test restore process**: Regularly test that backups can be restored successfully.
