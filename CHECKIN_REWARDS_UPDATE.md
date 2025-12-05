# チェックイン報酬機能の更新

## 概要

チェックイン時に以下の報酬を付与するように機能を更新しました：

- 🎫 **チケット**: 1枚（毎回）
- ⭐ **経験値**: 50 XP（毎回）
- 💎 **ポイント**: 10ポイント（毎回）

## デプロイ手順

Edge Functionを更新したため、Supabaseにデプロイする必要があります。

### 1. Supabase CLIでログイン

```bash
npx supabase login
```

### 2. プロジェクトにリンク

```bash
npx supabase link --project-ref <your-project-ref>
```

プロジェクトリファレンスは、SupabaseダッシュボードのProject Settings > General > Reference IDで確認できます。

### 3. Edge Functionsをデプロイ

```bash
# チェックイン機能
npx supabase functions deploy checkin

# くじ引き機能（認証エラー修正）
npx supabase functions deploy lottery-draw
```

### 4. 環境変数の確認

Edge Functionが以下の環境変数にアクセスできることを確認してください：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

これらは自動的に設定されますが、念のため確認：

```bash
npx supabase secrets list
```

## 変更内容

### Edge Function (`supabase/functions/checkin/index.ts`)

1. **`grantBaseRewards()` 関数を追加**
   - チェックイン時に経験値、ポイント、チケットを付与
   - レベルアップ判定を実装
   - `user_progress` レコードが存在しない場合は自動作成

2. **`checkAndGrantTickets()` を `checkAndGrantBonusTickets()` に変更**
   - 基本チケットは `grantBaseRewards()` で付与
   - 月間4回、8回、12回のボーナスチケットのみを処理

3. **レスポンスに報酬情報を追加**
   ```typescript
   rewards: {
     ticketsEarned: number,
     xpEarned: number,
     pointsEarned: number,
     levelUp: boolean,
     newLevel?: number,
     monthlyCount: number,
     streak: {...}
   }
   ```

### クライアント側 (`js/checkin.js`, `index.html`)

1. **チェックイン結果に報酬情報を追加**
   - `xpEarned`, `pointsEarned`, `levelUp`, `newLevel` を結果に含める

2. **報酬表示アラートを実装**
   - チェックイン成功時に獲得した報酬を表示
   - レベルアップ時は特別メッセージを表示
   - 新しい称号獲得時も表示

## テスト方法

### 1. デプロイ後の確認

```bash
# Edge Functionのログを確認
npx supabase functions logs checkin
```

### 2. チェックインをテスト

1. QRコードをスキャンしてチェックイン
2. アラートで以下が表示されることを確認：
   - チケット: 1枚
   - 経験値: +50 XP
   - ポイント: +10 ポイント

### 3. データベースを確認

```sql
-- user_progressを確認
SELECT * FROM user_progress WHERE user_id = '<your-user-id>';

-- lottery_ticketsを確認
SELECT * FROM lottery_tickets WHERE user_id = '<your-user-id>';
```

## トラブルシューティング

### チケットが0枚と表示される

**原因**: Edge Functionがデプロイされていない

**解決策**:
```bash
npx supabase functions deploy checkin
```

### 経験値が "Undefined Point" と表示される

**原因**: Edge Functionのレスポンスに報酬情報が含まれていない

**解決策**:
1. Edge Functionをデプロイ
2. ブラウザのコンソールでエラーを確認
3. Edge Functionのログを確認：
   ```bash
   npx supabase functions logs checkin --tail
   ```

### user_progress レコードが作成されない

**原因**: データベース権限の問題

**解決策**:
1. Supabaseダッシュボードで `user_progress` テーブルのRLSポリシーを確認
2. Service Roleキーを使用しているため、通常は問題ないはず
3. Edge Functionのログでエラーを確認

## レベルアップの計算式

```javascript
xpForNextLevel = 100 × (currentLevel ^ 1.5)
```

### レベルアップに必要なチェックイン回数

| レベル | 必要XP | チェックイン回数 |
|--------|--------|------------------|
| 1 → 2  | 100    | 2回              |
| 2 → 3  | 282    | 6回              |
| 3 → 4  | 519    | 10回             |
| 4 → 5  | 800    | 16回             |
| 5 → 6  | 1118   | 22回             |

## 報酬の詳細

### 基本報酬（毎回）

- **チケット**: 1枚
  - くじ引きに使用
  - ショップでも購入可能

- **経験値**: 50 XP
  - レベルアップに必要
  - レベルが上がると称号がアンロック

- **ポイント**: 10ポイント
  - ショップでアイテム購入に使用
  - 累積ポイントが記録される

### ボーナス報酬

- **月間4回目**: +1チケット
- **月間8回目**: +1チケット
- **月間12回目**: +1チケット

### その他の報酬

- **連続出社**: ストリークボーナス（将来実装予定）
- **称号アンロック**: 条件達成時に自動付与

## まとめ

この更新により、チェックインするたびに確実に報酬が獲得でき、ゲーミフィケーション要素が強化されました。

**重要**: Edge Functionのデプロイを忘れずに実行してください！

```bash
npx supabase functions deploy checkin
```
