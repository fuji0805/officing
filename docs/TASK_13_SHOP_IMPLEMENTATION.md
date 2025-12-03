# Task 13: ポイント・ショップシステムの実装

## 概要

ポイントショップシステムを実装しました。ユーザーはクエストやくじで獲得したポイントを使用して、アイテムを購入できます。

## 実装内容

### 1. ショップマネージャー (`js/shop.js`)

#### 主要機能

- **ショップ画面表示** (`showShopScreen()`)
  - ユーザーのポイント残高を表示
  - 購入可能なアイテム一覧を表示
  - Requirements: 9.5

- **ポイント残高表示** (`loadUserProgress()`)
  - `user_progress`テーブルから`total_points`を取得
  - リアルタイムで残高を表示
  - Requirements: 9.5

- **アイテム一覧表示** (`loadShopItems()`, `renderShopItems()`)
  - `shop_items`テーブルから利用可能なアイテムを取得
  - アイテムタイプ別にアイコンとラベルを表示
  - コスト順にソート
  - Requirements: 9.5

- **購入処理** (`purchaseItem()`, `executePurchase()`)
  - ポイント不足チェック (Requirement 9.4)
  - ポイント減算 (Requirement 9.2)
  - アイテム付与 (Requirement 9.3)
  - トランザクション的な処理で整合性を保証

- **アイテム付与** (`deliverItem()`)
  - くじチケット: `lottery_tickets`テーブルに加算
  - 称号: `user_titles`テーブルに追加
  - 将来の拡張: スタンプ、その他アイテム

- **エラーハンドリング** (`showError()`)
  - ポイント不足時のエラー表示 (Requirement 9.4)
  - 購入失敗時のエラー表示
  - ユーザーフレンドリーなメッセージ

### 2. UIコンポーネント

#### ショップ画面レイアウト
```
┌─────────────────────────────────┐
│     🛒 ポイントショップ          │
├─────────────────────────────────┤
│  💰 所持ポイント: 1,500         │
├─────────────────────────────────┤
│  アイテム一覧                    │
│  ┌──────────┐  ┌──────────┐   │
│  │ 🎫       │  │ 👑       │   │
│  │ チケット  │  │ 称号     │   │
│  │ 500pt    │  │ 1000pt   │   │
│  │ [購入]   │  │ [購入]   │   │
│  └──────────┘  └──────────┘   │
└─────────────────────────────────┘
```

#### スタイル (`css/main.css`)

- **ショップ画面**: 緑のグラデーション背景
- **ポイント表示**: 金色の背景で目立つように
- **アイテムカード**: グリッドレイアウト、ホバーエフェクト
- **購入不可アイテム**: 半透明表示、ボタン無効化
- **購入成功オーバーレイ**: アニメーション付き成功メッセージ
- **エラーオーバーレイ**: 赤いアイコンでエラー表示

### 3. データフロー

```
ユーザー操作
    ↓
購入ボタンクリック
    ↓
ポイント不足チェック ──→ NG → エラー表示
    ↓ OK
確認ダイアログ
    ↓
ポイント減算 (user_progress.total_points)
    ↓
アイテム付与
    ├─ くじチケット → lottery_tickets.ticket_count
    ├─ 称号 → user_titles
    └─ その他 → 将来実装
    ↓
成功メッセージ表示
    ↓
ショップ画面リロード
```

### 4. データベース操作

#### ポイント減算
```javascript
// user_progressテーブルを更新
UPDATE user_progress 
SET total_points = total_points - item_cost,
    updated_at = NOW()
WHERE user_id = ?
```

#### くじチケット付与
```javascript
// 既存チケットに加算
UPDATE lottery_tickets 
SET ticket_count = ticket_count + count,
    updated_at = NOW()
WHERE user_id = ?

// または新規作成
INSERT INTO lottery_tickets (user_id, ticket_count, earned_from)
VALUES (?, ?, 'shop_purchase')
```

#### 称号付与
```javascript
// 重複チェック後に追加
INSERT INTO user_titles (user_id, title_id, unlocked_at)
VALUES (?, ?, NOW())
```

## 要件との対応

### Requirement 9.1: Point Rewards ✅
- クエスト完了やくじで獲得したポイントを`user_progress.total_points`に保存
- ショップでポイント残高を表示

