-- Master Data for Officing Production
-- This script populates master data tables with production-ready data
-- Run this AFTER schema.sql has been executed
-- Requirements: 4.2, 6.1, 7.1, 9.5

-- ============================================================================
-- PRIZES (Lottery Prizes) - Requirement 4.2
-- ============================================================================
-- Weighted distribution: S=5%, A=15%, B=30%, C=50%

INSERT INTO prizes (name, description, rank, weight, stock, reward_type, reward_value) VALUES
-- S Rank (Rarest - 5% total weight)
('プレミアムギフトカード', '10,000円分のギフトカード', 'S', 2, 5, 'item', '{"value": 10000, "type": "gift_card", "description": "お好きな店舗で使える"}'),
('特別休暇チケット', '1日の特別休暇', 'S', 2, 10, 'item', '{"value": 1, "type": "special_leave", "description": "好きな日に使える特別休暇"}'),
('レジェンド称号', '伝説の出社マスター称号', 'S', 1, NULL, 'title', '{"title_name": "伝説の出社マスター", "description": "最高ランクの称号"}'),

-- A Rank (Rare - 15% total weight)
('高級ランチチケット', '5,000円分のランチチケット', 'A', 5, 20, 'item', '{"value": 5000, "type": "lunch_ticket", "description": "高級レストランで使える"}'),
('ボーナスポイント（大）', '1,000ポイント獲得', 'A', 8, NULL, 'points', '{"amount": 1000}'),
('レア称号', 'くじ運の持ち主称号', 'A', 2, NULL, 'title', '{"title_name": "くじ運の持ち主", "description": "運命に愛された者"}'),

-- B Rank (Uncommon - 30% total weight)
('カフェチケット', '1,000円分のカフェチケット', 'B', 15, 50, 'item', '{"value": 1000, "type": "cafe_ticket", "description": "お気に入りのカフェで"}'),
('ボーナスポイント（中）', '500ポイント獲得', 'B', 10, NULL, 'points', '{"amount": 500}'),
('特別スタンプ', 'レアなゴールドスタンプ', 'B', 5, NULL, 'stamp', '{"stamp_id": "rare_gold", "description": "輝くゴールドデザイン"}'),

-- C Rank (Common - 50% total weight)
('ボーナスポイント（小）', '200ポイント獲得', 'C', 30, NULL, 'points', '{"amount": 200}'),
('ボーナスポイント（微）', '100ポイント獲得', 'C', 15, NULL, 'points', '{"amount": 100}'),
('通常スタンプ', '特別なブルースタンプ', 'C', 5, NULL, 'stamp', '{"stamp_id": "special_blue", "description": "爽やかなブルーデザイン"}');

-- ============================================================================
-- QUESTS (Daily/Weekly/Flex Quests) - Requirement 7.1
-- ============================================================================
-- Quest rank multipliers: S=3x, A=2x, B=1.5x, C=1x

-- ============================================================================
-- Daily Quests (Pool for random assignment - 3 per day)
-- ============================================================================
INSERT INTO quests (title, description, quest_type, rank, base_xp, base_points, is_active) VALUES
-- S Rank Daily (Challenging)
('完璧な一日', '今日中に3回異なる場所でチェックインする', 'daily', 'S', 500, 300, TRUE),
('早起きチャンピオン', '午前7時前にチェックインする', 'daily', 'S', 400, 250, TRUE),
('スピードマスター', 'チェックイン後30分以内にクエストを完了', 'daily', 'S', 450, 280, TRUE),

-- A Rank Daily (Moderate)
('連続出社', '3日連続でチェックインを維持', 'daily', 'A', 300, 200, TRUE),
('場所マスター', '異なる2つのタグでチェックインする', 'daily', 'A', 250, 150, TRUE),
('くじチャレンジ', 'くじを2回引く', 'daily', 'A', 280, 180, TRUE),
('称号ハンター', '新しい称号を1つアンロックする', 'daily', 'A', 320, 200, TRUE),

