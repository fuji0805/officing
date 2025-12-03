# Design Document - Officing

## Overview

Officingは、QRコードベースのチェックインシステムとゲーミフィケーション要素を組み合わせたPWAアプリケーションです。ユーザーはQRコードをスキャンすることで出社を記録し、スタンプ、くじ、クエスト、レベルシステムなどのゲーム要素を通じて継続的なエンゲージメントを得られます。

### Key Design Principles

1. **Simplicity First**: QRコードスキャン → 自動チェックインの流れをシームレスに
2. **Progressive Enhancement**: オフライン対応、段階的な機能追加
3. **Gamification**: 継続的なモチベーションを提供する報酬システム
4. **Scalability**: 単一ユーザーから複数ユーザーへの拡張を考慮した設計

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (PWA)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │  State Mgmt  │  │ Service      │     │
│  │  (HTML/CSS)  │◄─┤  (Local)     │◄─┤ Worker       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  supabase-js    │                       │
│                   │  Client SDK     │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase      │
                    │   Platform      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  Auth Service  │  │   PostgreSQL    │  │ Edge Functions │
│  (Magic Link/  │  │   Database      │  │                │
│   Google)      │  │                 │  │ - /checkin     │
└────────────────┘  └─────────────────┘  │ - /lottery     │
                                          │ - /quest       │
                                          └────────────────┘
```

### Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **PWA**: Service Worker, Web App Manifest, Cache API
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Authentication**: Supabase Auth (Magic Link, Google OAuth)
- **Client Library**: supabase-js
- **Deployment**: 
  - Frontend: GitHub Pages（最もシンプル、git push だけでデプロイ）
  - Backend: Supabase Cloud（無料枠で十分、セットアップ簡単）

## Components and Interfaces

### Frontend Components

#### 1. App Shell
- **Responsibility**: PWA基本構造、ルーティング、認証状態管理
- **Key Methods**:
  - `init()`: アプリ初期化
  - `handleRoute(path)`: ルーティング処理
  - `checkAuth()`: 認証状態確認

#### 2. Check-in Handler
- **Responsibility**: QRコードURLからのチェックイン処理
- **Key Methods**:
  - `parseQRUrl(url)`: URL解析、tagパラメータ抽出
  - `executeCheckin(tag)`: チェックイン実行
  - `showSuccessAnimation()`: 成功時のUI表示

#### 3. Dashboard View
- **Responsibility**: ホーム画面の表示
- **Key Methods**:
  - `render()`: ダッシュボードレンダリング
  - `loadUserProgress()`: ユーザー進捗データ取得
  - `displayDailyQuests()`: 今日のクエスト表示

#### 4. Stamp Collection View
- **Responsibility**: スタンプ帳の表示
- **Key Methods**:
  - `renderCalendar(month, year)`: カレンダー表示
  - `loadStamps(month, year)`: スタンプデータ取得
  - `showStampDetail(date)`: スタンプ詳細表示

#### 5. Lottery View
- **Responsibility**: くじシステムのUI
- **Key Methods**:
  - `drawLottery()`: くじ実行
  - `showPrizeAnimation(prize)`: 当選演出
  - `displayTicketCount()`: チケット数表示

#### 6. Quest View
- **Responsibility**: クエスト一覧と完了処理
- **Key Methods**:
  - `renderQuests()`: クエスト一覧表示
  - `completeQuest(questId)`: クエスト完了
  - `showRewards(rewards)`: 報酬表示

#### 7. Shop View
- **Responsibility**: ポイントショップ
- **Key Methods**:
  - `renderShop()`: ショップ表示
  - `purchaseItem(itemId)`: アイテム購入
  - `updatePointBalance()`: ポイント残高更新

#### 8. Profile View
- **Responsibility**: ユーザープロフィール表示
- **Key Methods**:
  - `renderProfile()`: プロフィール表示
  - `displayTitles()`: 称号一覧表示
  - `setActiveTitle(titleId)`: アクティブ称号設定

### Backend Components (Supabase Edge Functions)

#### 1. Check-in Function (`/checkin`)
- **Responsibility**: チェックイン処理、報酬計算
- **Input**: `{ userId, tag, timestamp }`
- **Output**: `{ success, attendance, rewards, newTitles }`
- **Logic**:
  - 当日の重複チェックイン防止
  - 出社記録の保存
  - 月間カウント更新
  - ストリーク計算
  - くじチケット付与判定（4/8/12回）
  - 称号アンロック判定

#### 2. Lottery Function (`/lottery-draw`)
- **Responsibility**: くじ抽選処理
- **Input**: `{ userId }`
- **Output**: `{ success, prize, rank, pityCounter }`
- **Logic**:
  - チケット消費
  - 重み付き抽選（S/A/B/C）
  - 在庫確認
  - Pityシステム適用
  - 抽選ログ保存

#### 3. Quest Function (`/quest-complete`)
- **Responsibility**: クエスト完了処理
- **Input**: `{ userId, questId }`
- **Output**: `{ success, rewards }`
- **Logic**:
  - クエスト完了記録
  - ランク別報酬計算
  - XP/ポイント付与
  - レベルアップ判定
  - 称号アンロック判定

## Data Models

### Database Schema

#### users (Supabase Auth)
```sql
-- Managed by Supabase Auth
id: uuid (PK)
email: text
created_at: timestamp
```

#### user_progress
```sql
id: uuid (PK)
user_id: uuid (FK -> users.id)
level: integer (default: 1)
current_xp: integer (default: 0)
total_points: integer (default: 0)
current_streak: integer (default: 0)
max_streak: integer (default: 0)
active_title_id: uuid (FK -> titles.id, nullable)
pity_counter: integer (default: 0)
created_at: timestamp
updated_at: timestamp
```

#### attendances
```sql
id: uuid (PK)
user_id: uuid (FK -> users.id)
check_in_date: date
check_in_time: timestamp
tag: text
month: integer
year: integer
created_at: timestamp

