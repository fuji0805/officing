# 認証システム実装ドキュメント

## 概要

Officingアプリケーションの認証システムは、Supabase Authを使用して実装されています。Magic Link（メール認証）とGoogle OAuth認証の両方をサポートしています。

## 実装されている機能

### 1. 認証方法

#### Magic Link認証
- ユーザーがメールアドレスを入力
- Supabaseがマジックリンクを含むメールを送信
- ユーザーがリンクをクリックして認証完了
- パスワード不要で安全

#### Google OAuth認証（オプション）
- Googleアカウントでワンクリック認証
- OAuth 2.0フローを使用
- Supabaseダッシュボードで有効化が必要

### 2. セッション管理

#### 自動セッション管理
- Supabaseが自動的にセッショントークンを管理
- アクセストークンとリフレッシュトークンを使用
- ローカルストレージに安全に保存

#### トークンリフレッシュ
- セッション有効期限が5分以内の場合、自動リフレッシュ
- `isSessionValid()` 関数が自動的にチェック
- ユーザーは再ログイン不要

#### セッション有効期限
- デフォルト: 1時間
- 有効期限切れ時は再認証が必要
- 自動リフレッシュで延長可能

### 3. 認証ガード

#### 保護されたルート
- 未認証ユーザーは自動的に認証画面へリダイレクト
- `authManager.requireAuth()` で実装
- QRコードスキャン時も認証チェック

#### 公開ルート
- `/auth`, `/login` は認証不要
- 認証画面自体はアクセス可能

### 4. 認証状態の監視

#### リアルタイム監視
- `onAuthStateChange()` でイベントを監視
- サポートされるイベント:
  - `SIGNED_IN`: ログイン成功
  - `SIGNED_OUT`: ログアウト
  - `TOKEN_REFRESHED`: トークン更新
  - `USER_UPDATED`: ユーザー情報更新

### 5. ログアウト機能

- `authManager.logout()` または `signOut()` を呼び出し
- セッションを完全にクリア
- ローカルストレージからトークンを削除
- 認証画面へ自動リダイレクト

## ファイル構成

```
js/
├── auth.js              # 認証UI、フロー管理
├── supabase-client.js   # Supabase API呼び出し
├── app.js               # アプリケーションメイン
└── config.js            # 設定ファイル

css/
└── main.css             # 認証画面スタイル

index.html               # メインHTML
auth-demo.html           # 認証デモページ
```

## 主要なクラスと関数

### AuthManager クラス (auth.js)

```javascript
class AuthManager {
  showAuthScreen(options)      // 認証画面を表示
  handleMagicLinkSubmit(event) // Magic Link送信処理
  handleGoogleSignIn()         // Google認証処理
  requireAuth(isAuthenticated) // 認証ガード
  handleAuthSuccess()          // 認証成功後の処理
  logout()                     // ログアウト
}
```

### Supabase関数 (supabase-client.js)

```javascript
initSupabase()                 // Supabaseクライアント初期化
getCurrentSession()            // 現在のセッション取得
getCurrentUser()               // 現在のユーザー取得
onAuthStateChange(callback)    // 認証状態監視
signInWithMagicLink(email)     // Magic Link認証
signInWithGoogle()             // Google OAuth認証
signOut()                      // ログアウト
refreshSession()               // セッションリフレッシュ
isSessionValid()               // セッション有効性チェック
```

## セットアップ手順

### 1. Supabaseプロジェクト設定

1. https://supabase.com でプロジェクトを作成
2. Project Settings → API から以下を取得:
   - Project URL
   - anon/public key
3. `js/config.js` を更新:
   ```javascript
   SUPABASE_URL: 'https://your-project.supabase.co'
   SUPABASE_ANON_KEY: 'your-anon-key'
   ```

### 2. Magic Link設定

1. Supabaseダッシュボード → Authentication → Providers
2. Email Provider を有効化
3. Confirm email を無効化（開発時）
4. Site URL を設定: `http://localhost:8000` または本番URL

### 3. Google OAuth設定（オプション）

1. Google Cloud Console でOAuthクライアントを作成
2. 承認済みリダイレクトURIを追加:
   - `https://your-project.supabase.co/auth/v1/callback`
