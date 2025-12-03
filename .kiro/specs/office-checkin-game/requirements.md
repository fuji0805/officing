# Requirements Document

## Introduction

Officingは、QRコードスキャンによる出社チェックインをゲーム化し、日常の行動を楽しく記録するPWAアプリケーションです。ユーザーはQRコードを読み取ることで出社を記録し、スタンプ、くじ、クエスト、レベルアップなどのゲーム要素を通じて継続的なモチベーションを得られます。Supabaseをバックエンドとして使用し、認証、データ管理、ビジネスロジックを実装します。

## Glossary

- **System**: Officingアプリケーション全体
- **User**: アプリケーションを使用する個人ユーザー
- **QR Code**: チェックイン用のURLを含むQRコード
- **Check-in**: QRコードスキャンによる出社記録の登録
- **Tag**: QRコードに含まれる場所識別子（例：officeA, home, meetingRoom）
- **Stamp**: チェックイン成功時に付与される視覚的な記録
- **Lottery Ticket**: くじを引くためのチケット
- **Prize**: くじで獲得できる景品
- **Quest**: ユーザーが達成できるミッション
- **XP**: 経験値（Experience Points）
- **Level**: XPの累積によって決まるユーザーのレベル
- **Points**: ショップでアイテムを購入するための通貨
- **Title**: ユーザーが獲得できる称号
- **Streak**: 連続出社日数
- **Pity System**: ハズレ続き防止のための天井システム
- **PWA**: Progressive Web Application
- **Supabase**: バックエンドサービス（認証、データベース、Edge Functions）

## Requirements

### Requirement 1

**User Story:** As a User, I want to check in by scanning a QR code, so that I can record my office attendance quickly and automatically.

#### Acceptance Criteria

1. WHEN a User scans a QR code containing a check-in URL with a tag parameter THEN the System SHALL open the PWA and extract the tag value
2. WHEN the PWA loads from a QR code URL THEN the System SHALL automatically execute the check-in process without requiring additional user interaction
3. WHEN a check-in is successful THEN the System SHALL record the timestamp, date, and tag in the attendances table
4. WHEN a User attempts to check in multiple times on the same day THEN the System SHALL accept only the first check-in and reject subsequent attempts
5. WHEN a check-in is recorded THEN the System SHALL increment the monthly attendance count for the current month

### Requirement 2

**User Story:** As a User, I want to see visual feedback when I check in, so that I feel rewarded and motivated.

#### Acceptance Criteria

1. WHEN a check-in succeeds THEN the System SHALL display a success screen with confetti animation
2. WHEN a check-in succeeds THEN the System SHALL display the stamp for that day in the stamp collection
3. WHEN a check-in succeeds THEN the System SHALL show the current monthly attendance count and streak count
4. WHEN a User earns a new title during check-in THEN the System SHALL display a title acquisition animation
5. WHEN a check-in succeeds THEN the System SHALL display the number of check-ins remaining until the next lottery ticket

### Requirement 3

**User Story:** As a User, I want to earn lottery tickets based on my attendance, so that I can participate in the lottery system.

#### Acceptance Criteria

1. WHEN a User reaches 4 check-ins in a month THEN the System SHALL automatically grant one lottery ticket
2. WHEN a User reaches 8 check-ins in a month THEN the System SHALL automatically grant one lottery ticket
3. WHEN a User reaches 12 check-ins in a month THEN the System SHALL automatically grant one lottery ticket
4. WHEN lottery tickets are granted THEN the System SHALL record the ticket count in the lottery_tickets table
5. WHEN a User views their profile THEN the System SHALL display the current number of available lottery tickets

### Requirement 4

**User Story:** As a User, I want to draw lottery prizes using my tickets, so that I can receive rewards for my attendance.

#### Acceptance Criteria

1. WHEN a User initiates a lottery draw with available tickets THEN the System SHALL consume one ticket and execute the weighted random selection algorithm
2. WHEN the lottery draw executes THEN the System SHALL select a prize based on rank weights (S/A/B/C) and availability
3. WHEN a prize is selected THEN the System SHALL check the prize inventory and mark it as unavailable if stock reaches zero
4. WHEN the pity counter reaches a configured threshold THEN the System SHALL guarantee a prize of rank A or higher
5. WHEN a lottery draw completes THEN the System SHALL record the result in the lottery_log table with timestamp, prize, and rank

### Requirement 5

**User Story:** As a User, I want to track my consecutive attendance streak, so that I can maintain motivation to check in daily.

#### Acceptance Criteria

1. WHEN a User checks in on consecutive calendar days THEN the System SHALL increment the streak counter
2. WHEN a User fails to check in for one or more calendar days THEN the System SHALL reset the streak counter to zero
3. WHEN the streak counter updates THEN the System SHALL persist the new value in the user_progress table
4. WHEN a User views their profile THEN the System SHALL display the current streak count
5. WHEN a User achieves specific streak milestones (3, 7, 14, 30 days) THEN the System SHALL unlock corresponding titles

### Requirement 6

**User Story:** As a User, I want to earn and display titles, so that I can showcase my achievements.

#### Acceptance Criteria

1. WHEN a User meets title unlock conditions (attendance count, streak, level, quest completion) THEN the System SHALL add the title to the user_titles table
2. WHEN a User unlocks a new title THEN the System SHALL mark it as available in the titles table
3. WHEN a User selects a title as active THEN the System SHALL update the active_title field in user_progress to reference only that title
4. WHEN a User views their profile THEN the System SHALL display the currently active title
5. WHEN a User views the title collection THEN the System SHALL display all unlocked titles and locked titles with unlock conditions

### Requirement 7

**User Story:** As a User, I want to complete quests to earn rewards, so that I can engage with the app beyond just checking in.

