-- Sample Data for Officing
-- This script populates master data tables with sample data for testing
-- Run this AFTER schema.sql has been executed

-- ============================================================================
-- PRIZES (Lottery Prizes)
-- ============================================================================

INSERT INTO prizes (name, description, rank, weight, stock, reward_type, reward_value) VALUES
-- S Rank (Rarest - 5% total)
('プレミアムギフトカード', '10,000円分のギフトカード', 'S', 2, 5, 'item', '{"value": 10000, "type": "gift_card"}'),
('特別休暇チケット', '1日の特別休暇', 'S', 2, 10, 'item', '{"value": 1, "type": "special_leave"}'),
('レジェンド称号', '伝説の出社マスター称号', 'S', 1, NULL, 'title', '{"title_name": "伝説の出社マスター"}'),

-- A Rank (Rare - 15% total)
('高級ランチチケット', '5,000円分のランチチケット', 'A', 5, 20, 'item', '{"value": 5000, "type": "lunch_ticket"}'),
('ボーナスポイント', '1,000ポイント獲得', 'A', 8, NULL, 'points', '{"amount": 1000}'),
('レア称号', 'レアな称号をアンロック', 'A', 2, NULL, 'title', '{"title_name": "くじ運の持ち主"}'),

-- B Rank (Uncommon - 30% total)
('カフェチケット', '1,000円分のカフェチケット', 'B', 15, 50, 'item', '{"value": 1000, "type": "cafe_ticket"}'),
('ボーナスポイント', '500ポイント獲得', 'B', 10, NULL, 'points', '{"amount": 500}'),
('特別スタンプ', 'レアなスタンプデザイン', 'B', 5, NULL, 'stamp', '{"stamp_id": "rare_gold"}'),

-- C Rank (Common - 50% total)
('ボーナスポイント', '200ポイント獲得', 'C', 30, NULL, 'points', '{"amount": 200}'),
('ボーナスポイント', '100ポイント獲得', 'C', 15, NULL, 'points', '{"amount": 100}'),
('通常スタンプ', '特別なスタンプデザイン', 'C', 5, NULL, 'stamp', '{"stamp_id": "special_blue"}');

-- ============================================================================
-- QUESTS (Daily/Weekly/Flex Quests)
-- ============================================================================

-- Daily Quests (Pool of quests to randomly assign)
INSERT INTO quests (title, description, quest_type, rank, base_xp, base_points) VALUES
-- S Rank Daily
('完璧な一日', '今日中に3回チェックインする', 'daily', 'S', 500, 300),
('早起きチャンピオン', '午前7時前にチェックインする', 'daily', 'S', 400, 250),

-- A Rank Daily  
('連続出社', '3日連続でチェックインする', 'daily', 'A', 300, 200),
('場所マスター', '異なる2つのタグでチェックインする', 'daily', 'A', 250, 150),

-- B Rank Daily
('定時出社', '午前9時までにチェックインする', 'daily', 'B', 150, 100),
('くじチャレンジ', 'くじを1回引く', 'daily', 'B', 100, 80),

-- C Rank Daily
('今日の出社', '今日チェックインする', 'daily', 'C', 50, 50),
('プロフィール確認', 'プロフィール画面を開く', 'daily', 'C', 30, 30),
('スタンプ確認', 'スタンプ帳を開く', 'daily', 'C', 30, 30),

-- Weekly Quests
('週間戦士', '週に5回チェックインする', 'weekly', 'A', 800, 500),
('週間マスター', '週に7回チェックインする', 'weekly', 'S', 1500, 1000),

-- Flex Quests (Always available)
('初めてのチェックイン', '初回チェックインを完了する', 'flex', 'C', 100, 100),
('くじデビュー', '初めてくじを引く', 'flex', 'C', 100, 100),
('称号コレクター', '5つの称号をアンロックする', 'flex', 'B', 500, 300),
('レベル10到達', 'レベル10に到達する', 'flex', 'A', 1000, 500);

-- ============================================================================
-- TITLES (Achievements/Titles)
-- ============================================================================