-- B Rank Daily (Easy-Moderate)
('定時出社', '午前9時までにチェックインする', 'daily', 'B', 150, 100, TRUE),
('くじ挑戦', 'くじを1回引く', 'daily', 'B', 100, 80, TRUE),
('スタンプ確認', 'スタンプ帳で今月のスタンプを確認', 'daily', 'B', 120, 90, TRUE),
('ショップ訪問', 'ショップを開いてアイテムを確認', 'daily', 'B', 100, 70, TRUE),

-- C Rank Daily (Very Easy)
('今日の出社', '今日チェックインする', 'daily', 'C', 50, 50, TRUE),
('プロフィール確認', 'プロフィール画面を開く', 'daily', 'C', 30, 30, TRUE),
('ダッシュボード確認', 'ダッシュボードで進捗を確認', 'daily', 'C', 30, 30, TRUE),
('称号コレクション閲覧', '称号コレクションを開く', 'daily', 'C', 40, 35, TRUE);

-- ============================================================================
-- Weekly Quests (Longer term goals)
-- ============================================================================
INSERT INTO quests (title, description, quest_type, rank, base_xp, base_points, is_active) VALUES
('週間戦士', '週に5回チェックインする', 'weekly', 'A', 800, 500, TRUE),
('週間マスター', '週に7回チェックインする', 'weekly', 'S', 1500, 1000, TRUE),
('週間くじ師', '週に5回くじを引く', 'weekly', 'A', 700, 450, TRUE),
('週間クエスター', '週に15個のクエストを完了', 'weekly', 'S', 1200, 800, TRUE);

-- ============================================================================
-- Flex Quests (Milestone achievements - always available)
-- ============================================================================
INSERT INTO quests (title, description, quest_type, rank, base_xp, base_points, is_active) VALUES
('初めてのチェックイン', '初回チェックインを完了する', 'flex', 'C', 100, 100, TRUE),
('くじデビュー', '初めてくじを引く', 'flex', 'C', 100, 100, TRUE),
('称号コレクター', '5つの称号をアンロックする', 'flex', 'B', 500, 300, TRUE),
('称号マニア', '10つの称号をアンロックする', 'flex', 'A', 1000, 600, TRUE),
('レベル5到達', 'レベル5に到達する', 'flex', 'C', 200, 150, TRUE),
('レベル10到達', 'レベル10に到達する', 'flex', 'B', 500, 300, TRUE),
('レベル25到達', 'レベル25に到達する', 'flex', 'A', 1000, 500, TRUE),
('レベル50到達', 'レベル50に到達する', 'flex', 'S', 2000, 1000, TRUE),
('ポイント富豪', '累計10,000ポイント獲得', 'flex', 'A', 800, 0, TRUE),
('ショップ常連', 'ショップで5回購入', 'flex', 'B', 400, 200, TRUE);

-- ============================================================================
-- TITLES (Achievements/Titles) - Requirement 6.1
-- ============================================================================

INSERT INTO titles (name, description, unlock_condition_type, unlock_condition_value, icon) VALUES
-- First check-in title
('新米出社ニスト', '初めてチェックインした記念の称号', 'attendance', '{"count": 1}', '👩‍🍼'),

-- Streak-based titles (Requirement 5.5)
('3日坊主克服', '3日連続出社を達成した証', 'streak', '{"threshold": 3}', '🔥'),
('一週間の戦士', '7日連続出社を達成した証', 'streak', '{"threshold": 7}', '⚔️'),
('二週間の猛者', '14日連続出社を達成した証', 'streak', '{"threshold": 14}', '🛡️'),
('一ヶ月の覇者', '30日連続出社を達成した証', 'streak', '{"threshold": 30}', '👑'),
('鉄人', '100日連続出社を達成した証', 'streak', '{"threshold": 100}', '💪'),
('不屈の精神', '365日連続出社を達成した証', 'streak', '{"threshold": 365}', '🏆'),

-- Attendance count-based titles
('出社ビギナー', '累計10回出社を達成', 'attendance', '{"count": 10}', '🌱'),
('出社アマチュア', '累計30回出社を達成', 'attendance', '{"count": 30}', '🌿'),
('出社プロ', '累計50回出社を達成', 'attendance', '{"count": 50}', '🌳'),
('出社エキスパート', '累計100回出社を達成', 'attendance', '{"count": 100}', '🎋'),
('出社マスター', '累計200回出社を達成', 'attendance', '{"count": 200}', '🎄'),
('出社レジェンド', '累計365回出社を達成', 'attendance', '{"count": 365}', '🌟'),

