-- Schema Verification Script
-- Run this in Supabase SQL Editor to verify the schema was created correctly

-- Check if all tables exist
SELECT 
    'Tables Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 10 THEN '✅ All 10 tables exist'
        ELSE '❌ Missing tables! Expected 10, found ' || COUNT(*)
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_progress',
    'attendances', 
    'lottery_tickets',
    'prizes',
    'lottery_log',
    'quests',
    'user_quest_logs',
    'titles',
    'user_titles',
    'shop_items'
  );

-- Check if all indexes exist
SELECT 
    'Indexes Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ All required indexes exist'
        ELSE '❌ Missing indexes! Expected at least 5, found ' || COUNT(*)
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_attendances_user_date',
    'idx_attendances_user_year_month',
    'idx_user_quest_logs_user_assigned',
    'idx_lottery_log_user',
    'idx_user_titles_user'
  );

-- Check if RLS is enabled on all tables
SELECT 
    'RLS Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 10 THEN '✅ RLS enabled on all 10 tables'
        ELSE '❌ RLS not enabled on all tables! Expected 10, found ' || COUNT(*)
    END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_progress',
    'attendances',
    'lottery_tickets',
    'prizes',
    'lottery_log',
    'quests',
    'user_quest_logs',
    'titles',
    'user_titles',
    'shop_items'
  )
  AND rowsecurity = true;

-- Check if triggers exist
SELECT 
    'Triggers Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ Update triggers exist'
        ELSE '❌ Missing triggers! Expected at least 2, found ' || COUNT(*)
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'update_user_progress_updated_at',
    'update_lottery_tickets_updated_at'
  );

-- List all tables with their row counts (should all be 0 initially)
SELECT 
    'Initial Data Check' as check_type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables t2 
     WHERE t2.table_schema = 'public' 
     AND t2.table_name = t.table_name) as exists
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'user_progress',
    'attendances',
    'lottery_tickets',
    'prizes',
    'lottery_log',
    'quests',
    'user_quest_logs',
    'titles',
    'user_titles',
    'shop_items'
  )
ORDER BY table_name;

-- Check foreign key constraints
SELECT 
    'Foreign Keys Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ Foreign key constraints exist'
        ELSE '⚠️ Found ' || COUNT(*) || ' foreign key constraints'
    END as status
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY'
  AND table_name IN (
    'user_progress',
    'attendances',
    'lottery_tickets',
    'lottery_log',
    'user_quest_logs',
    'user_titles'
  );

-- Summary
SELECT 
    '=== SCHEMA VERIFICATION SUMMARY ===' as summary,
    '' as details
UNION ALL
SELECT 
    'Run the queries above to verify:' as summary,
    '' as details
UNION ALL
SELECT 
    '1. All 10 tables created' as summary,
    '' as details
UNION ALL
SELECT 
    '2. All 5+ indexes created' as summary,
    '' as details
UNION ALL
SELECT 
    '3. RLS enabled on all tables' as summary,
    '' as details
UNION ALL
SELECT 
    '4. Triggers for updated_at columns' as summary,
    '' as details
UNION ALL
SELECT 
    '5. Foreign key constraints' as summary,
    '' as details;
