# TypeScript Import Error Fix

## The Problem

You're seeing these errors:
- `Cannot find module '@/components/admin/backup/ExportButtons'`
- `Cannot find module '@/components/admin/backup/ProductBulkImport'`
- `Cannot find module '@/components/admin/backup/ImportHistoryTable'`
- `Cannot find module './RestoreDialog'`

**All files exist and imports are correct.** This is a TypeScript module resolution cache issue.

## The Solution

### ✅ Quick Fix (Recommended)

**Restart the TypeScript Server in VS Code:**

1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type: `TypeScript: Restart TS Server`
3. Press Enter
4. Wait a few seconds

The errors should disappear immediately!

### Alternative Fixes

If the quick fix doesn't work, try these in order:

**Option 2: Reload VS Code**
1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `Developer: Reload Window`
3. Press Enter

**Option 3: Clear Next.js Cache**
```powershell
# Stop dev server (Ctrl+C)
Remove-Item -Recurse -Force .next
npm run dev
```

**Option 4: Clear Everything**
```powershell
# Nuclear option - clears all caches
Remove-Item -Recurse -Force .next, node_modules
npm install
npm run dev
```

## Why This Happens

TypeScript in Next.js caches module resolution for performance. When new files are created (especially many at once like we did), the cache doesn't always update immediately. This is a known issue with Next.js + TypeScript.

## Verification

After restarting the TS server, these files will be found:
- ✅ `components/admin/backup/BackupHistoryTable.tsx`
- ✅ `components/admin/backup/ExportButtons.tsx`
- ✅ `components/admin/backup/ProductBulkImport.tsx`
- ✅ `components/admin/backup/ImportHistoryTable.tsx`
- ✅ `components/admin/backup/RestoreDialog.tsx`

All files exist and all imports are correct!
