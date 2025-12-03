# How to Run Tests - Officing

This guide explains how to execute all available tests for the Officing application.

## Prerequisites

### For Manual Testing
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (e.g., `python -m http.server`, Live Server, etc.)
- Supabase project set up with credentials

### For Edge Function Testing
- Supabase CLI installed
- Environment variables configured:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `ACCESS_TOKEN` or `USER_JWT`

## 1. Manual Testing (Demo HTML Files)

### Start Local Server

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Python 3
python3 -m http.server 8000

# Option 3: Node.js (if you have http-server installed)
npx http-server -p 8000

# Option 4: PHP
php -S localhost:8000
```

### Access Demo Pages

Open your browser and navigate to:

#### Authentication Testing
```
http://localhost:8000/auth-demo.html
```
**Tests:**
- Magic Link authentication
- Google OAuth (if configured)
- Session management
- Logout functionality

#### PWA Functionality Testing
```
http://localhost:8000/pwa-test.html
```
**Tests:**
- Service Worker registration
- Cache management
- Offline functionality
- Install prompt
- Network status
- Offline queue

#### Routing Testing
```
http://localhost:8000/routing-test.html
```
**Tests:**
- Client-side routing
- Navigation menu
- Browser back/forward
- Mobile menu
- Active link highlighting

#### Feature Testing
```
http://localhost:8000/dashboard-demo.html    # Dashboard
http://localhost:8000/lottery-demo.html      # Lottery system
http://localhost:8000/quest-demo.html        # Quest system
http://localhost:8000/shop-demo.html         # Shop functionality
http://localhost:8000/stamp-demo.html        # Stamp collection
http://localhost:8000/titles-demo.html       # Title system
http://localhost:8000/error-handling-demo.html  # Error handling
http://localhost:8000/qr-generator-test.html    # QR generator
http://localhost:8000/ui-test.html           # UI components
```

## 2. Edge Function Testing

### Setup Environment Variables

```bash
# Set your Supabase credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Get an access token by authenticating a user
# You can get this from the Supabase dashboard or by logging in
export ACCESS_TOKEN="your-user-access-token"
```

### Test Check-in Function

```bash
cd supabase/functions/checkin
chmod +x test.sh
./test.sh local    # For local testing
# or
./test.sh production  # For production testing
```

**Expected Results:**
- ✅ Test 1: Check-in with default tag succeeds
- ✅ Test 2: Check-in with custom tag succeeds
- ❌ Test 3: Duplicate check-in fails (expected)

### Test Lottery Draw Function

```bash
cd supabase/functions/lottery-draw
chmod +x test.sh
./test.sh
```

**Expected Results:**
- ✅ Test 1: Lottery draw succeeds with valid ticket
- Prize details displayed (name, rank, pity counter)
- Ticket count decremented

### Test Quest Complete Function

```bash
cd supabase/functions/quest-complete
chmod +x test.sh

# Note: You need to update the QUEST_LOG_ID in the script
# Get a valid quest log ID from your database first
./test.sh
```

**Expected Results:**
- ✅ Test 1: Quest completion succeeds
- ✅ Test 2: Duplicate completion rejected
- ✅ Test 3: Missing quest log ID rejected
- ✅ Test 4: Unauthorized request rejected

## 3. Database Validation

### Verify Schema

```bash
# Connect to your Supabase project
supabase db reset

# Or run the schema manually
psql $DATABASE_URL < supabase/schema.sql
```

### Insert Master Data

```bash
# Option 1: Using the setup script
cd supabase
node setup-master-data.js

# Option 2: Using SQL directly
psql $DATABASE_URL < supabase/master-data.sql
```

### Verify Test Data

```bash
# Insert test data
psql $DATABASE_URL < supabase/seed-test-data.sql

# Verify data
psql $DATABASE_URL < supabase/verify-test-data.sql
```

## 4. Code Quality Checks

### Validate Demo Files

```bash
chmod +x validate-demo-files.sh
./validate-demo-files.sh
```

**Expected Output:**
```
✅ Passed: 13
⚠️  Warnings: 1 (checkin-test.html is empty)
❌ Failed: 0
```

### Check JavaScript Syntax

If you have Node.js installed:

```bash
# Install a linter (optional)
npm install -g eslint