UNIQUE(user_id, check_in_date)
INDEX(user_id, year, month)
```

#### lottery_tickets
```sql
id: uuid (PK)
user_id: uuid (FK -> users.id)
ticket_count: integer (default: 0)
earned_from: text (e.g., "4_checkins", "quest_reward")
created_at: timestamp
updated_at: timestamp
```

#### prizes
```sql
id: uuid (PK)
name: text
description: text
rank: text (S/A/B/C)
weight: integer
stock: integer (nullable, null = unlimited)
is_available: boolean (default: true)
reward_type: text (points/title/stamp)
reward_value: jsonb
created_at: timestamp
```

#### lottery_log
```sql
id: uuid (PK)
user_id: uuid (FK -> users.id)
prize_id: uuid (FK -> prizes.id)
rank: text
pity_counter_at_draw: integer
drawn_at: timestamp
```

#### quests
```sql
id: uuid (PK)
title: text
description: text
quest_type: text (daily/weekly/flex)
rank: text (S/A/B/C)
base_xp: integer
base_points: integer
is_active: boolean (default: true)
created_at: timestamp
```

#### user_quest_logs
```sql
id: uuid (PK)
user_id: uuid (FK -> users.id)
quest_id: uuid (FK -> quests.id)
assigned_date: date (nullable, for daily quests)
completed_at: timestamp (nullable)
xp_earned: integer
points_earned: integer
created_at: timestamp

INDEX(user_id, assigned_date)
```

#### titles
```sql
id: uuid (PK)
name: text
description: text
unlock_condition_type: text (streak/attendance/level/quest)
unlock_condition_value: jsonb
icon: text (nullable)
created_at: timestamp
```

#### user_titles
```sql
id: uuid (PK)
user_id: uuid (FK -> users.id)
title_id: uuid (FK -> titles.id)
unlocked_at: timestamp

