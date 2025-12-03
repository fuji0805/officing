-- Verification Script for Test Data
-- Run this to verify test data was created correctly

-- ============================================================================
-- TEST DATA SUMMARY
-- ============================================================================

SELECT '========================================' as info;
SELECT 'TEST DATA VERIFICATION' as info;
SELECT '========================================' as info;

-- Count test users
SELECT 
    '1. Test Users' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 3 users'
    END as status
FROM user_progress;

-- Check user progress data
SELECT 
    '2. User Progress Levels' as check_name,
    STRING_AGG(level::TEXT, ', ' ORDER BY level) as levels,
    CASE 
        WHEN COUNT(*) = 3 AND MIN(level) >= 2 AND MAX(level) >= 15 THEN '✅ PASS'
        ELSE '❌ FAIL - Check levels'
    END as status
FROM user_progress;

-- Check attendances
SELECT 
    '3. Total Check-ins' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 80 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected ~93 check-ins'
    END as status
FROM attendances;

-- Check titles unlocked
SELECT 
    '4. Unlocked Titles' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected ~15 titles'
    END as status
FROM user_titles;

-- Check quest logs
SELECT 
    '5. Completed Quests' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 40 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected ~44 quests'
    END as status
FROM user_quest_logs
WHERE completed_at IS NOT NULL;

-- Check lottery logs
SELECT 
    '6. Lottery Draws' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 15 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected ~18 draws'
    END as status
FROM lottery_log;

-- Check lottery tickets
SELECT 
    '7. Lottery Tickets' as check_name,
    SUM(ticket_count) as total_tickets,
    CASE 
        WHEN SUM(ticket_count) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected ~11 tickets'
    END as status
FROM lottery_tickets;

SELECT '========================================' as info;

-- ============================================================================
-- DETAILED USER STATISTICS
-- ============================================================================

SELECT '========================================' as info;
SELECT 'DETAILED USER STATISTICS' as info;
SELECT '========================================' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY up.level DESC) as user_num,
    up.level,
    up.current_xp as xp,
    up.total_points as points,
    up.current_streak as streak,
    up.max_streak,
    COUNT(DISTINCT a.id) as checkins,
    COUNT(DISTINCT ut.id) as titles,
    COUNT(DISTINCT uql.id) as quests,
    COUNT(DISTINCT ll.id) as lottery_draws,
    lt.ticket_count as tickets
FROM user_progress up
LEFT JOIN attendances a ON a.user_id = up.user_id
LEFT JOIN user_titles ut ON ut.user_id = up.user_id
LEFT JOIN user_quest_logs uql ON uql.user_id = up.user_id AND uql.completed_at IS NOT NULL
LEFT JOIN lottery_log ll ON ll.user_id = up.user_id
LEFT JOIN lottery_tickets lt ON lt.user_id = up.user_id
GROUP BY up.user_id, up.level, up.current_xp, up.total_points, up.current_streak, up.max_streak, lt.ticket_count
ORDER BY up.level DESC;

-- ============================================================================
-- RECENT ACTIVITY
-- ============================================================================

SELECT '========================================' as info;
SELECT 'RECENT CHECK-INS (Last 7 Days)' as info;
SELECT '========================================' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY up.level DESC) as user_num,
    up.level as user_level,
    COUNT(*) as checkins_last_7_days,
    MIN(a.check_in_date) as first_checkin,
    MAX(a.check_in_date) as last_checkin
FROM user_progress up
LEFT JOIN attendances a ON a.user_id = up.user_id 
    AND a.check_in_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY up.user_id, up.level
ORDER BY up.level DESC;

-- ============================================================================
-- EXPECTED VALUES
-- ============================================================================

SELECT '========================================' as info;
SELECT 'EXPECTED VALUES' as info;
SELECT '========================================' as info;

SELECT 
    'Test User 1 (Active)' as user_type,
    'Level 8, ~23 check-ins, 4 titles, 12 quests, 3 lottery draws' as expected_profile
UNION ALL
SELECT 
    'Test User 2 (New)' as user_type,
    'Level 2, 3 check-ins, 1 title, 2 quests, 0 lottery draws' as expected_profile
UNION ALL
SELECT 
    'Test User 3 (Power)' as user_type,
    'Level 15, 60 check-ins, 10 titles, 30 quests, 15 lottery draws' as expected_profile;

SELECT '========================================' as info;
SELECT 'VERIFICATION COMPLETE' as info;
SELECT '========================================' as info;

-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================

-- If verification fails, uncomment these queries to debug:

-- Check if users exist in auth.users (requires service role)
-- SELECT id, email, created_at FROM auth.users WHERE email LIKE 'test%@example.com';

-- Check for any errors in data
-- SELECT * FROM user_progress WHERE level < 1 OR current_xp < 0;

-- Check for missing foreign key relationships
-- SELECT * FROM user_progress WHERE active_title_id IS NOT NULL 
--   AND active_title_id NOT IN (SELECT id FROM titles);

-- Check attendance date ranges
-- SELECT 
--     user_id,
--     MIN(check_in_date) as first_checkin,
--     MAX(check_in_date) as last_checkin,
--     COUNT(*) as total_checkins
-- FROM attendances
-- GROUP BY user_id;