# Check syntax
node --check js/*.js
```

## 5. End-to-End Testing

### Complete User Flow Test

1. **Setup**
   ```bash
   # Start local server
   python -m http.server 8000
   
   # Open browser
   open http://localhost:8000
   ```

2. **Authentication**
   - Navigate to the app
   - Authenticate with Magic Link or Google
   - Verify session is created

3. **Check-in Flow**
   - Generate QR code at `/qr-generator.html`
   - Scan or open QR URL
   - Verify success screen appears
   - Check stamp in collection

4. **Quest Completion**
   - View daily quests
   - Complete a quest
   - Verify XP and points awarded
   - Check for level-up

5. **Lottery Draw**
   - Verify ticket count
   - Draw lottery
   - Verify prize received
   - Check ticket decremented

6. **Shop Purchase**
   - View shop items
   - Purchase an item
   - Verify points deducted
   - Verify item received

7. **Offline Testing**
   - Open DevTools Network tab
   - Set to "Offline"
   - Attempt check-in
   - Verify queued
   - Set to "Online"
   - Verify synchronized

## 6. Performance Testing

### Service Worker Cache

```javascript
// Open browser console on any page
// Check cache status
caches.keys().then(keys => console.log('Cache keys:', keys));

// Check cached files
caches.open('officing-v1').then(cache => 
  cache.keys().then(keys => console.log('Cached files:', keys.length))
);
```

### Network Performance

```javascript
// Check API response times
console.time('checkin');
fetch('/functions/v1/checkin', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({ tag: 'office' })
}).then(() => console.timeEnd('checkin'));
```

## 7. Browser Compatibility Testing

Test on multiple browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Key Features to Test
- Service Worker support
- IndexedDB (offline queue)
- Web App Manifest
- Push notifications (if implemented)
- Geolocation (if implemented)

## 8. Accessibility Testing

### Manual Checks
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader compatibility
- Color contrast
- Focus indicators
- ARIA labels

### Automated Tools
```bash
# Install axe-core (optional)
npm install -g @axe-core/cli

# Run accessibility audit
axe http://localhost:8000
```

## Test Results Checklist

Use this checklist to track your testing progress:

### Code Quality
- [x] JavaScript files validated (0 errors)
- [x] TypeScript files validated (0 errors)
- [x] Demo files validated (13/14 OK)

### Manual Testing
- [ ] Authentication flow tested
- [ ] Check-in flow tested
- [ ] Lottery system tested
- [ ] Quest system tested
- [ ] Shop system tested
- [ ] PWA functionality tested
- [ ] Routing tested
- [ ] Offline functionality tested

### Edge Function Testing
- [ ] Check-in function tested
- [ ] Lottery draw function tested
- [ ] Quest complete function tested

### Database Testing
- [ ] Schema deployed
- [ ] Master data inserted
- [ ] Test data inserted
- [ ] RLS policies verified

### Browser Testing
- [ ] Chrome/Edge tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Mobile browsers tested

### Performance Testing
- [ ] Service Worker caching verified
- [ ] API response times acceptable
- [ ] Offline queue working

## Troubleshooting

### Issue: Service Worker not registering
**Solution:** Check HTTPS or localhost, clear browser cache

### Issue: Edge Function tests fail with 401
**Solution:** Verify ACCESS_TOKEN is valid and not expired

### Issue: Database connection fails
**Solution:** Check SUPABASE_URL and credentials

### Issue: Offline queue not syncing
**Solution:** Check IndexedDB support and Service Worker status

### Issue: QR code not working
**Solution:** Verify URL format includes tag parameter

## Getting Help

If you encounter issues:

1. Check browser console for errors
2. Review `TEST_EXECUTION_REPORT.md` for known issues
3. Check Supabase dashboard for Edge Function logs
4. Review documentation in `/docs` folder

## Summary

This testing guide covers:
- ✅ Manual testing via demo HTML files
- ✅ Edge Function testing via shell scripts
- ✅ Database validation
- ✅ Code quality checks
- ✅ End-to-end user flows
- ✅ Performance testing
- ✅ Browser compatibility
- ✅ Accessibility testing

All tests should be executed before deploying to production.

---

**Last Updated:** 2024-12-02  
**Status:** Ready for Testing
