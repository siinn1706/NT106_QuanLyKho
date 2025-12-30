# Admin Account for Testing

## Default Admin Credentials

An admin account has been created for testing purposes:

- **Username:** `admin`
- **Email:** `admin@n3t.com`
- **Password:** `123456`
- **Passkey:** `123456`
- **Role:** `admin`

## How to Create Admin Account

If you need to recreate the admin account, run:

```bash
cd KhoHang_API
python seed_admin.py
```

The script will:
- Check if admin already exists
- If not, create a new admin user with the credentials above
- If yes, display existing admin info

## Database Location

The database is stored at:
- **Windows:** `C:\Users\<YourName>\AppData\Roaming\NT106_QuanLyKho\data.db`
- **macOS:** `~/Library/Application Support/NT106_QuanLyKho/data.db`
- **Linux:** `~/.local/share/NT106_QuanLyKho/data.db`

## Login to App

1. Start the backend: `cd KhoHang_API && python -m uvicorn app.main:app --reload`
2. Start the frontend: `cd UI_Desktop && npm run dev`
3. Open app and login with:
   - Username: `admin`
   - Password: `123456`

## Security Notes

⚠️ **IMPORTANT:** This is a test account with a weak password. 

**For production:**
1. Delete this account or change the password
2. Create proper admin accounts with strong passwords
3. Use environment variables for sensitive data
4. Enable 2FA if available
