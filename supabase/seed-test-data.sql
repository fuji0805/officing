-- Test Data Seed Script for Officing
-- This script creates test users and populates realistic test data
-- Run this AFTER schema.sql and master-data.sql have been executed
-- 
-- IMPORTANT: This script requires manual user creation in Supabase Auth
-- See instructions in the comments below

-- ============================================================================
-- INSTRUCTIONS FOR TEST USER CREATION
-- ============================================================================
-- 
-- Before running this script, create test users in Supabase Dashboard:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" and create the following test users:
--    - Email: test1@example.com (Password: TestUser123!)
--    - Email: test2@example.com (Password: TestUser123!)
--    - Email: test3@example.com (Password: TestUser123!)
-- 3. Copy the user IDs from the dashboard
-- 4. Replace the UUIDs in the variables below with the actual user IDs
-- 5. Run this script in the SQL Editor
--
-- Alternatively, use the setup script: supabase/setup-test-users.sh
-- ============================================================================

-- ============================================================================
-- TEST USER IDs (REPLACE THESE WITH ACTUAL USER IDs FROM SUPABASE AUTH)
-- ============================================================================

-- Test User 1: Active user with good progress
-- Replace with actual UUID from Supabase Auth
DO $$
DECLARE
    test_user_1 UUID := '00000000-0000-0000-0000-000000000001'; -- REPLACE THIS
    test_user_2 UUID := '00000000-0000-0000-0000-000000000002'; -- REPLACE THIS
    test_user_3 UUID := '00000000-0000-0000-0000-000000000003'; -- REPLACE THIS
    
    -- Title IDs (will be fetched from titles table)
    title_3day UUID;
    title_7day UUID;
    title_beginner UUID;
    title_amateur UUID;
    title_level5 UUID;
    title_quest_hunter UUID;
    
    -- Quest IDs (will be fetched from quests table)
    quest_today UUID;
    quest_morning UUID;
    quest_lottery UUID;
    
    -- Prize IDs (will be fetched from prizes table)
    prize_points_200 UUID;
    prize_points_500 UUID;
    prize_cafe UUID;
