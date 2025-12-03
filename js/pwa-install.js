/**
 * PWA Install Prompt Manager
 * 
 * PWAインストールプロンプトの管理
 * Requirements: 11.1, 11.2
 */

class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    
    this.init();
  }

  /**
   * 初期化
   */
  init() {
    // インストール済みかチェック
    this.checkInstallStatus();

    // beforeinstallpromptイベントをキャプチャ
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA install prompt available');
      
      // デフォルトのプロンプトを防ぐ
      e.preventDefault();
      
      // 後で使用するためにイベントを保存
      this.deferredPrompt = e;
      
      // カスタムインストールプロンプトを表示
      this.showInstallPrompt();
    });

    // インストール完了時
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed');
      this.isInstalled = true;
      this.hideInstallPrompt();
      this.showInstalledNotification();
    });
  }

  /**
   * インストール状態をチェック
   */
  checkInstallStatus() {
    // スタンドアロンモードで実行されているかチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('✅ Running as installed PWA');
    } else if (window.navigator.standalone === true) {
      // iOS Safari
      this.isInstalled = true;
      console.log('✅ Running as installed PWA (iOS)');
    } else {
      console.log('ℹ️ Running in browser');
    }
  }

  /**
   * インストールプロンプトを表示
   */
  showInstallPrompt() {
    // すでにインストール済みの場合は表示しない
    if (this.isInstalled) {
      return;
    }

    // プロンプトが既に表示されている場合は表示しない
    if (document.querySelector('.pwa-install-prompt')) {
      return;
    }

    const prompt = document.createElement('div');
    prompt.className = 'pwa-install-prompt';
    prompt.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-header">
          <span class="pwa-install-icon">📱</span>
          <span class="pwa-install-title">アプリをインストール</span>
        </div>
        <p class="pwa-install-description">
          ホーム画面に追加して、アプリのように使用できます
        </p>
        <div class="pwa-install-actions">
          <button class="btn btn-secondary" id="pwa-install-dismiss">
            後で
          </button>
          <button class="btn btn-primary" id="pwa-install-accept">
            インストール
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(prompt);

    // アニメーション用に少し遅延
    setTimeout(() => {
      prompt.classList.add('show');
    }, 100);

    // イベントリスナーを設定
    document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
      this.hideInstallPrompt();
    });

    document.getElementById('pwa-install-accept').addEventListener('click', () => {
      this.installPWA();
    });
  }

  /**
   * インストールプロンプトを非表示
   */
  hideInstallPrompt() {
    const prompt = document.querySelector('.pwa-install-prompt');
    if (prompt) {
      prompt.classList.remove('show');
      setTimeout(() => {
        prompt.remove();
      }, 300);
    }
  }

  /**
   * PWAをインストール
   */
  async installPWA() {
    if (!this.deferredPrompt) {
      console.log('❌ Install prompt not available');
      return;
    }

    // インストールプロンプトを表示
    this.deferredPrompt.prompt();

    // ユーザーの選択を待つ
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`👤 User choice: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    // プロンプトは一度しか使えない
    this.deferredPrompt = null;
    
    // UIを非表示
    this.hideInstallPrompt();
  }

  /**
   * インストール完了通知を表示
   */
  showInstalledNotification() {
    const notification = document.createElement('div');
    notification.className = 'synced-notification';
    notification.innerHTML = `
      <div class="synced-notification-content">
        <span class="synced-icon">✅</span>
        <span class="synced-text">アプリをインストールしました</span>
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
   * 手動でインストールプロンプトを表示
   */
  showManualPrompt() {
    if (this.isInstalled) {
      console.log('ℹ️ PWA already installed');
      return;
    }

    if (this.deferredPrompt) {
      this.showInstallPrompt();
    } else {
      console.log('ℹ️ Install prompt not available');
      this.showManualInstructions();
    }
  }

  /**
   * 手動インストール手順を表示（iOS用）
   */
  showManualInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isIOS) {
      return;
    }

    const instructions = document.createElement('div');
    instructions.className = 'pwa-install-prompt';
    instructions.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-header">
          <span class="pwa-install-icon">📱</span>
          <span class="pwa-install-title">ホーム画面に追加</span>
        </div>
        <p class="pwa-install-description">
          1. 共有ボタン <span style="font-size: 1.2em;">⎙</span> をタップ<br>
          2. 「ホーム画面に追加」を選択
        </p>
        <div class="pwa-install-actions">
          <button class="btn btn-primary" onclick="this.closest('.pwa-install-prompt').remove()">
            OK
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(instructions);

    setTimeout(() => {
      instructions.classList.add('show');
    }, 100);
  }
}

// グローバルインスタンス
const pwaInstall = new PWAInstallManager();