UNIQUE(user_id, title_id)
```

#### shop_items
```sql
id: uuid (PK)
name: text
description: text
cost: integer (points)
item_type: text (lottery_ticket/stamp/title)
item_value: jsonb
is_available: boolean (default: true)
created_at: timestamp
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: QR URL Tag Extraction
*For any* valid check-in URL containing a tag parameter, the system should correctly extract and return the tag value.
**Validates: Requirements 1.1**

### Property 2: Automatic Check-in Execution
*For any* PWA load from a check-in URL, the check-in function should be automatically invoked without user interaction.
**Validates: Requirements 1.2**

### Property 3: Check-in Data Persistence
*For any* successful check-in, the attendances table should contain a record with timestamp, date, and tag.
**Validates: Requirements 1.3**

### Property 4: Daily Check-in Idempotency
*For any* user and date, only the first check-in attempt should succeed, and subsequent attempts on the same date should be rejected.
**Validates: Requirements 1.4**

### Property 5: Monthly Count Increment
*For any* successful check-in, the monthly attendance count should increase by exactly 1.
**Validates: Requirements 1.5**

### Property 6: Success Screen Display
*For any* successful check-in, the UI should render a success screen containing a confetti animation element.
**Validates: Requirements 2.1**

### Property 7: Stamp Addition
*For any* successful check-in, the stamp collection should include a stamp for that check-in date.
**Validates: Requirements 2.2**

### Property 8: Attendance Metrics Display
*For any* successful check-in, the UI should display the current monthly count and streak values.
**Validates: Requirements 2.3**

### Property 9: Title Acquisition Animation
*For any* check-in that results in a new title unlock, the UI should display a title acquisition animation.
**Validates: Requirements 2.4**

### Property 10: Lottery Ticket Countdown Display
*For any* check-in state, the UI should correctly calculate and display the number of check-ins remaining until the next lottery ticket.
**Validates: Requirements 2.5**

### Property 11: Ticket Persistence
*For any* lottery ticket grant, the ticket count should be recorded in the lottery_tickets table.
**Validates: Requirements 3.4**

### Property 12: Ticket Count Display
*For any* user state, the displayed ticket count should match the stored ticket count in the database.
**Validates: Requirements 3.5**

### Property 13: Lottery Ticket Consumption
*For any* lottery draw, exactly one ticket should be consumed and a prize should be selected.
**Validates: Requirements 4.1**

### Property 14: Weighted Prize Selection
*For any* set of lottery draws, the distribution of prize ranks should approximate the configured weights, respecting availability constraints.
**Validates: Requirements 4.2**

### Property 15: Prize Inventory Management
*For any* prize selection that depletes stock to zero, the prize should be marked as unavailable.
**Validates: Requirements 4.3**

### Property 16: Pity System Guarantee
*For any* lottery draw where the pity counter reaches the configured threshold, the selected prize must be rank A or higher.
**Validates: Requirements 4.4**

### Property 17: Lottery Log Completeness
*For any* completed lottery draw, the lottery_log should contain a record with timestamp, prize, and rank.
**Validates: Requirements 4.5**

### Property 18: Streak Increment
*For any* sequence of check-ins on consecutive calendar days, the streak counter should increase with each check-in.
**Validates: Requirements 5.1**

### Property 19: Streak Reset
*For any* gap in check-ins spanning one or more calendar days, the streak counter should be reset to zero.
**Validates: Requirements 5.2**

### Property 20: Streak Persistence
*For any* streak counter update, the new value should be persisted in the user_progress table.
**Validates: Requirements 5.3**

### Property 21: Streak Display
*For any* user state, the displayed streak count should match the stored streak value.
**Validates: Requirements 5.4**

### Property 22: Title Unlock
*For any* condition being met (attendance, streak, level, quest), the corresponding title should be added to user_titles.
**Validates: Requirements 6.1**