3. Supabaseダッシュボード → Authentication → Providers
4. Google Provider を有効化
5. Client ID と Client Secret を入力

### 4. メールテンプレート設定

1. Supabaseダッシュボード → Authentication → Email Templates
2. Magic Link テンプレートをカスタマイズ
3. `{{ .ConfirmationURL }}` がリンクとして含まれていることを確認

## 使用例

### 基本的な認証フロー

```javascript
// アプリ初期化時
const app = new OfficingApp();
await app.init();

// 認証状態をチェック
const isAuthenticated = await app.checkAuth();

if (!isAuthenticated) {
  // 認証画面を表示
  authManager.showAuthScreen();
}
```

### QRコードスキャン時の認証チェック

```javascript
// URLパラメータをチェック
const urlParams = new URLSearchParams(window.location.search);
const tag = urlParams.get('tag');

if (tag && !currentUser) {
  // 認証が必要
  authManager.showAuthScreen({ 
    returnUrl: window.location.href 
  });
}
```

### ログアウト

```javascript
// ログアウトボタンのクリックハンドラ
document.getElementById('logout-btn').addEventListener('click', async () => {
  await app.logout();
});
```

## テスト方法

### 1. ローカルサーバーを起動

```bash
# Pythonの場合
python -m http.server 8000

# Node.jsの場合
npx http-server -p 8000
```

### 2. 認証デモページにアクセス

```
http://localhost:8000/auth-demo.html
```

### 3. テストシナリオ

1. **Magic Link認証**
   - メールアドレスを入力
   - 送信ボタンをクリック
   - メールを確認してリンクをクリック
   - 認証状態が更新されることを確認

2. **Google認証**
   - Googleでログインボタンをクリック
   - Googleアカウントを選択
   - 認証完了を確認

3. **セッション管理**
   - セッションをチェックボタンで有効性確認
   - セッションをリフレッシュボタンでトークン更新
   - ログアウトボタンでセッションクリア

4. **認証ガード**
   - QRコードスキャンボタンをクリック
   - 未認証の場合、認証画面へリダイレクト
   - 認証後、元のURLへ戻ることを確認

## トラブルシューティング

### Magic Linkが届かない

1. Supabaseダッシュボードでメール送信ログを確認
2. スパムフォルダをチェック
3. Site URLが正しく設定されているか確認
4. Email Providerが有効化されているか確認

### Google認証が失敗する

1. Google Cloud ConsoleでOAuthクライアントが正しく設定されているか確認
2. リダイレクトURIが正確に一致しているか確認
3. Supabaseダッシュボードで正しいClient IDとSecretが入力されているか確認

### セッションが保持されない

1. ブラウザのローカルストレージが有効か確認
2. サードパーティCookieがブロックされていないか確認
3. HTTPSを使用しているか確認（本番環境）

### 認証後にリダイレクトされない

1. `handleAuthSuccess()` が正しく呼ばれているか確認
2. `returnUrl` が正しく設定されているか確認
3. ブラウザコンソールでエラーを確認

## セキュリティ考慮事項

### 実装済み

- ✅ Supabase Authによる安全なトークン管理
- ✅ HTTPSでの通信（本番環境）
- ✅ セッション有効期限の自動チェック
- ✅ トークンの自動リフレッシュ
- ✅ ローカルストレージへの安全な保存

### 今後の実装（他のタスクで）

- Row Level Security (RLS) ポリシー
- レート制限
- 不正アクセス検知
- 監査ログ

## 関連する要件

このタスクは以下の要件を満たしています:

- **Requirement 10.1**: 認証オプションの提供（Magic Link、Google）
- **Requirement 10.2**: Supabase Authによるセッション作成
- **Requirement 10.3**: セッション有効期限の処理
- **Requirement 10.4**: ログアウト機能
- **Requirement 10.5**: 未認証時のリダイレクト

## 次のステップ

認証システムが実装されたので、次のタスクに進むことができます:

1. **Task 4**: QRコードチェックイン機能の実装
2. **Task 5**: Supabase Edge Function: チェックイン処理
3. その他のゲーミフィケーション機能

認証システムは、これらすべての機能の基盤となります。
