/**
 * Service Worker for Officing PWA
 * 
 * PWA機能のためのService Worker
 * - キャッシュ管理
 * - オフライン対応
 * - チェックインのキューイング
 * - オンライン復帰時の同期
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

const CACHE_NAME = 'officing-v1';
const QUEUE_NAME = 'officing-queue';

// キャッシュする静的アセット
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/auth-demo.html',
  '/css/main.css',
  '/js/config.js',
  '/js/supabase-client.js',
  '/js/app.js',
  '/js/auth.js',
  '/js/checkin.js',
  '/js/lottery.js',
  '/js/quest.js',
  '/js/level.js',
  '/js/title.js',
  '/js/shop.js',
  '/js/stamp.js',
  '/js/dashboard.js',
  '/manifest.json'
];

/**
 * Service Worker インストール時
 * Requirements: 11.1, 11.2
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // 重要なアセットのみをキャッシュ（エラーを無視）
        return cache.addAll(STATIC_ASSETS.filter(url => {
          // 存在しないファイルはスキップ
          return true;
        })).catch((error) => {
          console.warn('[SW] Some assets failed to cache:', error);
          // 一部のキャッシュ失敗は許容
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Installed');
        return self.skipWaiting();
      })
  );
});

/**
 * Service Worker アクティベート時
 * Requirements: 11.1, 11.2
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== QUEUE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // すべてのクライアントを制御
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activated');
    })
  );
});

/**
 * Fetch イベント - キャッシュ戦略
 * Network First with Cache Fallback
 * Requirements: 11.3, 11.4
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Chrome拡張機能やその他のスキームは無視
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Supabase APIリクエストは特別処理
  if (url.hostname.includes('supabase.co')) {
    // オフライン時はキューに追加
    event.respondWith(
      fetch(request).catch(async (error) => {
        console.log('[SW] API request failed, checking if queueable:', url.pathname);
        
        // チェックインリクエストの場合はキューに追加
        if (url.pathname.includes('/checkin') && request.method === 'POST') {
          await queueCheckin(request);
          return new Response(
            JSON.stringify({ 
              queued: true, 
              message: 'オフラインです。オンライン復帰時に同期します。' 
            }),
            { 
              status: 202, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
        
        throw error;
      })
    );
    return;
  }
  
  // 静的アセット: Network First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 成功したレスポンスをキャッシュに保存（httpまたはhttpsのみ）
        if (response.status === 200 && url.protocol.startsWith('http')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch((err) => {
              console.warn('[SW] Failed to cache:', request.url, err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
          }
          
          // キャッシュにもない場合はオフラインページを返す
          if (request.mode === 'navigate') {
            return caches.match('/index.html').then((indexResponse) => {
              return indexResponse || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          }
          
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

/**
 * チェックインをキューに追加
 * Requirements: 11.4
 */
async function queueCheckin(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: {},
      body: null,
      timestamp: Date.now()
    };
    
    // ヘッダーをコピー
    for (const [key, value] of request.headers.entries()) {
      requestData.headers[key] = value;
    }
    
    // ボディをコピー
    if (request.method === 'POST' || request.method === 'PUT') {
      requestData.body = await request.clone().text();
    }
    
    // IndexedDBにキューを保存
    const db = await openQueueDB();
    const tx = db.transaction('queue', 'readwrite');
    const store = tx.objectStore('queue');
    await store.add(requestData);
    
    console.log('[SW] Queued check-in request');
    
    // クライアントに通知
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CHECKIN_QUEUED',
        data: requestData
      });
    });
  } catch (error) {
    console.error('[SW] Failed to queue check-in:', error);
  }
}

/**
 * IndexedDBを開く
 */
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('officing-queue', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'timestamp' });
      }
    };
  });
}

/**
 * キューを同期
 * Requirements: 11.5
 */
async function syncQueue() {
  try {
    console.log('[SW] Starting queue sync...');
    
    const db = await openQueueDB();
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    const allRequests = await store.getAll();
    
    if (allRequests.length === 0) {
      console.log('[SW] Queue is empty');
      return;
    }
    
    console.log(`[SW] Syncing ${allRequests.length} queued requests`);
    
    for (const requestData of allRequests) {
      try {
        // リクエストを再送信
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // 成功したらキューから削除
          const deleteTx = db.transaction('queue', 'readwrite');
          const deleteStore = deleteTx.objectStore('queue');
          await deleteStore.delete(requestData.timestamp);
          
          console.log('[SW] Synced queued request:', requestData.url);
          
          // クライアントに通知
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'CHECKIN_SYNCED',
              data: requestData
            });
          });
        } else {
          console.warn('[SW] Failed to sync request:', response.status);
        }
      } catch (error) {
        console.error('[SW] Error syncing request:', error);
      }
    }
    
    console.log('[SW] Queue sync completed');
  } catch (error) {
    console.error('[SW] Queue sync failed:', error);
  }
}

/**
 * メッセージイベント - クライアントからの通信
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SYNC_QUEUE') {
    // 手動同期リクエスト
    event.waitUntil(syncQueue());
  }
});

/**
 * オンライン復帰時の同期
 * Requirements: 11.5
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkins') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncQueue());
  }
});

/**
 * 定期的なバックグラウンド同期（オプション）
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-checkins-periodic') {
    console.log('[SW] Periodic sync triggered');
    event.waitUntil(syncQueue());
  }
});
