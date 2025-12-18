# Troubleshooting Guide

## Issue: Internal Server Error (500)

### Problem
The Next.js development server was showing "Internal Server Error" when accessing http://localhost:3000

### Root Cause
The dev server had cached a compilation error from previous changes. This can happen when:
- TypeScript errors exist during hot reload
- Component imports fail
- Build cache becomes corrupted

### Solution 
**Restart the Next.js development server:**

```bash
# Stop the current dev server (Ctrl+C or kill the process)
# Then restart it:
cd ai-mock-web
npm run dev
```

### Verification
After restarting, verify both servers are running:

```bash
# Check if ports are in use
lsof -i :3000 -i :8000

# Test frontend
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK

# Test backend
curl -I http://localhost:8000/docs
# Should return: HTTP/1.1 200 OK
```

## Current Status ✅

Both servers are now running successfully:
- **Frontend**: http://localhost:3000 (Status: 200 OK)
- **Backend**: http://localhost:8000 (Status: Running)

## Common Issues & Solutions

### 1. Port Already in Use
**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### 2. Module Not Found Errors
**Error**: `Module not found: Can't resolve '@/components/...'`

**Solution**:
```bash
# Clear Next.js cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### 3. TypeScript Errors
**Error**: Build fails with TypeScript errors

**Solution**:
```bash
# Check for errors
npm run build

# Fix TypeScript issues in the reported files
# Common fixes:
# - Add missing types
# - Fix import paths
# - Add eslint-disable comments for intentional patterns
```

### 4. Backend Not Responding
**Error**: Cannot connect to http://localhost:8000

**Solution**:
```bash
cd interview-backend

# Activate virtual environment
source venv/bin/activate

# Restart the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Camera Permission Issues
**Error**: "Camera access denied" in UserVideoFeed component

**Solution**:
- Grant camera permissions in browser settings
- Check System Preferences > Security & Privacy > Camera
- Try a different browser if issues persist
- Camera can be toggled off if not needed

## Development Tips

### Hot Reload Issues
If changes aren't reflecting:
1. Save the file (Cmd+S / Ctrl+S)
2. Wait for compilation message in terminal
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
4. If still not working, restart dev server

### Checking Logs
**Frontend logs**:
- Terminal where `npm run dev` is running
- Browser console (F12 > Console tab)

**Backend logs**:
- Terminal where `uvicorn` is running
- Check for Python errors/stack traces

### Clean Restart
If all else fails, do a complete restart:

```bash
# Stop all servers (Ctrl+C in each terminal)

# Frontend
cd ai-mock-web
rm -rf .next
npm run dev

# Backend (in new terminal)
cd interview-backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Need More Help?

1. **Check browser console** (F12) for JavaScript errors
2. **Check terminal output** for compilation errors
3. **Verify environment variables** are set correctly
4. **Check file permissions** if getting access errors
5. **Review recent changes** that might have introduced the issue

---

**Last Updated**: Oct 21, 2025
**Status**: ✅ All systems operational
