# デプロイ手順書

このドキュメントでは、Officingアプリケーションを本番環境にデプロイする手順を説明します。

## 目次

1. [GitHub Pagesへのデプロイ](#github-pagesへのデプロイ)
2. [Vercelへのデプロイ](#vercelへのデプロイ)
3. [Netlifyへのデプロイ](#netlifyへのデプロイ)
4. [Cloudflare Pagesへのデプロイ](#cloudflare-pagesへのデプロイ)
5. [カスタムドメインの設定](#カスタムドメインの設定)
6. [デプロイ後の確認](#デプロイ後の確認)

## 前提条件

以下が完了していることを確認してください：

- ✅ Supabaseプロジェクトが作成済み
- ✅ データベーススキーマが作成済み
- ✅ Edge Functionsがデプロイ済み
- ✅ `js/config.js` にSupabase接続情報が設定済み
- ✅ ローカル環境で動作確認済み

## GitHub Pagesへのデプロイ

最もシンプルで推奨される方法です。

### 手順

#### 1. GitHubリポジトリの作成

```bash
# ローカルでGitリポジトリを初期化
git init

# .gitignoreファイルを作成
cat > .gitignore << EOF
node_modules/
.DS_Store
.env
.vscode/
EOF

# 初回コミット
git add .
git commit -m "Initial commit: Officing PWA"

# GitHubにリポジトリを作成（ブラウザで https://github.com/new）
# リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/officing.git

# プッシュ
git branch -M main
git push -u origin main
```

#### 2. GitHub Pagesの有効化

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左サイドバーの **Pages** をクリック
4. **Source** で `main` ブランチを選択
5. **Save** をクリック

#### 3. デプロイ完了

数分後、以下のURLでアクセス可能になります：
```
https://YOUR_USERNAME.github.io/officing/
```

#### 4. 更新のデプロイ

```bash
# 変更をコミット
git add .
git commit -m "Update: 機能追加"

# プッシュ（自動的にデプロイされる）
git push
```

### メリット

- ✅ 完全無料
- ✅ 設定が簡単
- ✅ 自動HTTPS対応
- ✅ git pushだけで自動デプロイ

### デメリット

- ❌ カスタムドメインは有料（GitHub Pro）
- ❌ ビルドプロセスが必要な場合は別途設定が必要

## Vercelへのデプロイ

最も簡単で高機能なデプロイ方法です。

### 手順

#### 1. Vercelアカウントの作成

1. [Vercel](https://vercel.com)にアクセス
2. GitHubアカウントでサインアップ

#### 2. プロジェクトのインポート

1. **New Project** をクリック
2. GitHubリポジトリを選択
3. **Import** をクリック

#### 3. 設定

- **Framework Preset**: Other（静的サイト）
- **Build Command**: 空欄（ビルド不要）
- **Output Directory**: `.`（ルートディレクトリ）

#### 4. デプロイ

**Deploy** をクリックすると、数秒でデプロイ完了！

デプロイURL: `https://officing-YOUR_PROJECT.vercel.app`

### メリット

- ✅ 超高速デプロイ
- ✅ 自動プレビュー環境
- ✅ カスタムドメイン無料
- ✅ 優れたパフォーマンス
- ✅ 自動HTTPS

### デメリット

- ❌ 特になし（個人利用では完全無料）

## Netlifyへのデプロイ

ドラッグ&ドロップでデプロイ可能な簡単な方法です。

### 手順

#### 1. Netlifyアカウントの作成

1. [Netlify](https://netlify.com)にアクセス
2. GitHubアカウントでサインアップ

#### 2. デプロイ方法A: ドラッグ&ドロップ

1. Netlifyダッシュボードを開く
2. プロジェクトフォルダをドラッグ&ドロップ
3. 完了！

#### 3. デプロイ方法B: Git連携

1. **New site from Git** をクリック
2. GitHubリポジトリを選択
3. **Build settings**:
   - Build command: 空欄
   - Publish directory: `.`
4. **Deploy site** をクリック

デプロイURL: `https://YOUR_SITE_NAME.netlify.app`

### メリット

- ✅ ドラッグ&ドロップで簡単
- ✅ カスタムドメイン無料
- ✅ フォーム機能などの追加機能
- ✅ 自動HTTPS

## Cloudflare Pagesへのデプロイ

高速で無料枠が大きい選択肢です。

### 手順

#### 1. Cloudflareアカウントの作成

1. [Cloudflare](https://cloudflare.com)にアクセス
2. アカウントを作成

#### 2. Pagesプロジェクトの作成

1. ダッシュボードで **Pages** を選択
2. **Create a project** をクリック
3. GitHubリポジトリを接続
4. **Begin setup** をクリック

#### 3. ビルド設定

- **Framework preset**: None
- **Build command**: 空欄
- **Build output directory**: `/`

#### 4. デプロイ

**Save and Deploy** をクリック

デプロイURL: `https://officing.pages.dev`

### メリット

- ✅ 超高速（Cloudflareのグローバルネットワーク）
- ✅ 無制限のリクエスト
- ✅ 無制限の帯域幅
- ✅ カスタムドメイン無料

## カスタムドメインの設定

### Vercelの場合

1. Vercelダッシュボードでプロジェクトを開く
2. **Settings** → **Domains**
3. カスタムドメインを入力
4. DNSレコードを設定（指示に従う）

### Netlifyの場合

1. Netlifyダッシュボードでサイトを開く
2. **Domain settings** → **Add custom domain**
3. ドメインを入力
4. DNSレコードを設定

### Cloudflare Pagesの場合

1. Pagesプロジェクトを開く
2. **Custom domains** → **Set up a custom domain**
3. Cloudflareで管理しているドメインを選択
4. 自動的にDNSが設定される

## デプロイ後の確認

### 1. PWA機能の確認

```bash
# Lighthouseでチェック
# Chrome DevTools → Lighthouse → Progressive Web App
```

確認項目：
- ✅ HTTPSで配信されている
- ✅ Service Workerが登録されている
- ✅ manifest.jsonが読み込まれている
- ✅ アイコンが正しく表示される
- ✅ 「ホーム画面に追加」が表示される

### 2. 機能テスト

- ✅ ログインできる
- ✅ QRコードからチェックインできる
- ✅ ダッシュボードが表示される
- ✅ くじが引ける
- ✅ クエストが完了できる
- ✅ オフラインで動作する

### 3. パフォーマンステスト

Chrome DevToolsのLighthouseで以下を確認：
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: すべてのチェック項目が緑

### 4. モバイルテスト

実際のスマートフォンで：
- ✅ PWAとしてインストールできる
- ✅ ホーム画面から起動できる
- ✅ スプラッシュスクリーンが表示される
- ✅ ネイティブアプリのように動作する

## トラブルシューティング

### Service Workerが登録されない

**原因**: HTTPSで配信されていない

**解決策**: 
- GitHub Pages、Vercel、Netlify、Cloudflare Pagesは自動的にHTTPS
- カスタムドメインの場合、SSL証明書を設定

### manifest.jsonが読み込まれない

**原因**: パスが間違っている

**解決策**:
```html
<!-- index.htmlで確認 -->
<link rel="manifest" href="/manifest.json">
```

サブディレクトリにデプロイする場合：
```html
<link rel="manifest" href="/officing/manifest.json">
```

### Supabaseに接続できない

**原因**: CORS設定またはURL設定の問題

**解決策**:
1. Supabaseダッシュボード → Settings → API
2. **Site URL** にデプロイ先のURLを追加
3. **Redirect URLs** にも追加

### 画像やCSSが読み込まれない

**原因**: 相対パスの問題

**解決策**:
```html
<!-- 絶対パスを使用 -->
<link rel="stylesheet" href="/css/main.css">
<img src="/icons/icon-72.png">
```

サブディレクトリの場合：
```html
<link rel="stylesheet" href="/officing/css/main.css">
```

## 環境変数の管理

本番環境とステージング環境で異なる設定を使用する場合：

### Vercel

```bash
# Vercel CLIで設定
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

### Netlify

1. Site settings → Build & deploy → Environment
2. 環境変数を追加

### 注意

`js/config.js` に直接書く場合、機密情報は含めないこと：
- ✅ anon key（公開されても安全）
- ❌ service_role key（絶対に公開しない）

## 継続的デプロイ（CI/CD）

### GitHub Actions（オプション）

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## まとめ

### 推奨デプロイ方法

| 用途 | 推奨サービス | 理由 |
|------|------------|------|
| 個人利用 | GitHub Pages | 無料、シンプル |
| チーム利用 | Vercel | 高機能、プレビュー環境 |
| 簡単デプロイ | Netlify | ドラッグ&ドロップ |
| 高速配信 | Cloudflare Pages | グローバルCDN |

### デプロイチェックリスト

- [ ] Supabaseプロジェクトが本番環境用に設定されている
- [ ] Edge Functionsがデプロイされている
- [ ] `js/config.js` に正しいSupabase URLとキーが設定されている
- [ ] HTTPSで配信されている
- [ ] PWA機能が動作している
- [ ] モバイルでテスト済み
- [ ] Supabaseの Site URL と Redirect URLs が設定されている
- [ ] カスタムドメイン（使用する場合）が設定されている

---

デプロイが完了したら、[QRコード運用ガイド](./QR_OPERATION.md)を参照して、チェックイン用のQRコードを生成しましょう！