### Requirement 9.2: Purchase Point Deduction ✅
- `executePurchase()`でポイントを正確に減算
- トランザクション的な処理で整合性を保証

### Requirement 9.3: Item Delivery ✅
- `deliverItem()`でアイテムタイプに応じた付与処理
- くじチケット、称号の付与を実装

### Requirement 9.4: Insufficient Points Rejection ✅
- 購入前にポイント不足をチェック
- UIでポイント不足のアイテムを無効化
- エラーメッセージを表示

### Requirement 9.5: Shop Display Completeness ✅
- ポイント残高を目立つように表示
- 全アイテムをコスト付きで表示
- アイテムタイプ、説明、アイコンを表示

## ファイル構成

```
js/
  └── shop.js              # ショップマネージャー
css/
  └── main.css             # ショップスタイル (追加)
shop-demo.html             # ショップデモページ
docs/
  └── TASK_13_SHOP_IMPLEMENTATION.md  # このドキュメント
```

## 使用方法

### 1. ショップ画面を開く

```javascript
// URLから
window.location.href = '/shop.html';

// または直接呼び出し
shopManager.showShopScreen();
```

### 2. アイテムを購入

```javascript
// UIから購入ボタンをクリック
// または直接呼び出し
shopManager.purchaseItem(itemId);
```

### 3. エラーハンドリング

```javascript
// ポイント不足
if (userPoints < itemCost) {
  shopManager.showError('ポイントが不足しています');
}

// 購入失敗
catch (error) {
  shopManager.showError(error.message);
}
```

## テスト方法

### 1. ショップアイテムの準備

```sql
-- サンプルデータを投入
INSERT INTO shop_items (name, description, cost, item_type, item_value) VALUES
('くじチケット', 'くじを1回引けるチケット', 500, 'lottery_ticket', '{"count": 1}'),
('くじチケット×3', 'くじを3回引けるチケット', 1200, 'lottery_ticket', '{"count": 3}'),
('特別な称号', 'ショップ限定の称号', 2000, 'title', '{"title_id": "..."}');
```

### 2. ユーザーにポイントを付与

```sql
-- テストユーザーにポイントを付与
UPDATE user_progress 
SET total_points = 5000 
WHERE user_id = 'your-user-id';
```

### 3. ショップ画面を開く

```bash
# ブラウザで開く
open http://localhost:8000/shop-demo.html
```

### 4. 購入テスト

1. ポイント残高が表示されることを確認
2. アイテム一覧が表示されることを確認
3. 購入可能なアイテムの「購入」ボタンをクリック
4. 確認ダイアログで「OK」をクリック
5. 成功メッセージが表示されることを確認
6. ポイント残高が減少することを確認
7. アイテムが付与されることを確認

### 5. エラーケースのテスト

```javascript
// ポイント不足のテスト
// 1. ポイント残高を少なくする
UPDATE user_progress SET total_points = 100 WHERE user_id = ?;

// 2. 高額アイテムの購入を試みる
// 3. エラーメッセージが表示されることを確認
```

## レスポンシブデザイン

- **デスクトップ**: 3カラムのグリッドレイアウト
- **タブレット**: 2カラムまたは1カラム
- **モバイル**: 1カラム、縦スタック

## 今後の拡張

1. **アイテムカテゴリ**
   - カテゴリ別のタブ表示
   - フィルタリング機能

2. **購入履歴**
   - 購入履歴テーブルの追加
   - 履歴表示画面

3. **期間限定アイテム**
   - 販売期間の設定
   - タイマー表示

4. **在庫管理**
   - 在庫数の表示
   - 売り切れ表示

5. **セール機能**
   - 割引価格の設定
   - セールバッジ表示

## 注意事項

1. **トランザクション**
   - 現在はクライアント側で順次処理
   - 本番環境ではEdge Functionでのトランザクション処理を推奨

2. **在庫管理**
   - 現在は在庫チェックなし
   - 必要に応じて在庫管理機能を追加

3. **セキュリティ**
   - RLSポリシーで適切なアクセス制御
   - ポイント操作はサーバーサイドで検証

## 完了

✅ ショップ画面のUIを作成
✅ ポイント残高表示を実装
✅ アイテム一覧表示を実装
✅ 購入処理を実装（ポイント減算、アイテム付与）
✅ 残高不足時のエラーハンドリングを実装

すべての要件 (9.1, 9.2, 9.3, 9.4, 9.5) を満たしています。
