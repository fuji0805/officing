# Task 14: スタンプ帳機能の実装

## 概要

スタンプ帳機能を実装しました。ユーザーは月別のカレンダービューで自分のチェックイン履歴を視覚的に確認でき、各スタンプの詳細情報（日時、タグ）を表示できます。

## 実装内容

### 1. スタンプ帳画面のUI作成（カレンダービュー）

**ファイル**: `js/stamp.js`, `css/main.css`, `stamps.html`

- カレンダーグリッドレイアウト（7列 × 週数）
- 曜日ヘッダー表示
- 日付セルの表示
- スタンプがある日は🎫アイコンを表示
- 今日の日付をハイライト表示
- レスポンシブデザイン対応

**Requirements**: 12.1, 12.2, 12.4

### 2. 月別スタンプデータ取得

**実装**: `StampManager.loadStamps(year, month)`

```javascript
async loadStamps(year, month) {
  const { data, error } = await client
    .from('attendances')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .order('check_in_date', { ascending: true });
  
  this.stamps = data || [];
}
```

- Supabaseから指定された年月のスタンプデータを取得
- `attendances`テーブルから`year`と`month`でフィルタリング
- 日付順にソート

**Requirements**: 12.1, 12.2

### 3. スタンプ表示ロジック

**実装**: `StampManager.renderCalendar()`

- 月の最初の日の曜日を計算
- 月の日数を計算
- スタンプデータを日付でマッピング
- カレンダーグリッドをレンダリング
- スタンプがある日にアイコンを表示
- クリック可能なスタンプセル

**Requirements**: 12.1, 12.2

### 4. スタンプ詳細表示（日時、タグ）

**実装**: `StampManager.showStampDetail(day)`

モーダルウィンドウで以下の情報を表示：
- 🎫 スタンプアイコン（アニメーション付き）
- 📅 日付（年月日、曜日）
- 🕐 時刻（時:分）
- 📍 場所（タグ）

**Requirements**: 12.3

### 5. 月間ナビゲーション機能

**実装**: `StampManager.navigateMonth(direction)`

```javascript
async navigateMonth(direction) {
  this.currentMonth += direction;
  
  // 年をまたぐ処理
  if (this.currentMonth < 1) {
    this.currentMonth = 12;
    this.currentYear--;
  } else if (this.currentMonth > 12) {
    this.currentMonth = 1;
    this.currentYear++;
  }
  
  await this.loadStamps(this.currentYear, this.currentMonth);
  // UIを更新
}
```

- 前月/次月ボタン
- 年をまたぐ処理
- スタンプデータの再読み込み
- カレンダー表示の更新

**Requirements**: 12.5

### 6. 空の月の表示

**実装**: カレンダー下部に空状態メッセージ

```html
<div class="stamp-empty-state">
  <div class="stamp-empty-icon">📭</div>
  <div class="stamp-empty-text">この月のスタンプはまだありません</div>
</div>
```

- スタンプが0件の場合に表示
- 視覚的なフィードバック

**Requirements**: 12.4

## ファイル構成

### 新規作成ファイル

1. **js/stamp.js** - スタンプ帳機能のメインロジック
   - `StampManager`クラス
   - カレンダーレンダリング
   - スタンプデータ管理
   - 月間ナビゲーション

2. **stamps.html** - スタンプ帳専用ページ
   - 認証チェック
   - スタンプ帳画面の初期化

3. **stamp-demo.html** - デモページ
   - モックデータを使用
   - スタンドアロンで動作確認可能

4. **docs/TASK_14_STAMP_COLLECTION.md** - このドキュメント

### 更新ファイル

1. **css/main.css** - スタンプ帳用スタイル追加
   - `.stamp-collection-screen`
   - `.calendar-grid`
   - `.stamp-detail-modal`
   - レスポンシブデザイン

2. **js/app.js** - ルーティング追加
   - `/stamps`パスのハンドリング

3. **index.html** - スクリプト追加
   - `stamp.js`の読み込み

## UIコンポーネント

### カレンダーグリッド

```
┌─────────────────────────────────────┐
│  日  月  火  水  木  金  土          │
├─────────────────────────────────────┤
│      1   2   3   4   5   6          │
│  7   8🎫 9🎫 10  11🎫 12  13         │
│  14🎫 15  16  17  18  19  20         │
│  21  22  23  24  25  26  27         │
│  28  29  30  31                     │
└─────────────────────────────────────┘
```

### スタンプ詳細モーダル

```
┌─────────────────────────────────────┐
│  スタンプ詳細                    ✕  │
├─────────────────────────────────────┤
│           🎫                         │
│     2024年12月08日 (日)              │
│         09:15                        │
├─────────────────────────────────────┤
│  📍 場所      officeA                │
│  📅 日付      2024年12月08日 (日)    │
│  🕐 時刻      09:15                  │
└─────────────────────────────────────┘
```

