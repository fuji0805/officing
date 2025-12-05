# Edge Functions デプロイ手順

## 現在のエラー

くじ引き機能で `401 Unauthorized` エラーが発生しています。これは、Edge Functionのコードを修正しましたが、Supabaseにデプロイしていないためです。

## デプロイ手順

### 1. Supabase CLIのインストール確認

```bash
npx supabase --version
```

### 2. Supabaseにログイン

```bash
npx supabase login
```

ブラウザが開くので、Supabaseアカウントでログインしてください。

### 3. プロジェクトにリンク（初回のみ）

```bash
npx supabase link --project-ref uudcybalamailzeydebz
```

プロジェクトリファレンス `uudcybalamailzeydebz` は、エラーメッセージのURLから取得しました。

### 4. Edge Functionsをデプロイ

```bash
# くじ引き機能（401エラー修正）
npx supabase functions deploy lottery-draw

# チェックイン機能（報酬付与機能追加）
npx supabase functions deploy checkin
```

### 5. デプロイの確認

```bash
# デプロイされたFunctionを確認
npx supabase functions list
```

## デプロイ後のテスト

### 1. くじ引きをテスト

1. アプリにログイン
2. チェックインしてチケットを獲得
3. くじ引き画面に移動
4. 「くじを引く」ボタンをクリック
5. エラーなく景品が表示されることを確認

### 2. ログを確認

デプロイ後もエラーが発生する場合は、ログを確認：

```bash
# リアルタイムでログを表示
npx supabase functions logs lottery-draw --tail

# 最新100行のログを表示
npx supabase functions logs lottery-draw --limit 100
```

## トラブルシューティング

### エラー: "Project ref not found"

プロジェクトにリンクされていません：

```bash
npx supabase link --project-ref uudcybalamailzeydebz
```

### エラー: "Not logged in"

Supabaseにログインしていません：

```bash
npx supabase login
```

### エラー: "Function not found"

Functionのディレクトリ構造を確認：

```bash
ls -la supabase/functions/lottery-draw/
```

`index.ts` ファイルが存在することを確認してください。

### デプロイは成功したが、まだ401エラーが出る

1. **ブラウザのキャッシュをクリア**
   - Cmd+Shift+R (Mac) または Ctrl+Shift+R (Windows)

2. **ログアウトして再ログイン**
   - アプリからログアウト
   - 再度ログイン

3. **Edge Functionのログを確認**
   ```bash
   npx supabase functions logs lottery-draw --tail
   ```
   
   ログに表示されるエラーメッセージを確認してください。

4. **環境変数を確認**
   ```bash
   npx supabase secrets list
   ```
   
   `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` が設定されていることを確認。

## デプロイ完了の確認

デプロイが成功すると、以下のようなメッセージが表示されます：

```
Deploying function lottery-draw...
Function lottery-draw deployed successfully!
Function URL: https://uudcybalamailzeydebz.supabase.co/functions/v1/lottery-draw
```

## 次のステップ

デプロイ後、以下を確認してください：

1. ✅ くじ引きが正常に動作する
2. ✅ チケットが正しく消費される
3. ✅ 景品が正しく付与される
4. ✅ ポイントが正しく加算される

問題が解決しない場合は、ログを確認して具体的なエラーメッセージを教えてください。