#### Acceptance Criteria

1. WHEN the System generates daily quests THEN the System SHALL create three random quests from the daily quest pool and assign them to the User
2. WHEN a User marks a quest as complete THEN the System SHALL grant the quest rewards (XP, Points, lottery tickets) based on quest rank
3. WHEN a quest is completed THEN the System SHALL record the completion in the user_quest_logs table with timestamp
4. WHEN daily quests reset THEN the System SHALL remove incomplete daily quests and generate new ones
5. WHEN a User views the quest screen THEN the System SHALL display all active quests with descriptions, rewards, and completion status

### Requirement 8

**User Story:** As a User, I want to gain experience points and level up, so that I can see my progress over time.

#### Acceptance Criteria

1. WHEN a User earns XP from quests or check-ins THEN the System SHALL add the XP to the user_progress table
2. WHEN accumulated XP reaches the threshold for the next level THEN the System SHALL increment the level and subtract the required XP
3. WHEN a User levels up THEN the System SHALL calculate the next level threshold using an exponential growth formula
4. WHEN a User reaches specific level milestones THEN the System SHALL unlock corresponding titles
5. WHEN a User views their profile THEN the System SHALL display current level, current XP, and XP required for next level

### Requirement 9

**User Story:** As a User, I want to earn and spend points in a shop, so that I can customize my experience.

#### Acceptance Criteria

1. WHEN a User completes quests or wins lottery prizes THEN the System SHALL grant points based on the reward configuration
2. WHEN a User purchases an item from the shop THEN the System SHALL deduct the item cost from the user's point balance
3. WHEN a shop purchase completes THEN the System SHALL grant the purchased item (lottery ticket, special stamp, title unlock)
4. WHEN a User attempts to purchase with insufficient points THEN the System SHALL reject the transaction and display an error message
5. WHEN a User views the shop THEN the System SHALL display available items with costs and the user's current point balance

### Requirement 10

**User Story:** As a User, I want to authenticate securely, so that my progress is saved and protected.

#### Acceptance Criteria

1. WHEN a User accesses the System for the first time THEN the System SHALL present authentication options (Magic Link or Google Login)
2. WHEN a User completes authentication THEN the System SHALL create a session using Supabase Auth
3. WHEN a User's session expires THEN the System SHALL prompt for re-authentication before allowing check-ins or other actions
4. WHEN a User logs out THEN the System SHALL terminate the session and clear local authentication state
5. WHEN an unauthenticated User scans a QR code THEN the System SHALL redirect to the authentication screen before processing the check-in

### Requirement 11

**User Story:** As a User, I want the app to work as a PWA on my smartphone, so that I can use it like a native app.

#### Acceptance Criteria

1. WHEN a User accesses the System from a mobile browser THEN the System SHALL provide a manifest file for PWA installation
2. WHEN a User installs the PWA THEN the System SHALL be accessible from the home screen like a native application
3. WHEN the PWA loads THEN the System SHALL display a responsive interface optimized for mobile screens
4. WHEN the PWA is offline THEN the System SHALL display cached content and queue check-ins for later synchronization
5. WHEN network connectivity is restored THEN the System SHALL synchronize queued check-ins with Supabase

### Requirement 12

**User Story:** As a User, I want to view my stamp collection, so that I can see my attendance history visually.

#### Acceptance Criteria

1. WHEN a User views the stamp collection THEN the System SHALL display a calendar view with stamps for each check-in day
2. WHEN a check-in is recorded THEN the System SHALL add a stamp to the collection for that date
3. WHEN a User views a specific stamp THEN the System SHALL display the check-in date, time, and tag
4. WHEN a month has no check-ins THEN the System SHALL display empty stamp slots for that month
5. WHEN a User navigates between months THEN the System SHALL load and display stamps for the selected month

### Requirement 13

**User Story:** As a User, I want to see my dashboard with key information, so that I can quickly understand my current status.

#### Acceptance Criteria

1. WHEN a User opens the home screen THEN the System SHALL display today's check-in status with stamp indicator
2. WHEN a User opens the home screen THEN the System SHALL display monthly attendance count and current streak
3. WHEN a User opens the home screen THEN the System SHALL display available lottery ticket count
4. WHEN a User opens the home screen THEN the System SHALL display the active title and current level
5. WHEN a User opens the home screen THEN the System SHALL display up to three active daily quests with completion status

### Requirement 14

**User Story:** As a System Administrator, I want QR codes to contain location tags, so that different check-in locations can be tracked.

#### Acceptance Criteria

1. WHEN a QR code is generated THEN the System SHALL include a tag parameter in the URL (e.g., ?tag=officeA)
2. WHEN a check-in is processed THEN the System SHALL extract and validate the tag parameter from the URL
3. WHEN a tag is invalid or missing THEN the System SHALL use a default tag value
4. WHEN check-in records are stored THEN the System SHALL include the tag value in the attendances table
5. WHEN tag-specific achievements are configured THEN the System SHALL grant titles based on check-ins at specific tags

### Requirement 15

**User Story:** As a User, I want quest rewards to vary by quest rank, so that harder quests feel more rewarding.

#### Acceptance Criteria

1. WHEN a quest is defined THEN the System SHALL assign a rank (S/A/B/C) that determines reward multipliers
2. WHEN a rank S quest is completed THEN the System SHALL apply the highest reward multiplier to XP and Points
3. WHEN a rank C quest is completed THEN the System SHALL apply the lowest reward multiplier to XP and Points
4. WHEN quest rewards are calculated THEN the System SHALL multiply base rewards by the rank-specific multiplier
5. WHEN a User views a quest THEN the System SHALL display the quest rank and expected rewards