INSERT INTO titles (name, description, unlock_condition_type, unlock_condition_value) VALUES
-- Streak-based titles
('3日坊主克服', '3日連続出社を達成', 'streak', '{"threshold": 3}'),
('一週間の戦士', '7日連続出社を達成', 'streak', '{"threshold": 7}'),
('二週間の猛者', '14日連続出社を達成', 'streak', '{"threshold": 14}'),
('一ヶ月の覇者', '30日連続出社を達成', 'streak', '{"threshold": 30}'),
('鉄人', '100日連続出社を達成', 'streak', '{"threshold": 100}'),

-- Attendance count-based titles
('出社ビギナー', '累計10回出社', 'attendance', '{"count": 10}'),
('出社アマチュア', '累計30回出社', 'attendance', '{"count": 30}'),
('出社プロ', '累計50回出社', 'attendance', '{"count": 50}'),
('出社マスター', '累計100回出社', 'attendance', '{"count": 100}'),
('出社レジェンド', '累計365回出社', 'attendance', '{"count": 365}'),

-- Level-based titles
('レベル5達成', 'レベル5に到達', 'level', '{"level": 5}'),
('レベル10達成', 'レベル10に到達', 'level', '{"level": 10}'),
('レベル25達成', 'レベル25に到達', 'level', '{"level": 25}'),
('レベル50達成', 'レベル50に到達', 'level', '{"level": 50}'),

-- Quest-based titles
('クエストハンター', '10個のクエストを完了', 'quest', '{"count": 10}'),
('クエストマスター', '50個のクエストを完了', 'quest', '{"count": 50}'),

-- Tag-based titles
('オフィスの主', 'officeAで30回チェックイン', 'tag', '{"tag": "officeA", "count": 30}'),
('在宅ワーカー', 'homeで30回チェックイン', 'tag', '{"tag": "home", "count": 30}'),
('会議室の常連', 'meetingRoomで20回チェックイン', 'tag', '{"tag": "meetingRoom", "count": 20}');

-- ============================================================================
-- SHOP ITEMS (Purchasable with Points)
-- ============================================================================

INSERT INTO shop_items (name, description, cost, item_type, item_value) VALUES
-- Lottery tickets
('くじチケット', 'くじを1回引けるチケット', 500, 'lottery_ticket', '{"count": 1}'),
('くじチケット×3', 'くじを3回引けるチケット', 1400, 'lottery_ticket', '{"count": 3}'),
('くじチケット×5', 'くじを5回引けるチケット（お得！）', 2000, 'lottery_ticket', '{"count": 5}'),

-- Special stamps
('ゴールドスタンプ', '豪華なゴールドスタンプ', 800, 'stamp', '{"stamp_id": "gold_premium"}'),
('レインボースタンプ', '虹色の特別スタンプ', 1200, 'stamp', '{"stamp_id": "rainbow_special"}'),

-- Title unlocks
('称号：ポイント富豪', 'ポイントで購入できる特別称号', 3000, 'title', '{"title_name": "ポイント富豪"}'),
('称号：ショップマスター', 'ショップで10回購入すると獲得', 5000, 'title', '{"title_name": "ショップマスター"}');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count inserted records
SELECT 'Prizes' as table_name, COUNT(*) as count FROM prizes
UNION ALL
SELECT 'Quests' as table_name, COUNT(*) as count FROM quests
UNION ALL
SELECT 'Titles' as table_name, COUNT(*) as count FROM titles
UNION ALL
SELECT 'Shop Items' as table_name, COUNT(*) as count FROM shop_items;

-- Show prize distribution by rank
SELECT 
    rank,
    COUNT(*) as count,
    SUM(weight) as total_weight,
    ROUND(SUM(weight) * 100.0 / (SELECT SUM(weight) FROM prizes), 2) as percentage
FROM prizes
GROUP BY rank
ORDER BY rank;

-- Show quest distribution
SELECT 
    quest_type,
    rank,
    COUNT(*) as count
FROM quests
GROUP BY quest_type, rank
ORDER BY quest_type, rank;

-- Show title distribution
SELECT 
    unlock_condition_type,
    COUNT(*) as count
FROM titles
GROUP BY unlock_condition_type
ORDER BY unlock_condition_type;
