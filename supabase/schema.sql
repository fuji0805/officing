-- Officing Database Schema
-- This script creates all tables, indexes, and RLS policies for the Officing PWA

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- User Progress Table
-- Tracks user level, XP, points, streak, and active title
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    current_xp INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    active_title_id UUID,
    pity_counter INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Attendances Table
-- Records each check-in with date, time, and tag
CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    tag TEXT NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, check_in_date)
);

-- Lottery Tickets Table
-- Tracks lottery ticket counts for each user
CREATE TABLE IF NOT EXISTS lottery_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_count INTEGER NOT NULL DEFAULT 0,
    earned_from TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Prizes Table
-- Master data for lottery prizes
CREATE TABLE IF NOT EXISTS prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    rank TEXT NOT NULL CHECK (rank IN ('S', 'A', 'B', 'C')),
    weight INTEGER NOT NULL,
    stock INTEGER,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'title', 'stamp', 'item')),
    reward_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lottery Log Table
-- Records all lottery draws
CREATE TABLE IF NOT EXISTS lottery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES prizes(id),
    rank TEXT NOT NULL,
    pity_counter_at_draw INTEGER NOT NULL,
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests Table
-- Master data for quests
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'flex')),
    rank TEXT NOT NULL CHECK (rank IN ('S', 'A', 'B', 'C')),
    base_xp INTEGER NOT NULL,
    base_points INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Quest Logs Table
-- Tracks quest assignments and completions
CREATE TABLE IF NOT EXISTS user_quest_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id),
    assigned_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    xp_earned INTEGER,
    points_earned INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Titles Table
-- Master data for titles/achievements
CREATE TABLE IF NOT EXISTS titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    unlock_condition_type TEXT NOT NULL CHECK (unlock_condition_type IN ('streak', 'attendance', 'level', 'quest', 'tag')),
    unlock_condition_value JSONB NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Titles Table
-- Tracks which titles each user has unlocked
CREATE TABLE IF NOT EXISTS user_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title_id UUID NOT NULL REFERENCES titles(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, title_id)
);

-- Shop Items Table
-- Master data for shop items
CREATE TABLE IF NOT EXISTS shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('lottery_ticket', 'stamp', 'title', 'item')),
    item_value JSONB,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Attendances indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_attendances_user_date 
    ON attendances(user_id, check_in_date);

CREATE INDEX IF NOT EXISTS idx_attendances_user_year_month 
    ON attendances(user_id, year, month);

-- User quest logs index for daily quest queries
CREATE INDEX IF NOT EXISTS idx_user_quest_logs_user_assigned 
    ON user_quest_logs(user_id, assigned_date);

-- Lottery log index for user history
CREATE INDEX IF NOT EXISTS idx_lottery_log_user 
    ON lottery_log(user_id, drawn_at DESC);

-- User titles index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_titles_user 
    ON user_titles(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- User Progress Policies
CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Attendances Policies
CREATE POLICY "Users can view their own attendances"
    ON attendances FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendances"
    ON attendances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Lottery Tickets Policies
CREATE POLICY "Users can view their own lottery tickets"
    ON lottery_tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lottery tickets"
    ON lottery_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lottery tickets"
    ON lottery_tickets FOR UPDATE
    USING (auth.uid() = user_id);

-- Prizes Policies (read-only for users)
CREATE POLICY "Anyone can view available prizes"
    ON prizes FOR SELECT
    USING (TRUE);

-- Lottery Log Policies
CREATE POLICY "Users can view their own lottery log"
    ON lottery_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lottery log"
    ON lottery_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Quests Policies (read-only for users)
CREATE POLICY "Anyone can view active quests"
    ON quests FOR SELECT
    USING (is_active = TRUE);

-- User Quest Logs Policies
CREATE POLICY "Users can view their own quest logs"
    ON user_quest_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest logs"
    ON user_quest_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest logs"
    ON user_quest_logs FOR UPDATE
    USING (auth.uid() = user_id);

-- Titles Policies (read-only for users)
CREATE POLICY "Anyone can view titles"
    ON titles FOR SELECT
    USING (TRUE);

-- User Titles Policies
CREATE POLICY "Users can view their own titles"
    ON user_titles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own titles"
    ON user_titles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Shop Items Policies (read-only for users)
CREATE POLICY "Anyone can view available shop items"
    ON shop_items FOR SELECT
    USING (is_available = TRUE);

-- ============================================================================
-- FOREIGN KEY CONSTRAINT FOR ACTIVE TITLE
-- ============================================================================

-- Add foreign key constraint for active_title_id after titles table is created
ALTER TABLE user_progress 
    ADD CONSTRAINT fk_user_progress_active_title 
    FOREIGN KEY (active_title_id) REFERENCES titles(id) ON DELETE SET NULL;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_progress
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for lottery_tickets
CREATE TRIGGER update_lottery_tickets_updated_at
    BEFORE UPDATE ON lottery_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_progress IS 'Stores user level, XP, points, streak, and active title';
COMMENT ON TABLE attendances IS 'Records each check-in with date, time, and location tag';
COMMENT ON TABLE lottery_tickets IS 'Tracks lottery ticket counts for each user';
COMMENT ON TABLE prizes IS 'Master data for lottery prizes with ranks and weights';
COMMENT ON TABLE lottery_log IS 'Records all lottery draws with results';
COMMENT ON TABLE quests IS 'Master data for quests with types and rewards';
COMMENT ON TABLE user_quest_logs IS 'Tracks quest assignments and completions';
COMMENT ON TABLE titles IS 'Master data for titles/achievements';
COMMENT ON TABLE user_titles IS 'Tracks which titles each user has unlocked';
COMMENT ON TABLE shop_items IS 'Master data for shop items purchasable with points';