## スタイリング

### カラースキーム

- 背景グラデーション: `#EC4899` → `#DB2777` (ピンク系)
- スタンプセル: `#FEF3C7` → `#FDE68A` (イエロー系)
- 今日の日付: `#4F46E5` (プライマリカラー)

### アニメーション

- `stampPop`: スタンプアイコンの出現アニメーション
- `bounce`: スタンプ詳細アイコンのバウンス
- `scaleIn`: モーダルの拡大表示
- `fadeIn`: モーダル背景のフェードイン

## レスポンシブデザイン

### モバイル対応 (< 768px)

- 月間ナビゲーションを縦並びに変更
- カレンダーグリッドの間隔を縮小
- フォントサイズの調整
- スタンプアイコンサイズの縮小

### 小画面対応 (< 480px)

- カレンダー日付番号をさらに縮小
- スタンプ詳細を縦並びレイアウトに変更

## データフロー

```
User Action (月選択/スタンプクリック)
    ↓
StampManager
    ↓
Supabase Query (attendances table)
    ↓
Filter by user_id, year, month
    ↓
Render Calendar / Show Detail
    ↓
Display to User
```

## 使用方法

### 基本的な使い方

1. `/stamps.html`にアクセス
2. 認証済みの場合、現在の月のスタンプ帳が表示される
3. 前月/次月ボタンで月を切り替え
4. スタンプをクリックして詳細を表示

### プログラムからの呼び出し

```javascript
// スタンプ帳画面を表示
await stampManager.showStampCollectionScreen();

// 特定の月のスタンプを読み込み
await stampManager.loadStamps(2024, 12);

// 月を移動
await stampManager.navigateMonth(-1); // 前月
await stampManager.navigateMonth(1);  // 次月

// スタンプ詳細を表示
stampManager.showStampDetail(8); // 8日のスタンプ

// 詳細モーダルを閉じる
stampManager.closeStampDetail();
```

## テスト

### デモページでの確認

`stamp-demo.html`を開くと、モックデータを使用してスタンプ帳機能を確認できます：

- 現在の月に8個のサンプルスタンプ
- 月間ナビゲーション
- スタンプ詳細表示
- 空の月の表示

### 確認項目

- ✅ カレンダーが正しく表示される
- ✅ スタンプがある日に🎫アイコンが表示される
- ✅ 今日の日付がハイライトされる
- ✅ スタンプをクリックすると詳細が表示される
- ✅ 詳細に日時とタグが表示される
- ✅ 前月/次月ボタンで月を移動できる
- ✅ 年をまたいで移動できる
- ✅ スタンプがない月に空状態が表示される
- ✅ モバイル画面で正しく表示される

## データベース連携

### 使用テーブル

**attendances**
- `user_id`: ユーザーID
- `check_in_date`: チェックイン日付
- `check_in_time`: チェックイン時刻
- `tag`: 場所タグ
- `month`: 月 (1-12)
- `year`: 年

### クエリ例

```sql
SELECT *
FROM attendances
WHERE user_id = 'xxx'
  AND year = 2024
  AND month = 12
ORDER BY check_in_date ASC;
```

## パフォーマンス最適化

1. **インデックス活用**
   - `idx_attendances_user_year_month`インデックスを使用
   - 高速な月別データ取得

2. **データキャッシュ**
   - 現在表示中の月のデータを`this.stamps`にキャッシュ
   - 月移動時のみ再読み込み

3. **レンダリング最適化**
   - カレンダーは月移動時のみ再レンダリング
   - スタンプ詳細はモーダル内で動的に生成

## 今後の拡張案

1. **統計情報の追加**
   - 月間出社日数
   - 最も使用されたタグ
   - 連続出社記録

2. **フィルタリング機能**
   - タグ別フィルター
   - 曜日別フィルター

3. **エクスポート機能**
   - CSV出力
   - PDF出力

4. **カレンダービューの拡張**
   - 年間ビュー
   - 週間ビュー

5. **スタンプのカスタマイズ**
   - タグ別アイコン
   - 特別な日のマーク

## まとめ

スタンプ帳機能の実装が完了しました。ユーザーは月別のカレンダービューで自分のチェックイン履歴を視覚的に確認でき、各スタンプの詳細情報を表示できます。レスポンシブデザインに対応し、モバイルでも快適に使用できます。

**実装された要件**:
- ✅ 12.1: カレンダービューでスタンプを表示
- ✅ 12.2: チェックイン時にスタンプを追加
- ✅ 12.3: スタンプ詳細（日時、タグ）を表示
- ✅ 12.4: 空の月を適切に表示
- ✅ 12.5: 月間ナビゲーション機能
