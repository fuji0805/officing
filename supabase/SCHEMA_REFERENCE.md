# Database Schema Reference

Quick reference guide for the Officing database schema.

## Tables Overview

### user_progress
Stores user progression data including level, XP, points, and streak.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users (unique) |
| level | INTEGER | Current user level (default: 1) |
| current_xp | INTEGER | Current experience points (default: 0) |
| total_points | INTEGER | Total points for shop purchases (default: 0) |
| current_streak | INTEGER | Current consecutive check-in streak (default: 0) |
| max_streak | INTEGER | Maximum streak achieved (default: 0) |
| active_title_id | UUID | Foreign key to titles (nullable) |
| pity_counter | INTEGER | Lottery pity counter (default: 0) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time (auto-updated) |

**Indexes**: None (small table, user_id is unique)

---

### attendances
Records each check-in with date, time, and location tag.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| check_in_date | DATE | Date of check-in (unique per user) |
| check_in_time | TIMESTAMP | Exact time of check-in |
| tag | TEXT | Location tag (e.g., "officeA", "home") |
| month | INTEGER | Month number (1-12) |
| year | INTEGER | Year (e.g., 2024) |
| created_at | TIMESTAMP | Record creation time |

**Indexes**:
- `idx_attendances_user_date` on (user_id, check_in_date)
- `idx_attendances_user_year_month` on (user_id, year, month)

**Constraints**: UNIQUE(user_id, check_in_date)

---

### lottery_tickets
Tracks lottery ticket inventory for each user.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users (unique) |
| ticket_count | INTEGER | Number of available tickets (default: 0) |
| earned_from | TEXT | Source of tickets (e.g., "4_checkins") |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time (auto-updated) |

**Indexes**: None (small table, user_id is unique)

---

### prizes
Master data for lottery prizes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Prize name |
| description | TEXT | Prize description |
| rank | TEXT | Prize rank: S, A, B, or C |
| weight | INTEGER | Probability weight for selection |
| stock | INTEGER | Available quantity (null = unlimited) |
| is_available | BOOLEAN | Whether prize can be drawn (default: true) |
| reward_type | TEXT | Type: points, title, stamp, or item |
| reward_value | JSONB | Reward details (flexible structure) |
| created_at | TIMESTAMP | Record creation time |

**Indexes**: None (master data, relatively small)

---

### lottery_log
Records all lottery draws with results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| prize_id | UUID | Foreign key to prizes |
| rank | TEXT | Rank of prize drawn |
| pity_counter_at_draw | INTEGER | Pity counter value at time of draw |
| drawn_at | TIMESTAMP | Time of lottery draw |

**Indexes**:
- `idx_lottery_log_user` on (user_id, drawn_at DESC)

---

### quests
Master data for quests/missions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Quest title |
| description | TEXT | Quest description |
| quest_type | TEXT | Type: daily, weekly, or flex |
| rank | TEXT | Quest rank: S, A, B, or C |
| base_xp | INTEGER | Base XP reward |
| base_points | INTEGER | Base points reward |
| is_active | BOOLEAN | Whether quest is available (default: true) |
| created_at | TIMESTAMP | Record creation time |

**Indexes**: None (master data, relatively small)

---

### user_quest_logs
Tracks quest assignments and completions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| quest_id | UUID | Foreign key to quests |
| assigned_date | DATE | Date quest was assigned (for daily quests) |
| completed_at | TIMESTAMP | Time of completion (null if incomplete) |
| xp_earned | INTEGER | XP earned from completion |
| points_earned | INTEGER | Points earned from completion |
| created_at | TIMESTAMP | Record creation time |

**Indexes**:
- `idx_user_quest_logs_user_assigned` on (user_id, assigned_date)

---

### titles
Master data for titles/achievements.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Title name |
| description | TEXT | Title description |
| unlock_condition_type | TEXT | Type: streak, attendance, level, quest, or tag |
| unlock_condition_value | JSONB | Condition details (flexible structure) |
| icon | TEXT | Icon identifier (nullable) |
| created_at | TIMESTAMP | Record creation time |

**Indexes**: None (master data, relatively small)

---

### user_titles
Tracks which titles each user has unlocked.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| title_id | UUID | Foreign key to titles |
| unlocked_at | TIMESTAMP | Time of unlock |

**Indexes**:
- `idx_user_titles_user` on (user_id)

**Constraints**: UNIQUE(user_id, title_id)

---

### shop_items
Master data for shop items purchasable with points.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Item name |
| description | TEXT | Item description |
| cost | INTEGER | Cost in points |
| item_type | TEXT | Type: lottery_ticket, stamp, title, or item |
| item_value | JSONB | Item details (flexible structure) |
| is_available | BOOLEAN | Whether item can be purchased (default: true) |
| created_at | TIMESTAMP | Record creation time |

**Indexes**: None (master data, relatively small)

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Key policies:

### User Data Tables
- **user_progress, attendances, lottery_tickets, lottery_log, user_quest_logs, user_titles**
  - Users can SELECT, INSERT, UPDATE their own data only
  - Policy: `auth.uid() = user_id`

### Master Data Tables
- **prizes, quests, titles, shop_items**
  - All authenticated users can SELECT (read-only)
  - Only available items are visible (where applicable)

## Triggers

### Auto-update Timestamps
- `user_progress.updated_at` - Updated on every UPDATE
- `lottery_tickets.updated_at` - Updated on every UPDATE

## Common Queries

### Get user's current progress
```sql
SELECT * FROM user_progress WHERE user_id = auth.uid();
```

### Get monthly check-ins
```sql
SELECT * FROM attendances 
WHERE user_id = auth.uid() 
  AND year = 2024 
  AND month = 12
ORDER BY check_in_date;
```

### Get today's daily quests
```sql
SELECT q.*, uql.completed_at
FROM user_quest_logs uql
JOIN quests q ON q.id = uql.quest_id
WHERE uql.user_id = auth.uid()
  AND uql.assigned_date = CURRENT_DATE;
```

### Get unlocked titles
```sql
SELECT t.*
FROM user_titles ut
JOIN titles t ON t.id = ut.title_id
WHERE ut.user_id = auth.uid()
ORDER BY ut.unlocked_at DESC;
```

### Get lottery ticket count
```sql
SELECT ticket_count FROM lottery_tickets WHERE user_id = auth.uid();
```