-- Level-based titles (Requirement 8.4)
('レベル5達成', 'レベル5に到達した証', 'level', '{"level": 5}', '⭐'),
('レベル10達成', 'レベル10に到達した証', 'level', '{"level": 10}', '✨'),
('レベル25達成', 'レベル25に到達した証', 'level', '{"level": 25}', '💫'),
('レベル50達成', 'レベル50に到達した証', 'level', '{"level": 50}', '🌠'),
('レベル100達成', 'レベル100に到達した証', 'level', '{"level": 100}', '🎆'),

-- Quest-based titles
('クエストハンター', '10個のクエストを完了', 'quest', '{"count": 10}', '🎯'),
('クエストエキスパート', '50個のクエストを完了', 'quest', '{"count": 50}', '🏹'),
('クエストマスター', '100個のクエストを完了', 'quest', '{"count": 100}', '🎖️'),
('クエストレジェンド', '500個のクエストを完了', 'quest', '{"count": 500}', '🏅'),

-- Tag-based titles (Requirement 14.5)
('オフィスの主', 'officeAで30回チェックイン', 'tag', '{"tag": "officeA", "count": 30}', '🏢'),
('在宅ワーカー', 'homeで30回チェックイン', 'tag', '{"tag": "home", "count": 30}', '🏠'),
('会議室の常連', 'meetingRoomで20回チェックイン', 'tag', '{"tag": "meetingRoom", "count": 20}', '📊'),
('カフェ愛好家', 'cafeで20回チェックイン', 'tag', '{"tag": "cafe", "count": 20}', '☕'),
('図書館の賢者', 'libraryで20回チェックイン', 'tag', '{"tag": "library", "count": 20}', '📚');

-- ============================================================================
-- SHOP ITEMS (Purchasable with Points) - Requirement 9.5
-- ============================================================================

INSERT INTO shop_items (name, description, cost, item_type, item_value, is_available) VALUES
-- Lottery tickets (Most popular items)
('くじチケット', 'くじを1回引けるチケット', 500, 'lottery_ticket', '{"count": 1}', TRUE),
('くじチケット×3', 'くじを3回引けるチケット（5%お得）', 1400, 'lottery_ticket', '{"count": 3}', TRUE),
('くじチケット×5', 'くじを5回引けるチケット（20%お得！）', 2000, 'lottery_ticket', '{"count": 5}', TRUE),
('くじチケット×10', 'くじを10回引けるチケット（30%お得！）', 3500, 'lottery_ticket', '{"count": 10}', TRUE),

-- Special stamps
('ゴールドスタンプ', '豪華なゴールドスタンプデザイン', 800, 'stamp', '{"stamp_id": "gold_premium", "description": "輝く金色のスタンプ"}', TRUE),
('シルバースタンプ', '上品なシルバースタンプデザイン', 600, 'stamp', '{"stamp_id": "silver_elegant", "description": "洗練された銀色のスタンプ"}', TRUE),
('レインボースタンプ', '虹色の特別スタンプデザイン', 1200, 'stamp', '{"stamp_id": "rainbow_special", "description": "七色に輝くスタンプ"}', TRUE),
('ダイヤモンドスタンプ', '最高級のダイヤモンドスタンプ', 2000, 'stamp', '{"stamp_id": "diamond_ultimate", "description": "究極の輝きを放つスタンプ"}', TRUE),

-- Title unlocks (Premium titles)
('称号：ポイント富豪', 'ポイントで購入できる特別称号', 3000, 'title', '{"title_name": "ポイント富豪", "icon": "💰", "description": "ポイントを貯めた証"}', TRUE),
('称号：ショップマスター', 'ショップの達人称号', 5000, 'title', '{"title_name": "ショップマスター", "icon": "🛍️", "description": "ショップを使いこなす者"}', TRUE),
('称号：コレクター', 'アイテムコレクター称号', 4000, 'title', '{"title_name": "コレクター", "icon": "🎁", "description": "様々なアイテムを集めた証"}', TRUE),

