/**
 * Main Application Entry Point
 * 
 * アプリケーションの初期化とルーティング
 */

class OfficingApp {
  constructor() {
    this.currentUser = null;
    this.currentRoute = null;
  }

  /**
   * アプリケーションを初期化
   */
  async init() {
    console.log('🚀 Initializing Officing App...');
    
    // Service Workerを登録
    this.registerServiceWorker();
    
    // Supabaseクライアントを初期化
    const client = initSupabase();
    if (!client) {
      this.showError('Supabaseの初期化に失敗しました。設定を確認してください。');
      return;
    }

    // 認証状態の監視を開始
    this.setupAuthListener();

    // 初期認証チェック
    await this.checkAuth();

    // URLパラメータをチェック（QRコードからのアクセス）
    this.handleQRCodeUrl();

    // ナビゲーションメニューをマウント（認証済みの場合）
    if (this.currentUser) {
      this.mountNavigation();
    }

    // ルーティングを初期化
    this.setupRouting();

    // ローディング画面を非表示
    this.hideLoading();

    console.log('✅ App initialized');
  }

  /**
   * ナビゲーションメニューをマウント
   */
  mountNavigation() {
    if (typeof navigationManager !== 'undefined') {
      const currentPath = router.getCurrentRoute() || window.location.pathname;
      navigationManager.mount(currentPath);
    }
  }

