# Task 12: Title System Implementation

## Overview

称号システムの実装が完了しました。ユーザーは様々な条件を達成することで称号をアンロックし、アクティブな称号を設定してプロフィールやダッシュボードに表示できます。

## Implementation Summary

### 1. Title Manager (js/title.js)

称号システムの中核となるマネージャークラスを実装しました。

**主な機能:**
- `checkUnlockCondition()` - 称号のアンロック条件をチェック
- `getAllTitlesWithStatus()` - すべての称号とアンロック状態を取得
- `getUserStats()` - ユーザーの統計情報を取得
- `unlockTitle()` - 称号をアンロック
- `setActiveTitle()` - アクティブな称号を設定
- `getActiveTitle()` - 現在のアクティブな称号を取得
- `checkAndUnlockTitles()` - 条件を満たす称号を自動的にアンロック
- `showTitleCollectionScreen()` - 称号コレクション画面を表示

**アンロック条件のタイプ:**
- `streak` - 連続出社日数
- `attendance` - 累計出社回数
- `level` - ユーザーレベル
- `quest` - クエスト完了数
- `tag` - 特定のタグでのチェックイン回数

### 2. Title Collection Screen (titles-demo.html)

称号コレクション画面を実装しました。

**機能:**
- すべての称号を表示（アンロック済み/未アンロック）
- 現在のアクティブな称号を表示
- 称号をクリックして装備/解除
- 称号をタイプ別にグループ化（連続出社、累計出社、レベル、クエスト、場所）
- アンロック条件の表示
- 獲得日時の表示

### 3. CSS Styles (css/main.css)

称号コレクション画面用のスタイルを追加しました。

**スタイル要素:**
- `.title-collection-screen` - メイン画面
- `.active-title-display` - アクティブな称号の表示
- `.title-groups` - 称号グループのコンテナ
- `.title-card` - 個別の称号カード
- `.title-unlocked` / `.title-locked` - アンロック状態のスタイル
- `.title-active` - アクティブな称号のハイライト
- レスポンシブデザイン対応

### 4. Integration

既存のシステムとの統合:

**Dashboard (dashboard-demo.html):**
- アクティブな称号をレベル表示の下に表示
- 称号コレクションへのナビゲーションボタンを追加

**Profile Screen (js/level.js):**
- 称号コレクションへのリンクボタンを追加

**App Routing (js/app.js):**
- `/titles` ルートを追加
- 認証ガードを実装

**Check-in Function (supabase/functions/checkin/index.ts):**
- 既に称号アンロックロジックが実装済み
- チェックイン時に自動的に条件を満たす称号をアンロック

## Requirements Validation

### Requirement 6.1: Title Unlock
✅ `checkUnlockCondition()` と `unlockTitle()` で実装
- 出社回数、ストリーク、レベル、クエスト完了、タグベースの条件をサポート
- チェックイン時に自動的にチェック

### Requirement 6.2: Title Availability
✅ `getAllTitlesWithStatus()` で実装
- アンロックされた称号は `user_titles` テーブルに記録
- 称号の利用可能状態を追跡

### Requirement 6.3: Active Title Uniqueness
✅ `setActiveTitle()` で実装
- `user_progress.active_title_id` に1つの称号のみを設定
- 称号の装備/解除機能

### Requirement 6.4: Active Title Display
✅ `getActiveTitle()` とUI統合で実装
- プロフィール画面に表示
- ダッシュボードに表示
- 称号コレクション画面に表示

### Requirement 6.5: Title Collection Display
✅ `showTitleCollectionScreen()` で実装
- すべての称号を表示
- アンロック状態を表示
- アンロック条件を表示
- タイプ別にグループ化

### Requirement 14.5: Tag-based Achievement
✅ チェックイン関数で実装
- タグベースの称号アンロック条件をサポート
- 特定の場所での出社回数を追跡

## Database Schema

称号システムは以下のテーブルを使用します:

