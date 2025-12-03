/**
 * Authentication Module
 * 
 * 認証UI、フロー、セッション管理を担当
 */

class AuthManager {
  constructor() {
    this.returnUrl = null;
    this.authStateCallback = null;
  }

  /**
   * 認証画面を表示
   * @param {Object} options - オプション（returnUrl等）
   */
  showAuthScreen(options = {}) {
    this.returnUrl = options.returnUrl || '/';
    
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
      <div class="auth-screen">
        <div class="auth-container">
          <div class="auth-header">
            <h1 class="auth-title">Officing</h1>
            <p class="auth-subtitle">出社チェックインゲーム</p>
          </div>

          <div class="auth-card">
            <h2 class="auth-card-title">ログイン</h2>
            
            <!-- Magic Link Form -->
            <form id="magic-link-form" class="auth-form">
              <div class="form-group">
                <label for="email" class="form-label">メールアドレス</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  class="form-input" 
                  placeholder="your@email.com"
                  required
                  autocomplete="email"
                />
              </div>
              
              <button type="submit" class="btn btn-primary btn-full" id="magic-link-btn">
                <span class="btn-text">マジックリンクを送信</span>
                <span class="btn-spinner" style="display: none;">
                  <span class="spinner-small"></span>
                </span>
              </button>
              
              <div id="magic-link-message" class="auth-message" style="display: none;"></div>
            </form>

            <!-- Divider -->
            <div class="auth-divider">
              <span>または</span>
            </div>

            <!-- Google OAuth -->
            <button id="google-signin-btn" class="btn btn-google btn-full">
              <svg class="btn-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </button>
          </div>

          <div class="auth-footer">
            <p class="auth-footer-text">
              ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>
    `;

    // イベントリスナーを設定
    this.setupAuthEventListeners();
  }

  /**
   * 認証画面のイベントリスナーを設定
   */
  setupAuthEventListeners() {
    // Magic Link Form
    const magicLinkForm = document.getElementById('magic-link-form');
    if (magicLinkForm) {
      magicLinkForm.addEventListener('submit', (e) => this.handleMagicLinkSubmit(e));
    }

    // Google Sign In
    const googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
    }
  }

  /**
   * Magic Link送信を処理
   */
  async handleMagicLinkSubmit(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('magic-link-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    const messageDiv = document.getElementById('magic-link-message');
    
    const email = emailInput.value.trim();
    
    // バリデーション
    if (!email) {
      errorHandler.showValidationErrors({
        email: 'メールアドレスを入力してください'
      });
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorHandler.showValidationErrors({
        email: '有効なメールアドレスを入力してください'
      });
      return;
    }

    // バリデーションエラーをクリア
    errorHandler.clearValidationErrors();

    // ローディング状態
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    messageDiv.style.display = 'none';

    try {
      await errorHandler.retryWithBackoff(
        async () => {
          await signInWithMagicLink(email);
        },
        {
          maxRetries: 2,
          context: { operation: 'magic-link', email },
          onRetry: (attempt, maxRetries) => {
            console.log(`Retrying magic link send (${attempt}/${maxRetries})...`);
          }
        }
      );
      
      this.showMessage(
        messageDiv, 
        `${email} にマジックリンクを送信しました。メールを確認してください。`, 
        'success'
      );
      
      emailInput.value = '';
    } catch (error) {
      console.error('Magic link error:', error);
      
      const errorInfo = errorHandler.handleError(error, {
        operation: 'magic-link',
        email
      });
      
      this.showMessage(
        messageDiv, 
        errorInfo.message, 
        'error'
      );
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  }

  /**
   * Google OAuth認証を処理
   */
  async handleGoogleSignIn() {
    const googleBtn = document.getElementById('google-signin-btn');
    
    try {
      googleBtn.disabled = true;
      googleBtn.textContent = '認証中...';
      
      await signInWithGoogle();
      // OAuth redirects, so this code may not execute
    } catch (error) {
      console.error('Google sign in error:', error);
      
      const errorInfo = errorHandler.handleError(error, {
        operation: 'google-signin'
      });
      
      errorHandler.showError(errorInfo.message, {
        title: 'Google認証エラー',
        type: 'error'
      });
      
      googleBtn.disabled = false;
      googleBtn.textContent = 'Googleでログイン';
    }
  }

  /**
   * メッセージを表示
   */
  showMessage(element, message, type = 'info') {
    if (!element) return;
    
    element.textContent = message;
    element.className = `auth-message auth-message-${type}`;
    element.style.display = 'block';
  }

  /**
   * 認証ガード - 未認証の場合は認証画面へリダイレクト
   * @param {boolean} isAuthenticated - 認証状態
   * @param {string} currentPath - 現在のパス
   * @returns {boolean} - 認証が必要かどうか
   */
  requireAuth(isAuthenticated, currentPath = window.location.pathname) {
    // 認証不要なパス
    const publicPaths = ['/auth', '/login'];
    const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
    
    if (!isAuthenticated && !isPublicPath) {
      console.log('🔒 Authentication required, redirecting...');
      this.showAuthScreen({ returnUrl: window.location.href });
      return true;
    }
    
    return false;
  }

  /**
   * 認証成功後のリダイレクト
   */
  handleAuthSuccess() {
    console.log('✅ Authentication successful');
    
    // 既にホームページにいる場合はリダイレクトしない
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/officing/') || currentPath.endsWith('/officing/index.html');
    
    if (isHomePage) {
      console.log('Already on home page, skipping redirect');
      return;
    }
    
    // ログインページにいる場合のみリダイレクト
    const isLoginPage = currentPath.includes('login.html') || currentPath.includes('auth-demo.html');
    if (!isLoginPage) {
      console.log('Not on login page, skipping redirect');
      return;
    }
    
    // returnUrlがあればそこへ、なければダッシュボードへ
    if (this.returnUrl && this.returnUrl !== '/auth' && this.returnUrl !== '/login' && !this.returnUrl.includes('login.html')) {
      console.log('Redirecting to:', this.returnUrl);
      window.location.href = this.returnUrl;
    } else {
      console.log('Redirecting to home');
      window.location.href = './';
    }
  }

  /**
   * ログアウト処理
   */
  async logout() {
    try {
      await signOut();
      console.log('👋 Logged out successfully');
      this.showAuthScreen();
    } catch (error) {
      console.error('Logout error:', error);
      
      const errorInfo = errorHandler.handleError(error, {
        operation: 'logout'
      });
      
      errorHandler.showError(errorInfo.message, {
        title: 'ログアウトエラー',
        type: 'error'
      });
    }
  }
}

// グローバルインスタンス
const authManager = new AuthManager();
