# Supabaseセットアップガイド

このガイドでは、Officingアプリケーション用のSupabaseプロジェクトをセットアップする手順を説明します。

## 📋 前提条件

- Supabaseアカウント（無料で作成可能）
- メールアドレス

## 🚀 セットアップ手順

### ステップ1: Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ/ログイン
4. 「New Project」をクリック
5. プロジェクト情報を入力:
   - **Name**: `officing` （任意の名前）
   - **Database Password**: 強力なパスワードを生成（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` （日本の場合）
   - **Pricing Plan**: `Free` （無料プラン）
6. 「Create new project」をクリック
7. プロジェクトの作成を待つ（1-2分）

### ステップ2: API認証情報の取得

1. プロジェクトダッシュボードで、左サイドバーの「Settings」（⚙️）をクリック
2. 「API」セクションを選択
3. 以下の情報をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### ステップ3: アプリケーションの設定

1. プロジェクトルートの `js/config.js` を開く
2. 以下の値を更新:

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co', // ← ここに Project URL を貼り付け
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // ← ここに anon key を貼り付け
  // ...
};
```

3. ファイルを保存

### ステップ4: 認証設定

1. Supabaseダッシュボードで「Authentication」→「Providers」を選択
2. **Email** プロバイダーを有効化:
   - 「Email」をクリック
   - 「Enable Email provider」をON
   - 「Confirm email」をOFFにする（開発中は簡単にするため）
   - 「Save」をクリック

3. **Google OAuth**（オプション）:
   - 「Google」をクリック
   - 「Enable Google provider」をON
   - Google Cloud Consoleで OAuth 2.0 クライアントIDを作成
   - Client IDとClient Secretを入力
   - 「Save」をクリック

### ステップ5: データベーススキーマの作成

1. Supabaseダッシュボードで「SQL Editor」を選択
2. 「New Query」をクリック
3. `supabase/schema.sql` ファイルの内容をすべてコピー
4. SQL Editorに貼り付け
5. 「Run」をクリック（または Ctrl+Enter / Cmd+Enter）
6. 実行完了を待つ（数秒）
7. 成功メッセージが表示されることを確認

詳細な手順は `supabase/README.md` を参照してください。

**作成されるテーブル**:
- `user_progress` - ユーザーのレベル、XP、ポイント、ストリーク
- `attendances` - チェックイン記録
- `lottery_tickets` - くじチケット
- `prizes` - 景品マスターデータ
- `lottery_log` - くじ抽選履歴
- `quests` - クエストマスターデータ
- `user_quest_logs` - クエスト進捗
- `titles` - 称号マスターデータ
- `user_titles` - ユーザーの獲得称号
- `shop_items` - ショップアイテムマスターデータ

### ステップ6: マスターデータの投入

1. SQL Editorで新しいクエリを作成
2. `supabase/master-data.sql` ファイルの内容をコピー
3. SQL Editorに貼り付け
4. 「Run」をクリック
5. 成功メッセージを確認

**投入されるデータ**:
- クエストマスターデータ（デイリークエスト）
- 称号マスターデータ（ストリーク、レベル、タグベース）
- 景品マスターデータ（S/A/B/Cランク）
- ショップアイテムマスターデータ

詳細は `supabase/MASTER_DATA_REFERENCE.md` を参照してください。

### ステップ7: Edge Functionsのデプロイ

Edge Functionsは、チェックイン、くじ抽選、クエスト完了などのサーバーサイドロジックを実行します。

#### 7.1 Supabase CLIのインストール

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm経由（全プラットフォーム）
npm install -g supabase
```

#### 7.2 Supabaseにログイン

```bash
supabase login
```

ブラウザが開くので、Supabaseアカウントでログインします。

#### 7.3 プロジェクトをリンク

```bash
# プロジェクトのルートディレクトリで実行
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF` は、Supabaseダッシュボードの Settings → General → Reference ID で確認できます。

#### 7.4 Edge Functionsをデプロイ

**重要**: プロジェクトのルートディレクトリから実行してください（`supabase/` フォルダがある場所）

```bash
# プロジェクトのルートディレクトリにいることを確認
# （supabase/ フォルダが見える場所）
pwd  # 現在のディレクトリを確認

# 各Functionをデプロイ
supabase functions deploy checkin
supabase functions deploy lottery-draw
supabase functions deploy quest-complete
```

または一括デプロイ：

```bash
# プロジェクトルートから実行
bash supabase/functions/deploy.sh
```

#### 7.5 デプロイの確認

1. Supabaseダッシュボードで「Edge Functions」を選択
2. 以下の3つのFunctionが表示されることを確認:
   - `checkin`
   - `lottery-draw`
   - `quest-complete`
3. 各Functionの「Logs」で正常に起動しているか確認

#### 7.6 Functionのテスト

各Functionディレクトリに `test.sh` スクリプトがあります：

```bash
# チェックインFunctionのテスト
cd supabase/functions/checkin
./test.sh

# くじ抽選Functionのテスト
cd supabase/functions/lottery-draw
./test.sh

