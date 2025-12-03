# Officing - セットアップガイド

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/officing.git
cd officing
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) でアカウントを作成
2. 新しいプロジェクトを作成
3. Project Settings → API から以下を取得：
   - Project URL
   - anon/public key

### 3. 設定ファイルの作成

```bash
cp js/config.example.js js/config.js
```

`js/config.js` を編集して、Supabaseの認証情報を設定：

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  // ...
};
```

### 4. データベースのセットアップ

Supabaseのダッシュボードで、`docs/SUPABASE_SETUP.md` に記載されているSQLを実行してください。

### 5. ローカルサーバーの起動

```bash
# Pythonを使用する場合
python -m http.server 8000

# Node.jsを使用する場合
npx http-server -p 8000
```

ブラウザで `http://localhost:8000` を開く

## 📦 デプロイ

### GitHub Pagesへのデプロイ

1. GitHubリポジトリの Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / root
4. Save

**重要**: デプロイ後、`js/config.js` を手動で作成する必要があります（GitHub Pagesの環境変数機能を使用するか、別の方法で設定）

### Vercel / Netlifyへのデプロイ

これらのプラットフォームでは、環境変数を使用できます：

1. プロジェクトをインポート
2. 環境変数を設定：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. ビルドコマンド: なし（静的サイト）
4. 出力ディレクトリ: `.`

## 🔒 セキュリティ

詳細は `SECURITY.md` を参照してください。

**重要な注意事項:**
- `js/config.js` は絶対にGitにコミットしないでください
- Supabaseのすべてのテーブルで Row Level Security (RLS) を有効にしてください
- SERVICE_ROLE_KEY は絶対に公開しないでください

## 📱 QRコードの生成

1. ブラウザで `qr-generator.html` を開く
2. タグ名（例: `office-tokyo`）を入力
3. ベースURL（あなたのアプリのURL）を入力
4. 「QRコード生成」をクリック
5. ダウンロードして印刷

詳細は `docs/QR_GENERATOR_GUIDE.md` を参照してください。

## 🛠️ トラブルシューティング

### Supabaseに接続できない

- `js/config.js` が正しく設定されているか確認
- ブラウザのコンソールでエラーを確認
- Supabaseプロジェクトが起動しているか確認

### 認証エラー

- Supabaseの Authentication が有効になっているか確認
- Email認証またはOAuth設定を確認

### データが表示されない

- Row Level Security (RLS) のポリシーを確認
- ブラウザのコンソールでエラーを確認

## 📚 ドキュメント

- [Supabaseセットアップ](docs/SUPABASE_SETUP.md)
- [デプロイガイド](docs/DEPLOYMENT.md)
- [QRコード生成ガイド](docs/QR_GENERATOR_GUIDE.md)
- [セキュリティガイド](SECURITY.md)

## 🤝 コントリビューション

プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License

## 🙏 謝辞

- [Supabase](https://supabase.com) - バックエンドサービス
- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) - QRコード生成
