/**
 * Client-Side Router
 * 
 * シンプルなクライアントサイドルーティングシステム
 * Requirements: 全般
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeNavigateCallbacks = [];
    this.afterNavigateCallbacks = [];
    this.isNavigating = false;
  }

  /**
   * ルートを登録
   * @param {string} path - ルートパス
   * @param {Function} handler - ルートハンドラー関数
   * @param {Object} options - オプション（requireAuth等）
   */
  register(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      requireAuth: options.requireAuth || false,
      title: options.title || 'Officing'
    });
  }

  /**
   * ルーターを初期化
   */
  init() {
    // ブラウザの戻る/進むボタンに対応
    window.addEventListener('popstate', (event) => {
      const path = window.location.pathname;
      this.handleRoute(path, false); // pushStateしない
    });

    // リンククリックをインターセプト
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-link]');
      if (link) {
        event.preventDefault();
        const path = link.getAttribute('href');
        this.navigate(path);
      }
    });

    // 初期ルートを処理
    this.handleRoute(window.location.pathname);
  }

  /**
   * ナビゲーション前のコールバックを登録
   * @param {Function} callback - コールバック関数
   */
  beforeNavigate(callback) {
    this.beforeNavigateCallbacks.push(callback);
  }

  /**
   * ナビゲーション後のコールバックを登録
   * @param {Function} callback - コールバック関数
   */
  afterNavigate(callback) {
    this.afterNavigateCallbacks.push(callback);
  }

  /**
   * 指定されたパスにナビゲート
   * @param {string} path - 遷移先のパス
   * @param {Object} options - オプション
   */
  async navigate(path, options = {}) {
    if (this.isNavigating) {
      console.log('Navigation in progress, ignoring...');
      return;
    }

    this.isNavigating = true;

    try {
      // beforeNavigateコールバックを実行
      for (const callback of this.beforeNavigateCallbacks) {
        const result = await callback(path, this.currentRoute);
        if (result === false) {
          // ナビゲーションをキャンセル
          this.isNavigating = false;
          return;
        }
      }

      // ルートを処理
      await this.handleRoute(path, !options.skipHistory);

      // afterNavigateコールバックを実行
      for (const callback of this.afterNavigateCallbacks) {
        await callback(path, this.currentRoute);
      }
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * ルートを処理
   * @param {string} path - ルートパス
   * @param {boolean} pushState - history.pushStateを実行するか
   */
  async handleRoute(path, pushState = true) {
    console.log('📍 Handling route:', path);

    // パスを正規化（.htmlを削除）
    const normalizedPath = this.normalizePath(path);

    // ルートを検索
    const route = this.routes.get(normalizedPath);

    if (!route) {
      console.warn('Route not found:', normalizedPath);
      // デフォルトルート（ホーム）にリダイレクト
      if (normalizedPath !== '/') {
        this.navigate('/');
      }
      return;
    }

    // 認証チェック
    if (route.requireAuth) {
      const isAuthenticated = await this.checkAuth();
      if (!isAuthenticated) {
        console.log('🔒 Authentication required, redirecting to auth...');
        // 認証画面にリダイレクト（リターンURLを保存）
        sessionStorage.setItem('returnUrl', normalizedPath);
        window.location.href = './login.html?returnUrl=' + encodeURIComponent(normalizedPath);
        return;
      }
    }

    // ページ遷移アニメーションを開始
    await this.startPageTransition();

    // ルートハンドラーを実行
    try {
      await route.handler();
      
      // ページタイトルを更新
      document.title = route.title;

      // 履歴に追加
      if (pushState) {
        window.history.pushState({ path: normalizedPath }, route.title, normalizedPath);
      }

      // 現在のルートを更新
      this.currentRoute = normalizedPath;

      // スクロール位置をトップに
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Route handler error:', error);
      this.showError('ページの読み込みに失敗しました');
    }

    // ページ遷移アニメーションを終了
    await this.endPageTransition();
  }

  /**
   * パスを正規化
   * @param {string} path - パス
   * @returns {string} 正規化されたパス
   */
  normalizePath(path) {
    // .htmlを削除
    let normalized = path.replace(/\.html$/, '');
    
    // 末尾のスラッシュを削除（ルート以外）
    if (normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    // 空の場合はルートに
    if (!normalized) {
      normalized = '/';
    }
    
    return normalized;
  }

  /**
   * 認証状態をチェック
   * @returns {Promise<boolean>} 認証されているか
   */
  async checkAuth() {
    try {
      if (typeof isSessionValid === 'function') {
        return await isSessionValid();
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * ページ遷移アニメーションを開始
   */
  async startPageTransition() {
    const app = document.getElementById('app');
    if (!app) return;

    // フェードアウトアニメーション
    app.style.opacity = '0';
    app.style.transform = 'translateY(-10px)';
    
    // アニメーション完了を待つ
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  /**
   * ページ遷移アニメーションを終了
   */
  async endPageTransition() {
    const app = document.getElementById('app');
    if (!app) return;

    // ナビゲーションがある場合はページコンテンツにクラスを追加
    const hasNav = document.querySelector('.main-nav');
    if (hasNav) {
      app.classList.add('page-with-nav');
    }

    // フェードインアニメーション
    app.style.opacity = '1';
    app.style.transform = 'translateY(0)';
  }

  /**
   * エラーを表示
   * @param {string} message - エラーメッセージ
   */
  showError(message) {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="error-screen">
        <h1>エラー</h1>
        <p>${message}</p>
        <button onclick="router.navigate('/')" class="btn btn-primary">
          ホームに戻る
        </button>
      </div>
    `;
  }

  /**
   * 現在のルートを取得
   * @returns {string} 現在のルート
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * 戻る
   */
  back() {
    window.history.back();
  }

  /**
   * 進む
   */
  forward() {
    window.history.forward();
  }
}

// グローバルルーターインスタンス
const router = new Router();