### Property 23: Title Availability
*For any* title unlock, the title should be marked as available in the titles table.
**Validates: Requirements 6.2**

### Property 24: Active Title Uniqueness
*For any* title selection, only that title should be marked as active in user_progress.
**Validates: Requirements 6.3**

### Property 25: Active Title Display
*For any* user state, the displayed active title should match the active_title_id in user_progress.
**Validates: Requirements 6.4**

### Property 26: Title Collection Display
*For any* user's title collection view, all titles should be displayed with correct unlock status.
**Validates: Requirements 6.5**

### Property 27: Daily Quest Generation
*For any* daily quest generation event, exactly three quests should be created and assigned to the user.
**Validates: Requirements 7.1**

### Property 28: Quest Reward Calculation
*For any* quest completion, the granted rewards should match the quest rank multipliers applied to base values.
**Validates: Requirements 7.2**

### Property 29: Quest Completion Logging
*For any* quest completion, the user_quest_logs should contain a record with timestamp.
**Validates: Requirements 7.3**

### Property 30: Daily Quest Reset
*For any* daily quest reset event, incomplete daily quests should be removed and new quests should be generated.
**Validates: Requirements 7.4**

### Property 31: Quest Display Completeness
*For any* quest screen render, all active quests should be displayed with descriptions, rewards, and completion status.
**Validates: Requirements 7.5**

### Property 32: XP Accumulation
*For any* XP gain event, the total XP in user_progress should increase by the earned amount.
**Validates: Requirements 8.1**

### Property 33: Level-up Logic
*For any* XP accumulation that reaches the next level threshold, the level should increment and XP should be adjusted by subtracting the threshold.
**Validates: Requirements 8.2**

### Property 34: Exponential XP Curve
*For any* level, the XP threshold for the next level should follow the configured exponential growth formula.
**Validates: Requirements 8.3**

### Property 35: XP Display Completeness
*For any* profile view, the UI should display current level, current XP, and XP required for next level.
**Validates: Requirements 8.5**

### Property 36: Point Rewards
*For any* reward event (quest completion, lottery win), points should be granted according to the reward configuration.
**Validates: Requirements 9.1**

### Property 37: Purchase Point Deduction
*For any* shop purchase, the user's point balance should decrease by exactly the item cost.
**Validates: Requirements 9.2**

### Property 38: Item Delivery
*For any* completed purchase, the purchased item should be added to the user's inventory or state.
**Validates: Requirements 9.3**

### Property 39: Insufficient Points Rejection
*For any* purchase attempt where the user's points are less than the item cost, the transaction should be rejected.
**Validates: Requirements 9.4**

### Property 40: Shop Display Completeness
*For any* shop view, all available items should be displayed with costs and the user's current point balance.
**Validates: Requirements 9.5**

### Property 41: Session Creation
*For any* successful authentication, a Supabase session should be created.
**Validates: Requirements 10.2**

### Property 42: Session Expiry Handling
*For any* expired session, the system should prompt for re-authentication before allowing protected actions.
**Validates: Requirements 10.3**

### Property 43: Logout State Clearing
*For any* logout action, the session should be terminated and local authentication state should be cleared.
**Validates: Requirements 10.4**

### Property 44: Unauthenticated Redirect
*For any* unauthenticated user attempting to check in, the system should redirect to the authentication screen.
**Validates: Requirements 10.5**

### Property 45: Responsive UI
*For any* mobile screen size, the UI should adapt and display correctly.
**Validates: Requirements 11.3**

### Property 46: Offline Queueing
*For any* check-in attempt while offline, the action should be queued for later synchronization.
**Validates: Requirements 11.4**

### Property 47: Online Synchronization
*For any* queued action when connectivity is restored, the action should be synchronized with Supabase.
**Validates: Requirements 11.5**

### Property 48: Calendar Stamp Display
*For any* user's check-in history, stamps should appear on the correct calendar dates.
**Validates: Requirements 12.1**