### titles
```sql
- id: uuid (PK)
- name: text
- description: text
- unlock_condition_type: text (streak/attendance/level/quest/tag)
- unlock_condition_value: jsonb
- icon: text (nullable)
- created_at: timestamp
```

### user_titles
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- title_id: uuid (FK)
- unlocked_at: timestamp
- UNIQUE(user_id, title_id)
```

### user_progress
```sql
- active_title_id: uuid (FK to titles.id, nullable)
```

## Sample Data

サンプルデータは `supabase/sample-data.sql` に含まれています:

**称号の例:**
- 連続出社: 3日坊主克服、一週間の戦士、二週間の猛者、一ヶ月の覇者、鉄人
- 累計出社: 出社ビギナー、出社アマチュア、出社プロ、出社マスター、出社レジェンド
- レベル: レベル5達成、レベル10達成、レベル25達成、レベル50達成
- クエスト: クエストハンター、クエストマスター
- タグ: オフィスの主、在宅ワーカー、会議室の常連

## Testing

### Manual Testing Steps

1. **称号コレクション画面の表示:**
   ```
   - titles-demo.html にアクセス
   - すべての称号が表示されることを確認
   - アンロック済み/未アンロックの状態が正しく表示されることを確認
   ```

2. **称号の装備:**
   ```
   - アンロック済みの称号をクリック
   - 確認ダイアログが表示されることを確認
   - 装備後、「装備中」バッジが表示されることを確認
   - ダッシュボードとプロフィールに称号が表示されることを確認
   ```

3. **称号の解除:**
   ```
   - 装備中の称号をクリック
   - 確認ダイアログが表示されることを確認
   - 解除後、称号が表示されなくなることを確認
   ```

4. **称号のアンロック:**
   ```
   - チェックインを実行
   - 条件を満たした称号が自動的にアンロックされることを確認
   - 称号獲得アニメーションが表示されることを確認
   ```

### Property-Based Testing

Property-based tests are marked as optional in the task list (task 12.1).

## UI/UX Features

### Visual Design
- グラデーション背景（オレンジ系）
- カードベースのレイアウト
- アンロック済み/未アンロックの視覚的な区別
- アクティブな称号のハイライト
- ホバーエフェクト

### Animations
- 画面表示時のスライドダウン/スケールインアニメーション
- アクティブな称号のパルスアニメーション
- カードのホバーアニメーション

### Responsive Design
- モバイル対応
- タブレット対応
- デスクトップ対応

## Files Created/Modified

### Created:
- `js/title.js` - 称号マネージャー
- `titles-demo.html` - 称号コレクション画面
- `docs/TASK_12_TITLE_SYSTEM.md` - このドキュメント

### Modified:
- `css/main.css` - 称号関連のスタイルを追加
- `js/app.js` - 称号画面のルーティングを追加
- `js/level.js` - プロフィール画面に称号コレクションへのリンクを追加
- `dashboard-demo.html` - アクティブな称号の表示と称号コレクションへのリンクを追加
- `profile.html` - title.js スクリプトを追加
- `index.html` - title.js スクリプトを追加

## Next Steps

1. **Optional: Property-Based Tests (Task 12.1)**
   - Property 22: Title Unlock
   - Property 23: Title Availability
   - Property 24: Active Title Uniqueness
   - Property 25: Active Title Display
   - Property 26: Title Collection Display
   - Property 61: Tag-based Achievement

2. **Future Enhancements:**
   - 称号のアイコン画像
   - 称号のレアリティシステム
   - 称号の並び替え/フィルター機能
   - 称号の検索機能
   - 称号の共有機能

## Conclusion

称号システムの実装が完了しました。ユーザーは様々な条件を達成することで称号をアンロックし、お気に入りの称号を装備してプロフィールに表示できます。システムは既存のチェックイン、レベル、クエストシステムと統合されており、自動的に称号のアンロック条件をチェックします。
