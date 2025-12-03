# PWA Implementation Guide

## Overview

Officingは完全なPWA（Progressive Web App）として実装されており、以下の機能を提供します：

- ✅ ホーム画面へのインストール
- ✅ オフライン対応
- ✅ チェックインのキューイング
- ✅ オンライン復帰時の自動同期
- ✅ レスポンシブデザイン
- ✅ Service Workerによるキャッシング

**Requirements: 11.1, 11.2, 11.3, 11.4, 11.5**

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   UI Layer   │  │ Offline Queue│  │ PWA Install  │ │
│  │              │  │   Manager    │  │   Manager    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                   ┌────────▼────────┐                   │
│                   │ Service Worker  │                   │
│                   │  - Cache        │                   │
│                   │  - Queue        │                   │
│                   │  - Sync         │                   │
│                   └────────┬────────┘                   │
└────────────────────────────┼─────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Network       │
                    │  (Supabase)     │
                    └─────────────────┘
```

## Components

### 1. Service Worker (`sw.js`)

Service Workerは以下の機能を提供します：

#### キャッシュ戦略
- **Network First with Cache Fallback**: 静的アセット
- **Network Only**: Supabase APIリクエスト（オフライン時はキューイング）

#### オフライン対応
- 静的アセットをキャッシュ
- オフライン時はキャッシュから提供
- APIリクエストはキューに追加

#### 同期機能
- オンライン復帰時に自動同期
- Background Sync API対応
- IndexedDBでキュー管理

### 2. Offline Queue Manager (`js/offline-queue.js`)

オフライン時のチェックインキューイングと同期を管理します。

#### 主な機能
- オンライン/オフライン状態の監視
- チェックインのキューイング
- オンライン復帰時の自動同期
- ユーザー通知の表示

#### API

```javascript
// オンライン状態を取得
const isOnline = offlineQueue.getOnlineStatus();

// キューを手動で同期
await offlineQueue.syncQueue();

// キューの状態を取得
const status = await offlineQueue.getQueueStatus();
// { count: 2, isEmpty: false }

// イベントリスナーを追加
offlineQueue.addListener((event, data) => {
  if (event === 'online') {
    console.log('オンラインに復帰しました');
  } else if (event === 'queued') {
    console.log('チェックインをキューに追加しました');
  } else if (event === 'synced') {
    console.log('チェックインを同期しました');
  }
});
```

### 3. PWA Install Manager (`js/pwa-install.js`)

PWAインストールプロンプトを管理します。

#### 主な機能
- インストールプロンプトの表示
- インストール状態の検出
- iOS用の手動インストール手順

#### API

```javascript
// 手動でインストールプロンプトを表示
pwaInstall.showManualPrompt();

// インストール状態を確認
const isInstalled = pwaInstall.isInstalled;
```

### 4. Web App Manifest (`manifest.json`)

PWAの設定ファイルです。

#### 主な設定
- アプリ名: "Officing - 出社チェックインゲーム"
- 表示モード: standalone
- テーマカラー: #4F46E5
- アイコン: 8サイズ（72px〜512px）
- ショートカット: チェックイン、ダッシュボード

## Usage

### インストール

#### デスクトップ（Chrome/Edge）
1. アプリにアクセス
2. アドレスバーの右側にインストールアイコンが表示される
3. クリックして「インストール」を選択

#### モバイル（Android）
1. アプリにアクセス
2. 自動的にインストールプロンプトが表示される
3. 「インストール」をタップ

#### モバイル（iOS）
1. Safariでアプリにアクセス
2. 共有ボタン（⎙）をタップ
3. 「ホーム画面に追加」を選択

### オフライン使用

#### チェックインのキューイング

オフライン時にチェックインを実行すると：

1. チェックインリクエストがIndexedDBのキューに保存される
2. 「チェックインをキューに追加しました」という通知が表示される
3. オンライン復帰時に自動的に同期される

#### 同期の確認

```javascript
// キューの状態を確認
const status = await offlineQueue.getQueueStatus();
console.log(`キューに ${status.count} 件のリクエストがあります`);

// 手動で同期
await offlineQueue.syncQueue();
```

## Testing

### PWA機能のテスト

#### 1. Service Worker登録の確認

```javascript
// DevToolsのConsoleで実行
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

#### 2. キャッシュの確認

```javascript
// DevToolsのConsoleで実行
caches.keys().then(keys => {
  console.log('Cache keys:', keys);
});

caches.open('officing-v1').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached files:', keys.map(k => k.url));
  });
});
```

#### 3. オフラインテスト

1. DevToolsを開く
2. Networkタブで「Offline」を選択
3. ページをリロード
4. キャッシュされたコンテンツが表示されることを確認

#### 4. キューイングテスト

1. DevToolsでオフラインモードに切り替え
2. チェックインを実行
3. IndexedDBを確認（Application > IndexedDB > officing-queue）
4. オンラインに戻す
5. 自動的に同期されることを確認

### Lighthouse監査

Chrome DevToolsのLighthouseタブでPWAスコアを確認：

```bash
# 目標スコア
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 100
```

## Deployment

### GitHub Pages

```bash
# 1. リポジトリをプッシュ
git add .
git commit -m "Add PWA features"
git push origin main

# 2. GitHub Pagesを有効化
# Settings > Pages > Source: main branch
```

### Vercel

```bash
# 1. Vercelにデプロイ
vercel

# 2. 本番環境にデプロイ
vercel --prod
```

### 注意事項

- PWAはHTTPS環境でのみ動作します
- localhostでは開発用にHTTPでも動作します
- Service Workerの更新には時間がかかる場合があります

## Troubleshooting

### Service Workerが登録されない

```javascript
// Service Worker登録エラーを確認
navigator.serviceWorker.register('/sw.js')
  .then(reg => console.log('✅ SW registered:', reg))
  .catch(err => console.error('❌ SW registration failed:', err));
```

### キャッシュが更新されない

```javascript
// キャッシュをクリア
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});

// Service Workerを更新
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});
```

### オフライン同期が動作しない

1. IndexedDBを確認
2. Service Workerのログを確認
3. ネットワークタブでリクエストを確認

```javascript
// キューを手動で確認
const db = await indexedDB.open('officing-queue', 1);
const tx = db.transaction('queue', 'readonly');
const store = tx.objectStore('queue');
const all = await store.getAll();
console.log('Queue:', all);
```

## Best Practices

### 1. キャッシュ戦略

- 静的アセット: Cache First
- APIリクエスト: Network First
- 画像: Cache First with Network Fallback

### 2. オフライン対応

- 重要な機能はオフラインでも動作するように
- ユーザーにオフライン状態を明確に通知
- キューイングされたアクションを視覚化

### 3. パフォーマンス

- 必要最小限のアセットをキャッシュ
- 大きなファイルは遅延ロード
- Service Workerのコードは最小限に

### 4. ユーザー体験

- インストールプロンプトは適切なタイミングで表示
- オフライン時の動作を明確に説明
- 同期の進行状況を表示

## Future Enhancements

- [ ] Push通知の実装
- [ ] バックグラウンド同期の強化
- [ ] オフラインページのカスタマイズ
- [ ] キャッシュの自動更新
- [ ] アプリアップデート通知

## References

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