-- Special items
('XPブースト（小）', '次のクエストでXP+50%', 1000, 'item', '{"type": "xp_boost", "multiplier": 1.5, "duration": 1}', TRUE),
('XPブースト（大）', '次の3クエストでXP+100%', 2500, 'item', '{"type": "xp_boost", "multiplier": 2.0, "duration": 3}', TRUE),
('ポイントブースト', '次のクエストでポイント+50%', 1000, 'item', '{"type": "point_boost", "multiplier": 1.5, "duration": 1}', TRUE);

-- ============================================================================
-- DEFAULT CONFIGURATION VALUES
-- ============================================================================

-- Create a configuration table for system-wide settings
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
('lottery_ticket_milestones', '[4, 8, 12]', 'Monthly check-in counts that grant lottery tickets'),
('pity_threshold', '50', 'Number of draws before guaranteed A+ rank prize'),
('daily_quest_count', '3', 'Number of daily quests to assign per day'),
('xp_level_formula', '{"base": 100, "exponent": 1.5}', 'XP formula: base * (level ^ exponent)'),
('quest_rank_multipliers', '{"S": 3.0, "A": 2.0, "B": 1.5, "C": 1.0}', 'Reward multipliers by quest rank'),
('default_tag', '"office"', 'Default tag when QR code has no tag parameter'),
('max_daily_checkins', '1', 'Maximum check-ins allowed per day'),
('streak_grace_period_hours', '0', 'Hours of grace period for streak calculation');

-- Enable RLS on system_config
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read config (but only admins can write)
CREATE POLICY "Anyone can view system config"
    ON system_config FOR SELECT
    USING (TRUE);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count inserted records
SELECT 'Prizes' as table_name, COUNT(*) as count FROM prizes
UNION ALL
SELECT 'Quests' as table_name, COUNT(*) as count FROM quests
UNION ALL
SELECT 'Titles' as table_name, COUNT(*) as count FROM titles
UNION ALL
SELECT 'Shop Items' as table_name, COUNT(*) as count FROM shop_items
UNION ALL
SELECT 'System Config' as table_name, COUNT(*) as count FROM system_config;

-- Verify prize distribution by rank (should be ~5%, 15%, 30%, 50%)
SELECT 
    rank,
    COUNT(*) as prize_count,
    SUM(weight) as total_weight,
    ROUND(SUM(weight) * 100.0 / (SELECT SUM(weight) FROM prizes), 2) as weight_percentage
FROM prizes
GROUP BY rank
ORDER BY 
    CASE rank 
        WHEN 'S' THEN 1 
        WHEN 'A' THEN 2 
        WHEN 'B' THEN 3 
        WHEN 'C' THEN 4 
    END;

-- Show quest distribution by type and rank
SELECT 
    quest_type,
    rank,
    COUNT(*) as count,
    ROUND(AVG(base_xp), 0) as avg_xp,
    ROUND(AVG(base_points), 0) as avg_points
FROM quests
WHERE is_active = TRUE
GROUP BY quest_type, rank
ORDER BY 
    CASE quest_type 
        WHEN 'daily' THEN 1 
        WHEN 'weekly' THEN 2 
        WHEN 'flex' THEN 3 
    END,
    CASE rank 
        WHEN 'S' THEN 1 
        WHEN 'A' THEN 2 
        WHEN 'B' THEN 3 
        WHEN 'C' THEN 4 
    END;

-- Show title distribution by unlock type
SELECT 
    unlock_condition_type,
    COUNT(*) as count
FROM titles
GROUP BY unlock_condition_type
ORDER BY unlock_condition_type;

-- Show shop items by type and price range
SELECT 
    item_type,
    COUNT(*) as count,
    MIN(cost) as min_price,
    MAX(cost) as max_price,
    ROUND(AVG(cost), 0) as avg_price
FROM shop_items
WHERE is_available = TRUE
GROUP BY item_type
ORDER BY item_type;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE system_config IS 'System-wide configuration values for game mechanics';

