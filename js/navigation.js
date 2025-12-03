/**
 * Navigation Component
 * 
 * ナビゲーションメニューの管理
 * Requirements: 全般
 */

class NavigationManager {
  constructor() {
    this.isMenuOpen = false;
    this.currentPath = '/';
  }

  /**
   * ナビゲーションメニューを表示
   * @param {string} currentPath - 現在のパス
   * @param {number} points - 所持ポイント（オプション）
   */
  render(currentPath = '/', points = null) {
    this.currentPath = currentPath;

    const nav = `
      <nav class="main-nav">
        <div class="nav-container">
          <div class="nav-brand">
            <a href="/" data-link class="nav-logo">
              <span class="nav-logo-icon">🏢</span>
              <span class="nav-logo-text">Officing</span>
            </a>
          </div>

          ${points !== null ? `
          <div class="nav-points">
            <span class="nav-points-icon">💎</span>
            <span class="nav-points-value" id="nav-points-value">${points.toLocaleString()}</span>
          </div>
          ` : ''}

          <button class="nav-toggle" id="nav-toggle" aria-label="メニューを開く">
            <span class="nav-toggle-icon"></span>
          </button>

          <div class="nav-menu" id="nav-menu">
            <div class="nav-links">
              <a href="#" onclick="event.preventDefault(); if(typeof dashboardManager !== 'undefined') { dashboardManager.isLoading = false; dashboardManager.showDashboard(); }" class="nav-link">
                <span class="nav-link-icon">🏠</span>
                <span class="nav-link-text">ホーム</span>
              </a>
              <a href="#" onclick="event.preventDefault(); if(typeof stampManager !== 'undefined') stampManager.showStampCollectionScreen();" class="nav-link">
                <span class="nav-link-icon">📅</span>
                <span class="nav-link-text">スタンプ帳</span>
              </a>
              <a href="#" onclick="event.preventDefault(); if(typeof lotteryManager !== 'undefined') lotteryManager.showLotteryScreen();" class="nav-link">
                <span class="nav-link-icon">🎰</span>
                <span class="nav-link-text">くじ</span>
              </a>
              <a href="#" onclick="event.preventDefault(); if(typeof questManager !== 'undefined') questManager.showQuestScreen();" class="nav-link">
                <span class="nav-link-icon">📋</span>
                <span class="nav-link-text">クエスト</span>
              </a>
              <a href="#" onclick="event.preventDefault(); if(typeof shopManager !== 'undefined') shopManager.showShopScreen();" class="nav-link">
                <span class="nav-link-icon">🛒</span>
                <span class="nav-link-text">ショップ</span>
              </a>
              <a href="#" onclick="event.preventDefault(); if(typeof titleManager !== 'undefined') titleManager.showTitleCollectionScreen();" class="nav-link">
                <span class="nav-link-icon">👤</span>
                <span class="nav-link-text">プロフィール</span>
              </a>
            </div>

            <div class="nav-footer">
              <button class="nav-logout-btn" id="nav-logout-btn">
                <span class="nav-link-icon">🚪</span>
                <span class="nav-link-text">ログアウト</span>
              </button>
            </div>
          </div>

          <div class="nav-overlay" id="nav-overlay"></div>
        </div>
      </nav>
    `;

    return nav;
  }

  /**
   * ナビゲーションリンクをレンダリング
   * @param {string} path - リンク先のパス
   * @param {string} icon - アイコン
   * @param {string} text - テキスト
   * @returns {string} HTMLマークアップ
   */
  renderNavLink(path, icon, text) {
    const isActive = this.currentPath === path;
    const activeClass = isActive ? 'nav-link-active' : '';

    // ホームページへのリンクは相対パスを使用
    const href = path === '/' ? './' : path;

    return `
      <a href="${href}" data-link class="nav-link ${activeClass}">
        <span class="nav-link-icon">${icon}</span>
        <span class="nav-link-text">${text}</span>
      </a>
    `;
  }