### Property 49: Stamp Addition to Collection
*For any* check-in, a stamp should be added to the collection for that date.
**Validates: Requirements 12.2**

### Property 50: Stamp Detail Display
*For any* stamp, the detail view should display the check-in date, time, and tag.
**Validates: Requirements 12.3**

### Property 51: Month Navigation
*For any* month selection, the correct stamps for that month should be loaded and displayed.
**Validates: Requirements 12.5**

### Property 52: Dashboard Check-in Status
*For any* home screen load, today's check-in status should be displayed.
**Validates: Requirements 13.1**

### Property 53: Dashboard Attendance Metrics
*For any* home screen load, monthly attendance count and current streak should be displayed.
**Validates: Requirements 13.2**

### Property 54: Dashboard Ticket Count
*For any* home screen load, available lottery ticket count should be displayed.
**Validates: Requirements 13.3**

### Property 55: Dashboard Title and Level
*For any* home screen load, the active title and current level should be displayed.
**Validates: Requirements 13.4**

### Property 56: Dashboard Quest Display
*For any* home screen load, up to three active daily quests with completion status should be displayed.
**Validates: Requirements 13.5**

### Property 57: QR Code Tag Inclusion
*For any* generated QR code, the URL should contain a tag parameter.
**Validates: Requirements 14.1**

### Property 58: Tag Extraction and Validation
*For any* check-in URL, the tag parameter should be extracted and validated.
**Validates: Requirements 14.2**

### Property 59: Default Tag Fallback
*For any* invalid or missing tag, the system should use a default tag value.
**Validates: Requirements 14.3**

### Property 60: Tag Persistence
*For any* check-in, the tag value should be stored in the attendances table.
**Validates: Requirements 14.4**

### Property 61: Tag-based Achievement
*For any* configured tag-specific achievement, titles should be granted based on check-ins at that tag.
**Validates: Requirements 14.5**

### Property 62: Quest Rank Assignment
*For any* quest, a rank (S/A/B/C) should be assigned.
**Validates: Requirements 15.1**

### Property 63: Rank-based Reward Multiplier
*For any* quest completion, rewards should be calculated as base rewards multiplied by the rank-specific multiplier.
**Validates: Requirements 15.4**

### Property 64: Quest Rank Display
*For any* quest view, the quest rank and expected rewards should be displayed.
**Validates: Requirements 15.5**

## Error Handling

### Client-Side Error Handling

1. **Network Errors**
   - Offline detection and queueing
   - Retry logic with exponential backoff
   - User-friendly error messages

2. **Authentication Errors**
   - Session expiry detection
   - Automatic redirect to login
   - Token refresh handling

3. **Validation Errors**
   - Input validation before API calls
   - Clear error messages for invalid data
   - Form field highlighting

4. **API Errors**
   - HTTP status code handling
   - Error message display
   - Fallback to cached data when appropriate

### Server-Side Error Handling (Edge Functions)

1. **Database Errors**
   - Transaction rollback on failure
   - Constraint violation handling
   - Connection pool management

2. **Business Logic Errors**
   - Duplicate check-in prevention
   - Insufficient ticket validation
   - Stock availability checks

3. **Rate Limiting**
   - Request throttling
   - Abuse prevention
   - Fair usage enforcement

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

- URL parsing with various tag formats
- XP calculation for different quest ranks
- Level-up threshold calculations
- Point balance after purchases
- Streak calculation with gaps
- Empty state rendering (no check-ins, no quests)
- Milestone thresholds (4, 8, 12 check-ins)
- Rank-specific multipliers (S, A, B, C)

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript property testing library). Each test will run a minimum of 100 iterations.

**Configuration**: Each property test will be configured to run at least 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test will include a comment tag in the following format:
```javascript
// Feature: office-checkin-game, Property 1: QR URL Tag Extraction
```

**Property Implementation**: Each correctness property listed above will be implemented as a single property-based test that validates the property across randomly generated inputs.

