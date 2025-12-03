# Lottery Draw Function - Deployment Guide

## Quick Start

### 1. Prerequisites

Ensure you have:
- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created
- Database schema deployed (run `supabase/schema.sql`)
- Sample data loaded (run `supabase/sample-data.sql`)

### 2. Deploy Function

```bash
# From project root
supabase functions deploy lottery-draw
```

Or deploy all functions:
```bash
cd supabase/functions
./deploy.sh
```

### 3. Verify Deployment

Check the Supabase Dashboard:
1. Go to Edge Functions section
2. Find `lottery-draw` function
3. Check deployment status
4. View logs for any errors

### 4. Test Function

#### Option A: Using Test Script

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export ACCESS_TOKEN="your-user-access-token"

# Run test
./supabase/functions/lottery-draw/test.sh
```

#### Option B: Using curl

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/lottery-draw" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

#### Option C: Using Frontend

The frontend `lottery.js` is already integrated. Just:
1. Navigate to the lottery page
2. Click "くじを引く" button
3. Verify the draw works

### 5. Monitor

Check logs in Supabase Dashboard:
- Edge Functions → lottery-draw → Logs
- Look for any errors or warnings
- Monitor response times

## Troubleshooting

### Error: "Unauthorized"

**Cause**: Invalid or missing authentication token

**Solution**: 
- Ensure user is logged in
- Check that `Authorization` header is set correctly
- Verify token hasn't expired

### Error: "Insufficient tickets"

**Cause**: User has no lottery tickets

**Solution**:
- User needs to check in 4, 8, or 12 times to earn tickets
- Or purchase tickets from the shop (when implemented)

### Error: "No available prizes"

**Cause**: All prizes are out of stock or unavailable

**Solution**:
- Check `prizes` table in database
- Ensure some prizes have `is_available = true`
- Ensure some prizes have `stock > 0` or `stock = null`
- Run sample data script to add prizes

### Function Not Found

**Cause**: Function not deployed or wrong URL

**Solution**:
- Verify deployment: `supabase functions list`
- Check function URL in Supabase Dashboard
- Ensure project is linked: `supabase link`

### Database Errors

**Cause**: Missing tables or RLS policies

**Solution**:
- Run schema: `psql -f supabase/schema.sql`
- Check RLS policies are enabled
- Verify user has proper permissions

## Configuration

### Pity System Threshold

To adjust the pity system threshold, edit `index.ts`:

```typescript
const PITY_THRESHOLD = 10 // Change this value
```

Default is 10 draws. After 10 consecutive B/C rank prizes, the next draw guarantees A or S rank.

### Prize Weights

Prize weights are stored in the database. To adjust:

```sql
UPDATE prizes 
SET weight = 5 
WHERE rank = 'S';
```

Higher weight = higher probability.

## Performance Tips

1. **Cache Prize Data**: Prize data changes infrequently, consider caching
2. **Index Optimization**: Ensure indexes exist on `user_id` columns
3. **Connection Pooling**: Supabase handles this automatically
4. **Monitor Response Times**: Check Edge Function logs

## Security Notes

1. **Authentication Required**: Function checks for valid user token
2. **RLS Policies**: All database operations respect Row Level Security
3. **Audit Trail**: All draws are logged in `lottery_log` table
4. **Rate Limiting**: Consider adding rate limiting if needed

## Next Steps

After deployment:

1. ✅ Test with real users
2. ✅ Monitor draw statistics
3. ✅ Adjust prize weights based on data
4. ✅ Add more prizes as needed
5. ✅ Consider adding analytics dashboard

## Support

For issues or questions:
- Check function logs in Supabase Dashboard
- Review `IMPLEMENTATION.md` for detailed documentation
- Check `supabase/functions/README.md` for general Edge Function info