  /**
   * ナビゲーションをページに追加
   * @param {string} currentPath - 現在のパス
   * @param {number} points - 所持ポイント（オプション）
   */
  mount(currentPath = '/', points = null) {
    // 既存のナビゲーションを削除
    const existingNav = document.querySelector('.main-nav');
    if (existingNav) {
      existingNav.remove();
    }

    // 新しいナビゲーションを追加
    const navHtml = this.render(currentPath, points);
    document.body.insertAdjacentHTML('afterbegin', navHtml);

    // イベントリスナーを設定
    this.setupEventListeners();
  }

  /**
   * ポイント表示を更新
   * @param {number} points - 新しいポイント数
   */
  updatePoints(points) {
    const pointsElement = document.getElementById('nav-points-value');
    if (pointsElement) {
      pointsElement.textContent = points.toLocaleString();
    }
  }

  /**
   * ユーザーの現在のポイントを取得して表示を更新
   */
  async refreshPoints() {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const client = getSupabaseClient();
      if (!client) return;

      const { data, error } = await client
        .from('user_progress')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        this.updatePoints(data.total_points || 0);
      }
    } catch (error) {
      console.error('Failed to refresh points:', error);
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // メニュートグルボタン
    const toggleBtn = document.getElementById('nav-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleMenu());
    }

    // オーバーレイクリック
    const overlay = document.getElementById('nav-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeMenu());
    }

    // ログアウトボタン
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // リンククリック時にメニューを閉じる
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMenu();
      });
    });

    // ESCキーでメニューを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  /**
   * メニューを開閉
   */
  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * メニューを開く
   */
  openMenu() {
    const menu = document.getElementById('nav-menu');
    const overlay = document.getElementById('nav-overlay');
    const toggle = document.getElementById('nav-toggle');

    if (menu) {
      menu.classList.add('nav-menu-open');
    }
    if (overlay) {
      overlay.classList.add('nav-overlay-active');
    }
    if (toggle) {
      toggle.classList.add('nav-toggle-active');
      toggle.setAttribute('aria-label', 'メニューを閉じる');
    }

    // ボディのスクロールを無効化
    document.body.style.overflow = 'hidden';

    this.isMenuOpen = true;
  }

  /**
   * メニューを閉じる
   */
  closeMenu() {
    const menu = document.getElementById('nav-menu');
    const overlay = document.getElementById('nav-overlay');
    const toggle = document.getElementById('nav-toggle');

    if (menu) {
      menu.classList.remove('nav-menu-open');
    }
    if (overlay) {
      overlay.classList.remove('nav-overlay-active');
    }
    if (toggle) {
      toggle.classList.remove('nav-toggle-active');
      toggle.setAttribute('aria-label', 'メニューを開く');
    }

    // ボディのスクロールを有効化
    document.body.style.overflow = '';

    this.isMenuOpen = false;
  }

  /**
   * ログアウト処理
   */
  async handleLogout() {
    if (!confirm('ログアウトしますか？')) {
      return;
    }

    try {
      // ログアウト処理
      if (typeof authManager !== 'undefined' && authManager.logout) {
        await authManager.logout();
      } else {
        // フォールバック
        window.location.href = './login.html';
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('ログアウトに失敗しました');
    }
  }

  /**
   * アクティブなリンクを更新
   * @param {string} path - 現在のパス
   */
  updateActiveLink(path) {
    this.currentPath = path;

    // すべてのリンクからアクティブクラスを削除
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('nav-link-active');
    });

    // 現在のパスに対応するリンクにアクティブクラスを追加
    const activeLink = document.querySelector(`.nav-link[href="${path}"]`);
    if (activeLink) {
      activeLink.classList.add('nav-link-active');
    }
  }

  /**
   * ナビゲーションを非表示
   */
  hide() {
    const nav = document.querySelector('.main-nav');
    if (nav) {
      nav.style.display = 'none';
    }
  }

  /**
   * ナビゲーションを表示
   */
  show() {
    const nav = document.querySelector('.main-nav');
    if (nav) {
      nav.style.display = 'block';
    }
  }
}

// グローバルナビゲーションマネージャーインスタンス
const navigationManager = new NavigationManager();
