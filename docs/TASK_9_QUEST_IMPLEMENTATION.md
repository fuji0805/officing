# Task 9: Quest System Implementation

## Overview

クエストシステムの実装が完了しました。ユーザーはデイリークエストを受け取り、完了することで報酬（XP、ポイント）を獲得できます。

## Implemented Features

### 1. Quest Screen UI (クエスト画面のUI)
- **Location**: `js/quest.js` - `showQuestScreen()`
- **Features**:
  - クエスト一覧の表示
  - ランク別のバッジ表示（S/A/B/C）
  - 報酬情報の表示（XP、ポイント）
  - 完了状態の表示
  - 空の状態の処理

### 2. Daily Quest Generation (デイリークエスト生成)
- **Location**: `js/quest.js` - `generateDailyQuests()`
- **Requirements**: 7.1
- **Logic**:
  - デイリークエストプールから3つランダムに選択
  - 今日の日付で `user_quest_logs` に記録
  - 既存のクエストがある場合は生成しない

### 3. Quest List Display (クエスト一覧表示)
- **Location**: `js/quest.js` - `renderQuestList()`
- **Requirements**: 7.5
- **Features**:
  - クエストタイトル、説明、ランク、報酬を表示
  - ランク別の色分け（S=金、A=紫、B=青、C=緑）
  - 完了済みクエストの視覚的な区別
  - 報酬計算（ランク別マルチプライヤー適用）

### 4. Quest Completion (クエスト完了)
- **Location**: `js/quest.js` - `completeQuest()`
- **Requirements**: 7.2, 7.3
- **Logic**:
  - クエストログを更新（完了時刻、獲得XP、獲得ポイント）
  - ランク別報酬計算（S=3.0x, A=2.0x, B=1.5x, C=1.0x）
  - ユーザー進捗を更新（XP、ポイント）
  - レベルアップ判定
  - 報酬アニメーション表示

### 5. Reward Display (報酬表示)
- **Location**: `js/quest.js` - `showRewardAnimation()`
- **Features**:
  - 報酬獲得アニメーション
  - XP、ポイントの表示
  - レベルアップ通知

### 6. Daily Quest Reset (デイリークエストリセット)
- **Location**: `js/quest.js` - `resetDailyQuests()`
- **Requirements**: 7.4
- **Logic**:
  - 今日より前の未完了デイリークエストを削除
  - 新しいクエストの生成を可能にする

## Rank Multipliers

クエストランクに応じた報酬マルチプライヤー:

```javascript
{
  'S': 3.0,  // 超レア - 基本報酬の3倍
  'A': 2.0,  // レア - 基本報酬の2倍
  'B': 1.5,  // アンコモン - 基本報酬の1.5倍
  'C': 1.0   // コモン - 基本報酬そのまま
}
```

## Database Schema

### user_quest_logs Table

```sql
CREATE TABLE user_quest_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    quest_id UUID REFERENCES quests(id),
    assigned_date DATE,           -- クエスト割り当て日
    completed_at TIMESTAMP,       -- 完了時刻（NULL = 未完了）
    xp_earned INTEGER,            -- 獲得XP
    points_earned INTEGER,        -- 獲得ポイント
    created_at TIMESTAMP
);
```

### quests Table (Master Data)

```sql
CREATE TABLE quests (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    quest_type TEXT CHECK (quest_type IN ('daily', 'weekly', 'flex')),
    rank TEXT CHECK (rank IN ('S', 'A', 'B', 'C')),
    base_xp INTEGER NOT NULL,
    base_points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);
```

## Styling

### CSS Classes

- `.quest-screen` - クエスト画面全体
- `.quest-container` - コンテナ
- `.quest-card` - メインカード
- `.quest-list` - クエスト一覧
- `.quest-item` - 個別クエスト
- `.quest-rank-badge` - ランクバッジ
- `.quest-completed` - 完了済みクエスト
- `.reward-overlay` - 報酬アニメーション

