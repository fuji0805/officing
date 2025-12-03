# PWA Quick Start Guide

## 🚀 Getting Started

Officingは完全なPWA（Progressive Web App）として実装されています。このガイドでは、PWA機能を素早く理解して使い始めることができます。

## ✨ 主な機能

- 📱 **ホーム画面へのインストール**: アプリのように使用可能
- 🔌 **オフライン対応**: ネットワークなしでも動作
- ⏳ **自動キューイング**: オフライン時のチェックインを自動保存
- 🔄 **自動同期**: オンライン復帰時に自動的に同期
- 📲 **レスポンシブ**: モバイル最適化されたUI

## 📦 インストール方法

### デスクトップ（Chrome/Edge）
1. アプリにアクセス
2. アドレスバーの右側の「インストール」アイコンをクリック
3. 「インストール」を選択

### Android
1. アプリにアクセス
2. 画面下部に表示されるプロンプトで「インストール」をタップ
3. または、メニュー > 「ホーム画面に追加」

### iOS（Safari）
1. Safariでアプリにアクセス
2. 共有ボタン（⎙）をタップ
3. 「ホーム画面に追加」を選択

## 🔧 開発者向け

### テストページ

PWA機能をテストするには：

```
http://localhost:8000/pwa-test.html
```

このページで以下をテストできます：
- Service Worker登録
- キャッシュ管理
- オフライン動作
- キュー管理
- インストール状態

### Service Worker

Service Workerは自動的に登録されます。手動で確認するには：

```javascript
// DevToolsのConsoleで実行
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### オフラインテスト

1. DevToolsを開く（F12）
2. Networkタブを選択
3. 「Offline」を選択
4. ページをリロード
5. キャッシュされたコンテンツが表示されることを確認

### キューイングテスト

1. DevToolsでオフラインモードに切り替え
2. チェックインを実行
3. 「チェックインをキューに追加しました」通知を確認
4. DevTools > Application > IndexedDB > officing-queue を確認
5. オンラインに戻す
6. 自動的に同期されることを確認

## 📁 ファイル構成

```
officing/
├── manifest.json              # PWA設定
├── sw.js                      # Service Worker
├── pwa-test.html             # テストページ
├── js/
│   ├── offline-queue.js      # オフラインキュー管理
│   └── pwa-install.js        # インストール管理
└── icons/
    ├── generate-icons.html   # アイコン生成ツール
    └── icon-*.png           # PWAアイコン（8サイズ）
```

## 🎨 アイコンの作成

### 方法1: ブラウザベース（推奨）

1. `icons/generate-icons.html`をブラウザで開く
2. 各サイズの「Download」ボタンをクリック
3. ダウンロードしたPNG画像を`icons/`に保存

### 方法2: ImageMagick

```bash
cd icons
chmod +x create-icons.sh
./create-icons.sh
```

### 方法3: オンラインツール

- [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- [Favicon Generator](https://realfavicongenerator.net/)

## 🔍 デバッグ

### Service Workerのログ

```javascript
// Service Workerのログを確認
navigator.serviceWorker.addEventListener('message', event => {
  console.log('SW Message:', event.data);
});
```

### キャッシュの確認

```javascript
// キャッシュされたファイルを確認
caches.open('officing-v1').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached files:', keys.map(k => k.url));
  });
});
```

### キューの確認

```javascript
// キューの内容を確認
const db = await indexedDB.open('officing-queue', 1);
const tx = db.transaction('queue', 'readonly');
const store = tx.objectStore('queue');
const all = await store.getAll();
console.log('Queue:', all);
```

## 🐛 トラブルシューティング

### Service Workerが登録されない

**原因**: HTTPSが必要（localhostを除く）

**解決策**:
- 本番環境ではHTTPSを使用
- 開発環境ではlocalhostを使用

### キャッシュが更新されない

**解決策**:
```javascript
// キャッシュをクリア
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});

// ページをリロード
location.reload();
```

### オフライン同期が動作しない

**確認事項**:
1. Service Workerが登録されているか
2. IndexedDBにキューが保存されているか
3. オンライン状態に戻っているか

**解決策**:
```javascript
// 手動で同期
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({ type: 'SYNC_QUEUE' });
}
```

## 📚 詳細ドキュメント

より詳しい情報は以下を参照してください：

- **実装ガイド**: `docs/PWA_IMPLEMENTATION.md`
- **完了報告**: `docs/TASK_16_PWA_COMPLETION.md`
- **アイコンガイド**: `icons/README.md`

## 🎯 Requirements

このPWA実装は以下のRequirementsを満たしています：

- ✅ **11.1**: PWA Manifest提供
- ✅ **11.2**: ホーム画面からのアクセス
- ✅ **11.3**: レスポンシブUI
- ✅ **11.4**: オフラインキューイング
- ✅ **11.5**: オンライン同期

## 🚀 デプロイ

### GitHub Pages

```bash
git add .
git commit -m "Add PWA features"
git push origin main
```

Settings > Pages > Source: main branch

### Vercel

```bash
vercel --prod
```

### 注意事項

- PWAはHTTPS環境でのみ動作します
- Service Workerの更新には時間がかかる場合があります
- キャッシュのバージョン管理に注意してください

## 💡 ヒント

### パフォーマンス最適化

- 必要最小限のファイルをキャッシュ
- 大きなファイルは遅延ロード
- Service Workerのコードは最小限に

### ユーザー体験

- インストールプロンプトは適切なタイミングで表示
- オフライン時の動作を明確に説明
- 同期の進行状況を表示

### セキュリティ

- HTTPSを必ず使用
- Service Workerのスコープを適切に設定
- キャッシュするデータを慎重に選択

## 🎉 完了！

これでPWA機能が使えるようになりました。質問がある場合は、詳細ドキュメントを参照してください。

Happy coding! 🚀