  /**
   * Service Workerを登録
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    } else {
      console.log('ℹ️ Service Worker not supported');
    }
  }

  /**
   * 認証状態の監視を設定
   */
  setupAuthListener() {
    onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        this.currentUser = session?.user || null;
        this.onSignedIn();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.onSignedOut();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        this.currentUser = session?.user || null;
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated');
        this.currentUser = session?.user || null;
      }
    });
  }

  /**
   * 認証状態をチェック
   */
  async checkAuth() {
    try {
      // セッションの有効性をチェック
      const isValid = await isSessionValid();
      
      if (isValid) {
        const session = await getCurrentSession();
        this.currentUser = session?.user || null;
        
        if (this.currentUser) {
          console.log('✅ User authenticated:', this.currentUser.email);
          return true;
        }
      }
      
      console.log('ℹ️ User not authenticated');
      this.currentUser = null;
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      this.currentUser = null;
      return false;
    }
  }

  /**
   * QRコードURLを処理
   */
  async handleQRCodeUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    
    if (tag) {
      console.log('📱 QR Code detected with tag:', tag);
      
      if (!this.currentUser) {
        console.log('🔒 Authentication required for check-in');
        authManager.showAuthScreen({ returnUrl: window.location.href });
      } else {
        console.log('✅ User authenticated, executing check-in...');
        
        // チェックインを自動実行
        const result = await checkinManager.handleQRCodeUrl();
        
        if (result) {
          if (result.success) {
            this.showCheckinSuccess(result);
          } else if (result.isDuplicate) {
            this.showCheckinDuplicate();
          } else {
            this.showCheckinError(result.error);
          }
        }
      }
    }
  }

  /**
   * チェックイン成功画面を表示
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  showCheckinSuccess(result) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    // 現在の日付をフォーマット
    const now = new Date();
    const dateStr = this.formatDate(now);
    const timeStr = this.formatTime(now);

    // くじチケットまでのカウントダウンを計算
    const lotteryInfo = this.calculateLotteryCountdown(result.monthlyCount);

    appDiv.innerHTML = `
      <div class="checkin-success-screen">
        <!-- Confetti Container -->
        <div class="confetti-container" id="confetti-container"></div>
        
        <div class="checkin-container">
          <div class="checkin-header">
            <h1 class="checkin-title">✅ チェックイン成功！</h1>
          </div>
          
          <div class="checkin-card">
            <!-- Stamp Display -->
            <div class="checkin-stamp">
              <span class="stamp-icon">🎫</span>
              <div class="stamp-date">${dateStr} ${timeStr}</div>
              <div class="stamp-tag">📍 ${result.tag}</div>
            </div>
            
            <!-- Attendance Metrics -->
            <div class="checkin-metrics">
              <div class="metric-card">
                <span class="metric-value">📅 ${result.monthlyCount}</span>
                <span class="metric-label">今月の出社</span>
              </div>
              <div class="metric-card">
                <span class="metric-value"><span class="streak-fire">🔥</span> ${result.streak.currentStreak}</span>
                <span class="metric-label">連続出社</span>
              </div>
            </div>
            
            ${result.streak.isNewRecord ? '<div class="streak-record">🎉 新記録達成！</div>' : ''}
            
            <!-- Lottery Ticket Countdown -->
            <div class="lottery-countdown ${lotteryInfo.earned ? 'lottery-earned' : ''}">
              <div class="lottery-countdown-title">
                ${lotteryInfo.earned ? '🎉 くじチケット獲得！' : '次のくじチケットまで'}
              </div>
              <div class="lottery-countdown-value">
                ${lotteryInfo.earned ? '🎫 +1' : `あと ${lotteryInfo.remaining} 回`}
              </div>
              <div class="lottery-countdown-subtitle">
                ${lotteryInfo.earned ? `${lotteryInfo.milestone}回達成` : `${lotteryInfo.milestone}回で獲得`}
              </div>
            </div>
            
            <div class="checkin-actions">
              <button onclick="window.location.href='/'" class="btn btn-primary btn-full">
                ダッシュボードへ
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // コンフェッティアニメーションを開始
    this.startConfetti();

    // 称号獲得があれば表示
    if (result.newTitles && result.newTitles.length > 0) {
      setTimeout(() => {
        this.showTitleAcquisition(result.newTitles[0]);
      }, 1000);
    }
  }

  /**
   * 日付をフォーマット
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * 時刻をフォーマット
   */
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * くじチケットまでのカウントダウンを計算
   * Requirements: 2.5, 3.1, 3.2, 3.3
   */
  calculateLotteryCountdown(monthlyCount) {
    const milestones = [4, 8, 12];
    
    // 次のマイルストーンを見つける
    let nextMilestone = milestones.find(m => m > monthlyCount);
    
    // すべてのマイルストーンを達成済みの場合
    if (!nextMilestone) {
      // 12回以降は4回ごと
      nextMilestone = Math.ceil(monthlyCount / 4) * 4 + 4;
    }
    
    // 現在のマイルストーンを達成したかチェック
    const justEarned = milestones.includes(monthlyCount) || 
                       (monthlyCount > 12 && monthlyCount % 4 === 0);
    
    return {
      milestone: nextMilestone,
      remaining: nextMilestone - monthlyCount,
      earned: justEarned
    };
  }

  /**
   * コンフェッティアニメーションを開始
   * Requirements: 2.1
   */
  startConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#FCD34D', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        container.appendChild(confetti);
        
        // アニメーション終了後に削除
        setTimeout(() => {
          confetti.remove();
        }, 4000);
      }, i * 30);
    }
  }

  /**
   * 称号獲得アニメーションを表示
   * Requirements: 2.4
   */
  showTitleAcquisition(title) {
    const overlay = document.createElement('div');
    overlay.className = 'title-acquisition';
    overlay.innerHTML = `
      <div class="title-acquisition-content">
        <div class="title-acquisition-icon">👑</div>
        <div class="title-acquisition-title">称号獲得！</div>
        <div class="title-acquisition-name">${title.name}</div>
        <div class="title-acquisition-description">${title.description || ''}</div>
        <button class="title-acquisition-close" onclick="this.closest('.title-acquisition').remove()">
          続ける
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  /**
   * 重複チェックイン画面を表示
   */
  showCheckinDuplicate() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
      <div class="checkin-error-screen">
        <div class="checkin-container">
          <div class="checkin-header">
            <h1 class="checkin-title">⚠️ 本日はチェックイン済みです</h1>
          </div>
          
          <div class="checkin-card">
            <p>1日に1回のみチェックインできます。</p>
            <p>また明日お会いしましょう！</p>
            
            <div class="checkin-actions">
              <button onclick="window.location.href='/'" class="btn btn-primary">
                ダッシュボードへ
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * チェックインエラー画面を表示
   */
  showCheckinError(errorMessage) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
      <div class="checkin-error-screen">
        <div class="checkin-container">
          <div class="checkin-header">
            <h1 class="checkin-title">❌ チェックイン失敗</h1>
          </div>
          
          <div class="checkin-card">
            <p>エラーが発生しました:</p>
            <p class="error-message">${errorMessage}</p>
            
            <div class="checkin-actions">
              <button onclick="window.location.reload()" class="btn btn-secondary">
                再試行
              </button>
              <button onclick="window.location.href='/'" class="btn btn-primary">
                ダッシュボードへ
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * ルーティングを設定
   */
  setupRouting() {
    // ルートを登録
    router.register('/', async () => {
      await this.showDashboard();
    }, { requireAuth: true, title: 'ホーム - Officing' });

    router.register('/stamps', async () => {
      if (typeof stampManager !== 'undefined') {
        await stampManager.showStampCollectionScreen();
      }
    }, { requireAuth: true, title: 'スタンプ帳 - Officing' });

    router.register('/lottery', async () => {
      if (typeof lotteryManager !== 'undefined') {
        await lotteryManager.showLotteryScreen();
      }
    }, { requireAuth: true, title: 'くじ - Officing' });

    router.register('/quests', async () => {
      if (typeof questManager !== 'undefined') {
        await questManager.showQuestScreen();
      }
    }, { requireAuth: true, title: 'クエスト - Officing' });

    router.register('/shop', async () => {
      if (typeof shopManager !== 'undefined') {
        await shopManager.showShopScreen();
      }
    }, { requireAuth: true, title: 'ショップ - Officing' });

    router.register('/profile', async () => {
      if (typeof levelManager !== 'undefined') {
        await levelManager.showProfileScreen();
      }
    }, { requireAuth: true, title: 'プロフィール - Officing' });

    router.register('/titles', async () => {
      if (typeof titleManager !== 'undefined') {
        await titleManager.showTitleCollectionScreen();
      }
    }, { requireAuth: true, title: '称号 - Officing' });

    // ナビゲーション後のコールバック
    router.afterNavigate((path) => {
      // ナビゲーションメニューのアクティブリンクを更新
      if (typeof navigationManager !== 'undefined') {
        navigationManager.updateActiveLink(path);
      }
    });

    // ルーターを初期化
    router.init();
  }

  /**
   * ダッシュボードを表示
   */
  async showDashboard() {
    if (typeof dashboardManager !== 'undefined') {
      await dashboardManager.showDashboard();
    }
  }

  /**
   * サインイン時の処理
   */
  onSignedIn() {
    console.log('✅ User signed in');
    
    // ナビゲーションメニューをマウント
    this.mountNavigation();
    
    // 認証成功処理
    if (typeof authManager !== 'undefined') {
      authManager.handleAuthSuccess();
    }
  }

  /**
   * サインアウト時の処理
   */
  onSignedOut() {
    console.log('👋 User signed out');
    
    // ナビゲーションメニューを非表示
    if (typeof navigationManager !== 'undefined') {
      navigationManager.hide();
    }
    
    // 認証画面を表示
    if (typeof authManager !== 'undefined') {
      authManager.showAuthScreen();
    }
  }

  /**
   * 認証ガード - 保護されたルートへのアクセスをチェック
   */
  requireAuth() {
    return authManager.requireAuth(!!this.currentUser);
  }

  /**
   * ログアウト
   */
  async logout() {
    await authManager.logout();
  }

  /**
   * エラーを表示
   */
  showError(message) {
    console.error('❌', message);
    const appDiv = document.getElementById('app');
    if (appDiv) {
      appDiv.innerHTML = `
        <div class="error-screen">
          <h1>エラー</h1>
          <p>${message}</p>
        </div>
      `;
    }
  }

  /**
   * ローディング画面を非表示
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

// アプリケーションインスタンス
let app = null;

// DOMContentLoaded時にアプリを初期化
document.addEventListener('DOMContentLoaded', () => {
  app = new OfficingApp();
  app.init();
});