Examples of property-based tests:
- For any valid check-in URL, tag extraction should succeed
- For any sequence of check-ins, monthly count should equal the number of check-ins
- For any lottery draw, exactly one ticket should be consumed
- For any quest completion, rewards should match rank multipliers
- For any purchase with sufficient points, balance should decrease by cost

### Integration Testing

- End-to-end check-in flow (QR scan → database → UI update)
- Authentication flow (login → session → protected actions)
- Lottery system (ticket earn → draw → prize delivery)
- Quest system (assignment → completion → rewards)

### PWA Testing

- Service worker installation and activation
- Offline functionality
- Cache management
- Manifest validation
- Add to home screen

## Performance Considerations

1. **Database Indexing**
   - Index on `(user_id, check_in_date)` for attendance queries
   - Index on `(user_id, assigned_date)` for quest queries
   - Index on `(user_id, year, month)` for monthly statistics

2. **Caching Strategy**
   - Cache static assets (HTML, CSS, JS)
   - Cache user progress data with short TTL
   - Cache quest templates
   - Invalidate cache on data mutations

3. **Lazy Loading**
   - Load stamp collection data on-demand by month
   - Paginate lottery log
   - Defer non-critical animations

4. **Optimistic UI Updates**
   - Immediate UI feedback for check-ins
   - Background synchronization
   - Rollback on server errors

## Security Considerations

1. **Authentication**
   - Supabase Auth handles token management
   - Row Level Security (RLS) policies on all tables
   - Session expiry enforcement

2. **Authorization**
   - Users can only access their own data
   - RLS policies: `user_id = auth.uid()`
   - Edge Functions validate user identity

3. **Input Validation**
   - Sanitize tag parameters
   - Validate date formats
   - Prevent SQL injection (parameterized queries)

4. **Rate Limiting**
   - Limit check-ins to once per day per user
   - Throttle lottery draws
   - Prevent quest completion spam

## Deployment Strategy

### シンプルデプロイ（個人利用向け）

#### 1. Supabase セットアップ（5分）
   - https://supabase.com でアカウント作成（無料）
   - 新規プロジェクト作成
   - SQL Editor でテーブル作成スクリプト実行
   - Edge Functions をデプロイ（`supabase functions deploy`）
   - Auth 設定で Magic Link を有効化
   - RLS ポリシーを設定
   - プロジェクトの URL と anon key をコピー

#### 2. フロントエンド設定（2分）
   - `config.js` に Supabase URL と anon key を貼り付け
   - ローカルで動作確認（`python -m http.server` や Live Server）

#### 3. GitHub Pages デプロイ（3分）
   - GitHub リポジトリ作成
   - コードを push
   - Settings → Pages で `main` ブランチを公開
   - 完成！ `https://username.github.io/officing` でアクセス可能

#### 代替デプロイ方法
- **Vercel**: GitHub 連携で自動デプロイ（さらに簡単）
- **Netlify**: ドラッグ&ドロップでデプロイ可能
- **Cloudflare Pages**: 高速、無料枠が大きい

### 必要最小限の設定
- Supabase プロジェクト URL
- Supabase anon key
- （オプション）Google OAuth Client ID

### モニタリング（オプション）
- Supabase ダッシュボードで基本的なメトリクスは確認可能
- 本格的な監視は不要（個人利用のため）

## Future Enhancements

1. **Multi-user Features**
   - Team leaderboards
   - Shared achievements
   - Social features

2. **Notifications**
   - Slack integration
   - Push notifications for streaks
   - Daily quest reminders

3. **Advanced Gamification**
   - Seasonal events
   - Limited-time quests
   - Themed stamp collections
   - Achievement badges

4. **Location Features**
   - GPS-based check-ins
   - Location verification
   - Hybrid QR + GPS mode

5. **Analytics Dashboard**
   - Attendance trends
   - Quest completion rates
   - Engagement metrics