### Color Scheme

- S Rank: Gold gradient (#FCD34D → #F59E0B)
- A Rank: Purple gradient (#A78BFA → #8B5CF6)
- B Rank: Blue gradient (#60A5FA → #3B82F6)
- C Rank: Green gradient (#34D399 → #10B981)

## Routing

クエスト画面へのアクセス:
- URL: `/quests` または `/quests.html`
- 認証が必要
- `app.js` の `handleRoute()` で処理

## Demo Page

デモページが用意されています:
- **File**: `quest-demo.html`
- **Purpose**: クエストUIの視覚的な確認
- **Features**: 
  - S/A/Bランクのクエスト表示
  - 完了済みクエストの表示
  - レスポンシブデザイン

## Usage Example

### クエスト画面を表示

```javascript
// ルーティング経由
window.location.href = '/quests';

// 直接呼び出し
questManager.showQuestScreen();
```

### デイリークエストを生成

```javascript
await questManager.generateDailyQuests();
```

### クエストを完了

```javascript
await questManager.completeQuest(logId);
```

## Future Enhancements

現在の実装は基本機能のみです。将来的には以下の機能を追加できます:

1. **Edge Function Integration**
   - クエスト完了処理をEdge Functionに移行
   - より複雑な報酬計算
   - 称号アンロック判定

2. **Weekly/Flex Quests**
   - 週間クエストの実装
   - 常設クエストの実装

3. **Quest Progress Tracking**
   - クエストの進捗状況を追跡
   - 部分的な完了状態の表示

4. **Auto-completion Detection**
   - 条件を満たしたクエストの自動完了
   - バックグラウンドでの進捗チェック

5. **Quest Notifications**
   - 新しいクエストの通知
   - 完了可能なクエストの通知

## Testing

### Manual Testing Steps

1. **Quest Screen Display**
   - `/quests` にアクセス
   - クエスト一覧が表示されることを確認

2. **Quest Generation**
   - 「クエストを生成」ボタンをクリック
   - 3つのクエストが生成されることを確認

3. **Quest Completion**
   - 「完了する」ボタンをクリック
   - 報酬アニメーションが表示されることを確認
   - クエストが完了済みになることを確認

4. **Reward Calculation**
   - 各ランクのクエストを完了
   - 報酬が正しく計算されることを確認

5. **Demo Page**
   - `quest-demo.html` を開く
   - UIが正しく表示されることを確認

## Requirements Coverage

✅ **Requirement 7.1**: デイリークエスト生成ロジック実装済み
✅ **Requirement 7.4**: デイリークエストリセット機能実装済み
✅ **Requirement 7.5**: クエスト一覧表示実装済み

追加実装:
✅ **Requirement 7.2**: クエスト報酬計算（ランク別マルチプライヤー）
✅ **Requirement 7.3**: クエスト完了ログ記録

## Files Modified/Created

### Created
- `js/quest.js` - クエストシステムのメインロジック
- `quest-demo.html` - デモページ
- `docs/TASK_9_QUEST_IMPLEMENTATION.md` - このドキュメント

### Modified
- `js/app.js` - クエスト画面へのルーティング追加
- `css/main.css` - クエスト関連のスタイル追加
- `index.html` - quest.js スクリプトの読み込み追加

## Notes

1. **Edge Function**: 現在はクライアント側で直接データベースを更新していますが、将来的にはEdge Functionに移行することを推奨します。

2. **Cron Job**: デイリークエストのリセットは、本来はサーバー側のcronジョブで実行すべきですが、現在は手動リセット機能として実装されています。

3. **Level-up Logic**: レベルアップロジックは簡易版です。より複雑なロジックが必要な場合は、Task 11で実装されます。

4. **Title Unlock**: 称号アンロック判定は現在未実装です。Task 12で実装されます。

## Completion Status

✅ Task 9 完了

すべての要件が実装され、クエストシステムが正常に動作します。
