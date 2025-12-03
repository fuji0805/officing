/**
 * Offline Queue Manager
 * 
 * オフライン時のチェックインキューイングと同期管理
 * Requirements: 11.4, 11.5
 */

class OfflineQueueManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = [];
    
    this.init();
  }

  /**
   * 初期化
   */
  init() {
    // オンライン/オフライン状態の監視
    window.addEventListener('online', () => {
      console.log('📶 Online');
      this.isOnline = true;
      this.notifyListeners('online');
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Offline');
      this.isOnline = false;
      this.notifyListeners('offline');
    });

    // Service Workerからのメッセージを監視
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CHECKIN_QUEUED') {
          console.log('✅ Check-in queued for sync');
          this.notifyListeners('queued', event.data.data);
        } else if (event.data.type === 'CHECKIN_SYNCED') {
          console.log('✅ Check-in synced');
          this.notifyListeners('synced', event.data.data);
        }
      });
    }

    // 初期状態を確認
    console.log(`📶 Initial network status: ${this.isOnline ? 'Online' : 'Offline'}`);
  }

  /**
   * オンライン状態を取得
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * キューを同期
   * Requirements: 11.5
   */
  async syncQueue() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.log('📵 Cannot sync while offline');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting queue sync...');

      // Service Workerに同期を依頼
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_QUEUE'
        });
      }

      // Background Sync APIが利用可能な場合は登録
      if ('sync' in self.registration) {
        await self.registration.sync.register('sync-checkins');
        console.log('✅ Background sync registered');
      }

      this.notifyListeners('sync-started');
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.notifyListeners('sync-failed', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * キューの状態を取得
   */
  async getQueueStatus() {
    try {
      const db = await this.openQueueDB();
      const tx = db.transaction('queue', 'readonly');
      const store = tx.objectStore('queue');
      const count = await store.count();
      
      return {
        count,
        isEmpty: count === 0
      };
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return { count: 0, isEmpty: true };
    }
  }

  /**
   * IndexedDBを開く
   */
  openQueueDB() {
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
   * イベントリスナーを追加
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * イベントリスナーを削除
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * リスナーに通知
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * オフライン通知を表示
   */
  showOfflineNotification() {
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.innerHTML = `
      <div class="offline-notification-content">
        <span class="offline-icon">📵</span>
        <span class="offline-text">オフラインです</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    return notification;
  }

  /**
   * オンライン通知を表示
   */
  showOnlineNotification() {
    const notification = document.createElement('div');
    notification.className = 'online-notification';
    notification.innerHTML = `
      <div class="online-notification-content">
        <span class="online-icon">📶</span>
        <span class="online-text">オンラインに復帰しました</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * キュー通知を表示
   */
  showQueuedNotification() {
    const notification = document.createElement('div');
    notification.className = 'queued-notification';
    notification.innerHTML = `
      <div class="queued-notification-content">
        <span class="queued-icon">⏳</span>
        <span class="queued-text">チェックインをキューに追加しました</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * 同期完了通知を表示
   */
  showSyncedNotification() {
    const notification = document.createElement('div');
    notification.className = 'synced-notification';
    notification.innerHTML = `
      <div class="synced-notification-content">
        <span class="synced-icon">✅</span>
        <span class="synced-text">チェックインを同期しました</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// グローバルインスタンス
const offlineQueue = new OfflineQueueManager();

// オフライン/オンライン通知を自動表示
offlineQueue.addListener((event) => {
  if (event === 'offline') {
    offlineQueue.showOfflineNotification();
  } else if (event === 'online') {
    offlineQueue.showOnlineNotification();
  } else if (event === 'queued') {
    offlineQueue.showQueuedNotification();
  } else if (event === 'synced') {
    offlineQueue.showSyncedNotification();
  }
});
