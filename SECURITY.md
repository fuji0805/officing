# セキュリティガイド

## 🔒 セットアップ時のセキュリティ

### 1. Supabase設定

このアプリケーションはSupabaseを使用しています。セットアップ時は以下の手順に従ってください：

1. `js/config.example.js` を `js/config.js` にコピー
2. Supabaseプロジェクトの認証情報を設定
3. **config.jsは絶対にGitにコミットしないでください**（.gitignoreに含まれています）

### 2. Row Level Security (RLS)

Supabaseのすべてのテーブルで、Row Level Security (RLS) を有効にしてください：

#### 必須のRLSポリシー

**user_progress テーブル:**
```sql
-- ユーザーは自分のデータのみ読み取り可能
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);
```

**attendances テーブル:**
```sql
-- ユーザーは自分の出席記録のみ読み取り可能
CREATE POLICY "Users can view own attendances"
ON attendances FOR SELECT
USING (auth.uid() = user_id);

-- ユーザーは自分の出席記録のみ作成可能
CREATE POLICY "Users can insert own attendances"
ON attendances FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**user_quest_logs テーブル:**
```sql
-- ユーザーは自分のクエストログのみ読み取り可能
CREATE POLICY "Users can view own quest logs"
ON user_quest_logs FOR SELECT
USING (auth.uid() = user_id);
```

**lottery_tickets テーブル:**
```sql
-- ユーザーは自分のチケット情報のみ読み取り可能
CREATE POLICY "Users can view own tickets"
ON lottery_tickets FOR SELECT
USING (auth.uid() = user_id);
```

### 3. Edge Functions

Edge Functionsは認証が必要です：

- すべてのEdge Functionは`Authorization`ヘッダーをチェック
- 認証されていないリクエストは401エラーを返す
- ユーザーは自分のデータのみ操作可能

### 4. 公開時の注意事項

#### ✅ 公開しても安全なもの
- `SUPABASE_ANON_KEY` - 公開用キー（RLSで保護されている）
- `SUPABASE_URL` - プロジェクトURL

#### ⚠️ 絶対に公開してはいけないもの
- `SUPABASE_SERVICE_ROLE_KEY` - 管理者権限キー
- `.env` ファイル
- データベースパスワード

### 5. GitHub Pagesでのデプロイ

GitHub Pagesにデプロイする場合：

1. `js/config.js` を作成（.gitignoreに含まれているため、手動で作成）
2. GitHub Pagesの設定でブランチを指定
3. カスタムドメインを使用する場合はHTTPSを有効化

### 6. セキュリティチェックリスト

デプロイ前に以下を確認してください：

- [ ] すべてのテーブルでRLSが有効
- [ ] 適切なRLSポリシーが設定されている
- [ ] `js/config.js` が.gitignoreに含まれている
- [ ] SERVICE_ROLE_KEYがコードに含まれていない
- [ ] Edge Functionsで認証チェックが実装されている
- [ ] HTTPSが有効（本番環境）

### 7. 脆弱性の報告

セキュリティ上の問題を発見した場合は、以下の方法で報告してください：

- GitHubのIssueは**使用しないでください**（公開されるため）
- プロジェクトオーナーに直接連絡してください

## 🔐 ベストプラクティス

1. **定期的なキーのローテーション**
   - 定期的にSupabaseのキーを再生成

2. **最小権限の原則**
   - ユーザーは必要最小限のデータのみアクセス可能

3. **監査ログ**
   - Supabaseのログを定期的に確認

4. **アップデート**
   - Supabaseクライアントライブラリを最新に保つ

## 📚 参考資料

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [GitHub Pages Security](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