BEGIN
    -- Fetch title IDs
    SELECT id INTO title_3day FROM titles WHERE name = '3日坊主克服' LIMIT 1;
    SELECT id INTO title_7day FROM titles WHERE name = '一週間の戦士' LIMIT 1;
    SELECT id INTO title_beginner FROM titles WHERE name = '出社ビギナー' LIMIT 1;
    SELECT id INTO title_amateur FROM titles WHERE name = '出社アマチュア' LIMIT 1;
    SELECT id INTO title_level5 FROM titles WHERE name = 'レベル5達成' LIMIT 1;
    SELECT id INTO title_quest_hunter FROM titles WHERE name = 'クエストハンター' LIMIT 1;
    
    -- Fetch quest IDs
    SELECT id INTO quest_today FROM quests WHERE title = '今日の出社' LIMIT 1;
    SELECT id INTO quest_morning FROM quests WHERE title = '定時出社' LIMIT 1;
    SELECT id INTO quest_lottery FROM quests WHERE title = 'くじ挑戦' LIMIT 1;
    
    -- Fetch prize IDs
    SELECT id INTO prize_points_200 FROM prizes WHERE name = 'ボーナスポイント（小）' LIMIT 1;
    SELECT id INTO prize_points_500 FROM prizes WHERE name = 'ボーナスポイント（中）' LIMIT 1;
    SELECT id INTO prize_cafe FROM prizes WHERE name = 'カフェチケット' LIMIT 1;

    -- ========================================================================
    -- TEST USER 1: Active User (30 days of history, level 8, good streak)
    -- ========================================================================
    
    RAISE NOTICE 'Creating data for Test User 1 (Active User)...';
    
    -- User Progress
    INSERT INTO user_progress (user_id, level, current_xp, total_points, current_streak, max_streak, active_title_id, pity_counter)
    VALUES (test_user_1, 8, 450, 3500, 7, 14, title_7day, 12);
    
    -- Lottery Tickets
    INSERT INTO lottery_tickets (user_id, ticket_count, earned_from)
    VALUES (test_user_1, 3, 'monthly_checkins');
    
    -- Attendances (Last 30 days with some gaps)
    -- Week 1: Perfect attendance (7 days)
    INSERT INTO attendances (user_id, check_in_date, check_in_time, tag, month, year)
    SELECT 
        test_user_1,
        CURRENT_DATE - (i || ' days')::INTERVAL,
        (CURRENT_DATE - (i || ' days')::INTERVAL) + '09:00:00'::TIME,
        CASE (i % 3)
            WHEN 0 THEN 'officeA'
            WHEN 1 THEN 'home'
            ELSE 'meetingRoom'
        END,
        EXTRACT(MONTH FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER
    FROM generate_series(0, 6) AS i;
    
    -- Week 2: Missed 2 days (days 8 and 10)
    INSERT INTO attendances (user_id, check_in_date, check_in_time, tag, month, year)
    SELECT 
        test_user_1,
        CURRENT_DATE - (i || ' days')::INTERVAL,
        (CURRENT_DATE - (i || ' days')::INTERVAL) + '08:30:00'::TIME,
        'officeA',
        EXTRACT(MONTH FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER
    FROM generate_series(7, 13) AS i
    WHERE i NOT IN (8, 10);
    
    -- Week 3-4: Sporadic attendance
    INSERT INTO attendances (user_id, check_in_date, check_in_time, tag, month, year)
    SELECT 
        test_user_1,
        CURRENT_DATE - (i || ' days')::INTERVAL,
        (CURRENT_DATE - (i || ' days')::INTERVAL) + '09:15:00'::TIME,
        CASE (i % 2) WHEN 0 THEN 'home' ELSE 'officeA' END,
        EXTRACT(MONTH FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER
    FROM generate_series(14, 29) AS i
    WHERE i % 3 != 0; -- Skip every 3rd day
    
    -- Unlocked Titles
    INSERT INTO user_titles (user_id, title_id, unlocked_at)
    VALUES 
        (test_user_1, title_3day, CURRENT_TIMESTAMP - INTERVAL '20 days'),
        (test_user_1, title_7day, CURRENT_TIMESTAMP - INTERVAL '10 days'),
        (test_user_1, title_beginner, CURRENT_TIMESTAMP - INTERVAL '15 days'),
        (test_user_1, title_level5, CURRENT_TIMESTAMP - INTERVAL '5 days');
    
    -- Quest Logs (Completed quests)
    INSERT INTO user_quest_logs (user_id, quest_id, assigned_date, completed_at, xp_earned, points_earned)
    SELECT 
        test_user_1,
        quest_today,
        CURRENT_DATE - (i || ' days')::INTERVAL,
        (CURRENT_DATE - (i || ' days')::INTERVAL) + '10:00:00'::TIME,
        50,
        50
    FROM generate_series(0, 9) AS i;
    
    INSERT INTO user_quest_logs (user_id, quest_id, assigned_date, completed_at, xp_earned, points_earned)
    VALUES 
        (test_user_1, quest_morning, CURRENT_DATE, CURRENT_TIMESTAMP, 150, 100),
        (test_user_1, quest_lottery, CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', 100, 80);
    
    -- Lottery Log (Some lottery draws)
    INSERT INTO lottery_log (user_id, prize_id, rank, pity_counter_at_draw, drawn_at)
    VALUES 
        (test_user_1, prize_points_200, 'C', 5, CURRENT_TIMESTAMP - INTERVAL '5 days'),
        (test_user_1, prize_points_500, 'B', 8, CURRENT_TIMESTAMP - INTERVAL '3 days'),
        (test_user_1, prize_points_200, 'C', 12, CURRENT_TIMESTAMP - INTERVAL '1 day');

    -- ========================================================================
    -- TEST USER 2: New User (Just started, minimal progress)
    -- ========================================================================
    
    RAISE NOTICE 'Creating data for Test User 2 (New User)...';
    
    -- User Progress
    INSERT INTO user_progress (user_id, level, current_xp, total_points, current_streak, max_streak, active_title_id, pity_counter)
    VALUES (test_user_2, 2, 80, 250, 2, 3, title_3day, 0);
    
    -- Lottery Tickets
    INSERT INTO lottery_tickets (user_id, ticket_count, earned_from)
    VALUES (test_user_2, 0, 'initial');
    
    -- Attendances (Only last 3 days)
    INSERT INTO attendances (user_id, check_in_date, check_in_time, tag, month, year)
    SELECT 
        test_user_2,
        CURRENT_DATE - (i || ' days')::INTERVAL,
        (CURRENT_DATE - (i || ' days')::INTERVAL) + '09:30:00'::TIME,
        'officeA',
        EXTRACT(MONTH FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER
    FROM generate_series(0, 2) AS i;
    
    -- Unlocked Titles (Just the first one)
    INSERT INTO user_titles (user_id, title_id, unlocked_at)
    VALUES (test_user_2, title_3day, CURRENT_TIMESTAMP);
    
    -- Quest Logs (Only a few completed)
    INSERT INTO user_quest_logs (user_id, quest_id, assigned_date, completed_at, xp_earned, points_earned)
    VALUES 
        (test_user_2, quest_today, CURRENT_DATE, CURRENT_TIMESTAMP, 50, 50),
        (test_user_2, quest_today, CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', 50, 50);

    -- ========================================================================
    -- TEST USER 3: Power User (High level, many achievements)
    -- ========================================================================
    
    RAISE NOTICE 'Creating data for Test User 3 (Power User)...';
    
    -- User Progress
    INSERT INTO user_progress (user_id, level, current_xp, total_points, current_streak, max_streak, active_title_id, pity_counter)
    VALUES (test_user_3, 15, 1200, 8500, 30, 45, title_amateur, 45);
    
    -- Lottery Tickets
    INSERT INTO lottery_tickets (user_id, ticket_count, earned_from)
    VALUES (test_user_3, 8, 'accumulated');
    
    -- Attendances (60 days of consistent attendance)
    INSERT INTO attendances (user_id, check_in_date, check_in_time, tag, month, year)
    SELECT 
        test_user_3,
        CURRENT_DATE - (i || ' days')::INTERVAL,
        (CURRENT_DATE - (i || ' days')::INTERVAL) + 
            (CASE 
                WHEN i % 7 = 0 THEN '07:00:00'::TIME  -- Early bird some days
                WHEN i % 7 = 6 THEN '10:00:00'::TIME  -- Late some days
                ELSE '08:45:00'::TIME                  -- Normal time
            END),
        CASE (i % 4)
            WHEN 0 THEN 'officeA'
            WHEN 1 THEN 'home'
            WHEN 2 THEN 'meetingRoom'
            ELSE 'cafe'
        END,
        EXTRACT(MONTH FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE - (i || ' days')::INTERVAL)::INTEGER
    FROM generate_series(0, 59) AS i;
    
    -- Unlocked Titles (Many achievements)
    INSERT INTO user_titles (user_id, title_id, unlocked_at)
    SELECT 
        test_user_3,
        id,
        CURRENT_TIMESTAMP - (random() * INTERVAL '30 days')
    FROM titles
    WHERE unlock_condition_type IN ('streak', 'attendance', 'level')
    LIMIT 10;
    
    -- Quest Logs (Many completed quests)
    INSERT INTO user_quest_logs (user_id, quest_id, assigned_date, completed_at, xp_earned, points_earned)
    SELECT 
        test_user_3,
        (SELECT id FROM quests WHERE quest_type = 'daily' ORDER BY random() LIMIT 1),
        CURRENT_DATE - (i || ' days')::INTERVAL,
        (CURRENT_DATE - (i || ' days')::INTERVAL) + '11:00:00'::TIME,
        (50 + (random() * 200)::INTEGER),
        (50 + (random() * 150)::INTEGER)
    FROM generate_series(0, 29) AS i;
    
    -- Lottery Log (Many lottery draws with varied results)
    INSERT INTO lottery_log (user_id, prize_id, rank, pity_counter_at_draw, drawn_at)
    SELECT 
        test_user_3,
        (SELECT id FROM prizes ORDER BY random() LIMIT 1),
        (ARRAY['C', 'C', 'C', 'B', 'B', 'A'])[floor(random() * 6 + 1)],
        floor(random() * 50)::INTEGER,
        CURRENT_TIMESTAMP - (random() * INTERVAL '30 days')
    FROM generate_series(1, 15);

    -- ========================================================================
    -- VERIFICATION
    -- ========================================================================
    
    RAISE NOTICE 'Test data creation complete!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Test User 1: Active user with 30 days history';
    RAISE NOTICE 'Test User 2: New user with minimal progress';
    RAISE NOTICE 'Test User 3: Power user with extensive history';
    RAISE NOTICE '';
    RAISE NOTICE 'Login credentials:';
    RAISE NOTICE '  test1@example.com / TestUser123!';
    RAISE NOTICE '  test2@example.com / TestUser123!';
    RAISE NOTICE '  test3@example.com / TestUser123!';
    
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show summary of test data
SELECT 
    'User Progress' as table_name,
    COUNT(*) as record_count
FROM user_progress
UNION ALL
SELECT 
    'Attendances' as table_name,
    COUNT(*) as record_count
FROM attendances
UNION ALL
SELECT 
    'User Titles' as table_name,
    COUNT(*) as record_count
FROM user_titles
UNION ALL
SELECT 
    'Quest Logs' as table_name,
    COUNT(*) as record_count
FROM user_quest_logs
UNION ALL
SELECT 
    'Lottery Log' as table_name,
    COUNT(*) as record_count
FROM lottery_log;

-- Show per-user statistics
SELECT 
    up.user_id,
    up.level,
    up.current_xp,
    up.total_points,
    up.current_streak,
    up.max_streak,
    COUNT(DISTINCT a.id) as total_checkins,
    COUNT(DISTINCT ut.id) as unlocked_titles,
    COUNT(DISTINCT uql.id) as completed_quests,
    COUNT(DISTINCT ll.id) as lottery_draws,
    lt.ticket_count
FROM user_progress up
LEFT JOIN attendances a ON a.user_id = up.user_id
LEFT JOIN user_titles ut ON ut.user_id = up.user_id
LEFT JOIN user_quest_logs uql ON uql.user_id = up.user_id AND uql.completed_at IS NOT NULL
LEFT JOIN lottery_log ll ON ll.user_id = up.user_id
LEFT JOIN lottery_tickets lt ON lt.user_id = up.user_id
GROUP BY up.user_id, up.level, up.current_xp, up.total_points, up.current_streak, up.max_streak, lt.ticket_count
ORDER BY up.level DESC;

-- Show recent check-ins per user
SELECT 
    user_id,
    COUNT(*) as checkins_last_7_days
FROM attendances
WHERE check_in_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id
ORDER BY checkins_last_7_days DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This script creates three test users with different profiles:
-- 
-- 1. Test User 1 (Active User):
--    - Level 8, moderate progress
--    - 30 days of attendance history with some gaps
--    - Current 7-day streak
--    - Several unlocked titles
--    - Some completed quests and lottery draws
--    - Good for testing normal user flows
-- 
-- 2. Test User 2 (New User):
--    - Level 2, just started
--    - Only 3 days of attendance
--    - Current 2-day streak
--    - One unlocked title
--    - Minimal quest completion
--    - Good for testing onboarding and early game
-- 
-- 3. Test User 3 (Power User):
--    - Level 15, advanced progress
--    - 60 days of consistent attendance
--    - Current 30-day streak
--    - Many unlocked titles
--    - Extensive quest completion and lottery history
--    - Good for testing advanced features and edge cases
-- 
-- ============================================================================