# クエスト完了Functionのテスト
cd supabase/functions/quest-complete
./test.sh
```

詳細は各Functionの `IMPLEMENTATION.md` を参照してください。

### ステップ8: 認証URLの設定

1. Supabaseダッシュボードで「Authentication」→「URL Configuration」を選択
2. **Site URL** にアプリケーションのURLを追加:
   - ローカル開発: `http://localhost:8000`
   - 本番環境: `https://YOUR_DOMAIN.com`
3. **Redirect URLs** に以下を追加:
   - `http://localhost:8000/**`
   - `https://YOUR_DOMAIN.com/**`
4. 「Save」をクリック

これにより、認証後のリダイレクトが正しく動作します。

## ✅ 確認

設定が正しく完了したか確認するには:

1. ローカルサーバーを起動:
   ```bash
   python -m http.server 8000
   ```

2. ブラウザで `http://localhost:8000` を開く

3. ブラウザの開発者ツール（F12）を開き、コンソールを確認

4. 以下のメッセージが表示されればOK:
   ```
   ✅ Supabase client initialized
   🚀 Initializing Officing App...
   ✅ App initialized
   ```

5. 警告メッセージが表示される場合は、`js/config.js` の設定を再確認してください

## 🔧 トラブルシューティング

### エラー: "Supabase client not initialized"

**原因**: `js/config.js` の設定が正しくない

**解決方法**:
1. `SUPABASE_URL` と `SUPABASE_ANON_KEY` が正しくコピーされているか確認
2. URLの末尾に `/` がないことを確認
3. キーに余分なスペースや改行がないことを確認

### エラー: "Failed to fetch"

**原因**: ネットワーク接続の問題、またはSupabaseプロジェクトが起動していない

**解決方法**:
1. インターネット接続を確認
2. Supabaseダッシュボードでプロジェクトが「Active」状態か確認
3. プロジェクトが一時停止している場合は、再起動

### 警告: "Supabase設定が未完了です"

**原因**: `js/config.js` がデフォルト値のまま

**解決方法**:
1. ステップ2とステップ3を再度実行
2. ファイルを保存したか確認
3. ブラウザをリロード（Ctrl+Shift+R / Cmd+Shift+R）

## 🧪 テストデータの投入（オプション）

開発やテスト用にサンプルデータを投入できます。

### テストユーザーの作成

```bash
cd supabase
./setup-test-users.sh
```

または手動で：

1. SQL Editorで `seed-test-users.js` の内容を確認
2. Supabaseダッシュボードの「Authentication」→「Users」で手動作成

### テストデータの投入

1. SQL Editorで新しいクエリを作成
2. `supabase/seed-test-data.sql` の内容をコピー
3. 実行

詳細は `docs/TEST_DATA_GUIDE.md` を参照してください。

## 📊 データベースの確認

### Table Editorで確認

1. Supabaseダッシュボードで「Table Editor」を選択
2. 各テーブルを確認:
   - `quests` - クエストマスターデータが投入されているか
   - `titles` - 称号マスターデータが投入されているか
   - `prizes` - 景品マスターデータが投入されているか
   - `shop_items` - ショップアイテムが投入されているか

### SQLで確認

SQL Editorで以下のクエリを実行：

```sql
-- クエスト数の確認
SELECT COUNT(*) as quest_count FROM quests;

-- 称号数の確認
SELECT COUNT(*) as title_count FROM titles;

-- 景品数の確認
SELECT COUNT(*) as prize_count FROM prizes;

-- ショップアイテム数の確認
SELECT COUNT(*) as shop_item_count FROM shop_items;
```

期待される結果：
- クエスト: 10件以上
- 称号: 8件以上
- 景品: 10件以上
- ショップアイテム: 5件以上

## 🔒 セキュリティ設定

### Row Level Security (RLS)

`schema.sql` で自動的に設定されますが、確認方法：

1. Table Editorで各テーブルを選択
2. 「RLS」タブを確認
3. 各テーブルでRLSが有効になっているか確認

### ポリシーの確認

各テーブルに以下のポリシーが設定されているか確認：

- **SELECT**: ユーザーは自分のデータのみ閲覧可能
- **INSERT**: ユーザーは自分のデータのみ挿入可能
- **UPDATE**: ユーザーは自分のデータのみ更新可能
- **DELETE**: ユーザーは自分のデータのみ削除可能

### API Keyの管理

⚠️ **重要**: 以下のキーは絶対に公開しないでください：

- ❌ `service_role` key - 管理者権限、絶対に秘密
- ✅ `anon` key - 公開しても安全（RLSで保護）

`js/config.js` には `anon` key のみを使用してください。

## 📚 次のステップ

Supabaseのセットアップが完了したら：

1. **ローカルで動作確認**: `python -m http.server 8000`
2. **認証テスト**: Magic Linkでログイン
3. **チェックインテスト**: QRコードを生成してチェックイン
4. **デプロイ**: [デプロイ手順書](./DEPLOYMENT.md) を参照

## 🔗 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 📞 サポート

問題が発生した場合：

1. [Supabase Discord](https://discord.supabase.com/) でコミュニティに質問
2. [Supabase GitHub](https://github.com/supabase/supabase/discussions) でディスカッション
3. プロジェクトのGitHub issueを作成
