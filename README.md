# Officing - QRコードチェックインゲーム

オフィス出社をゲーム化するPWAアプリケーション。QRコードをスキャンして出社を記録し、スタンプ、くじ、クエスト、レベルアップなどのゲーム要素で継続的なモチベーションを提供します。

## 🎮 主な機能

- **QRコードチェックイン**: QRコードをスキャンして簡単に出社記録
- **スタンプコレクション**: 毎日のチェックインでスタンプを獲得
- **くじシステム**: 出社回数に応じてくじチケットを獲得し、景品を抽選
- **クエストシステム**: デイリークエストをクリアしてXPとポイントを獲得
- **レベル＆称号**: XPを貯めてレベルアップ、様々な称号をアンロック
- **ポイントショップ**: 獲得したポイントでアイテムを購入
- **ストリーク機能**: 連続出社日数を記録してモチベーション維持
- **PWA対応**: スマートフォンにインストールしてネイティブアプリのように使用可能

## 🚀 クイックスタート

### 必要なもの

- Supabaseアカウント（無料）
- GitHubアカウント（デプロイ用、無料）
- モダンなWebブラウザ

### セットアップ手順（10分）

#### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウント作成
2. 新規プロジェクトを作成
3. プロジェクトの**URL**と**anon key**をメモ

詳細は [Supabaseセットアップガイド](./docs/SUPABASE_SETUP.md) を参照してください。

#### 2. データベースのセットアップ

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase/schema.sql` の内容をコピー＆ペーストして実行
3. `supabase/master-data.sql` の内容をコピー＆ペーストして実行

#### 3. Edge Functionsのデプロイ

```bash
# Supabase CLIをインストール（初回のみ）
npm install -g supabase

# プロジェクトにログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref YOUR_PROJECT_REF

# Edge Functionsをデプロイ
cd supabase/functions
supabase functions deploy checkin
supabase functions deploy lottery-draw
supabase functions deploy quest-complete
```

#### 4. アプリケーションの設定

`js/config.js` を編集して、Supabaseの接続情報を設定：

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

#### 5. ローカルで動作確認

```bash
# Pythonの場合
python -m http.server 8000

# Node.jsの場合
npx http-server -p 8000
```

ブラウザで `http://localhost:8000` を開いて動作確認。

#### 6. デプロイ

GitHub Pagesへのデプロイ方法は [デプロイ手順書](./docs/DEPLOYMENT.md) を参照してください。

## 📱 使い方

### 初回ログイン

1. アプリを開く
2. メールアドレスを入力してMagic Linkを受信
3. メールのリンクをクリックしてログイン完了

### チェックイン

1. QRコードをスキャン（またはQRコードのURLを開く）
2. 自動的にチェックイン処理が実行される
3. 成功画面でスタンプ、カウント、報酬を確認

### くじを引く

1. ダッシュボードから「くじ」画面へ
2. チケットがある場合、「くじを引く」ボタンをタップ
3. 景品を獲得！

### クエストをクリア

1. ダッシュボードで今日のクエストを確認
2. クエストを達成したら「完了」ボタンをタップ
3. XPとポイントを獲得してレベルアップ

## 🏗️ プロジェクト構造

```
officing/
├── index.html              # メインHTML
├── dashboard.html          # ダッシュボード
├── profile.html           # プロフィール画面
├── stamps.html            # スタンプ帳
├── qr-generator.html      # QRコード生成ツール
├── manifest.json          # PWA設定
├── sw.js                  # Service Worker
├── css/
│   └── main.css          # メインスタイル
├── js/
│   ├── app.js            # アプリ初期化
│   ├── auth.js           # 認証処理
│   ├── checkin.js        # チェックイン処理
│   ├── dashboard.js      # ダッシュボード
│   ├── lottery.js        # くじシステム
│   ├── quest.js          # クエストシステム
│   ├── level.js          # レベルシステム
│   ├── title.js          # 称号システム
│   ├── shop.js           # ショップ
│   ├── stamp.js          # スタンプ帳
│   ├── router.js         # ルーティング
│   ├── error-handler.js  # エラーハンドリング
│   └── offline-queue.js  # オフライン対応
├── supabase/
│   ├── schema.sql        # データベーススキーマ
│   ├── master-data.sql   # マスターデータ
│   └── functions/        # Edge Functions
│       ├── checkin/
│       ├── lottery-draw/
│       └── quest-complete/
└── docs/                 # ドキュメント
```

## 📚 ドキュメント

- [Supabaseセットアップガイド](./docs/SUPABASE_SETUP.md) - データベースとEdge Functionsの設定
- [デプロイ手順書](./docs/DEPLOYMENT.md) - GitHub Pages等へのデプロイ方法
- [QRコード運用ガイド](./docs/QR_OPERATION.md) - QRコードの生成と運用方法
- [スキーマリファレンス](./supabase/SCHEMA_REFERENCE.md) - データベース構造の詳細
- [PWA実装ガイド](./docs/PWA_IMPLEMENTATION.md) - PWA機能の詳細
- [エラーハンドリング](./docs/ERROR_HANDLING.md) - エラー処理の実装

## 🔧 開発

### テストデータの投入

開発用のテストデータを投入する場合：

```bash
# テストユーザーの作成
cd supabase
./setup-test-users.sh

# テストデータの投入
# Supabase SQL Editorで seed-test-data.sql を実行
```

詳細は [テストデータガイド](./docs/TEST_DATA_GUIDE.md) を参照。

### QRコードの生成

`qr-generator.html` を開いて、チェックイン用のQRコードを生成できます。

詳細は [QRコード運用ガイド](./docs/QR_OPERATION.md) を参照。

## 🎯 ゲームシステム

### くじチケットの獲得

- 月間4回チェックイン: 1枚
- 月間8回チェックイン: 1枚
- 月間12回チェックイン: 1枚
- クエスト報酬: ランクに応じて獲得
- ショップで購入: ポイントと交換

### 景品ランク

- **S**: 超レア（重み: 1）
- **A**: レア（重み: 5）
- **B**: アンコモン（重み: 20）
- **C**: コモン（重み: 74）

### クエストランク

- **S**: 最高難易度（報酬倍率: 3.0x）
- **A**: 高難易度（報酬倍率: 2.0x）
- **B**: 中難易度（報酬倍率: 1.5x）
- **C**: 低難易度（報酬倍率: 1.0x）

### レベルシステム

レベルアップに必要なXPは指数関数的に増加：
```
必要XP = 100 × (レベル ^ 1.5)
```

### 称号の獲得条件

- **初心者**: 初回チェックイン
- **3日連続**: 3日連続チェックイン
- **1週間連続**: 7日連続チェックイン
- **2週間連続**: 14日連続チェックイン
- **1ヶ月連続**: 30日連続チェックイン
- **レベル10**: レベル10到達
- **レベル25**: レベル25到達
- **レベル50**: レベル50到達

## 🛠️ トラブルシューティング

### チェックインできない

- ネットワーク接続を確認
- ログイン状態を確認（セッション切れの場合は再ログイン）
- 当日既にチェックイン済みでないか確認

### くじが引けない

- チケット残高を確認
- ネットワーク接続を確認
- ブラウザのコンソールでエラーを確認

### PWAがインストールできない

- HTTPSで配信されているか確認（GitHub Pagesは自動的にHTTPS）
- manifest.jsonが正しく配置されているか確認
- Service Workerが正常に登録されているか確認

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📞 サポート

問題が発生した場合は、GitHubのissueを作成してください。

---

**Officing** - 出社をもっと楽しく！ 🎉
