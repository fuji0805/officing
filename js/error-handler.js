/**
 * Error Handler Module
 * 
 * 統合エラーハンドリングとバリデーション
 * Requirements: 全般
 * 
 * Features:
 * - ネットワークエラーハンドリング
 * - 認証エラーハンドリング
 * - バリデーションエラー表示
 * - リトライロジック（exponential backoff）
 * - ユーザーフレンドリーなエラーメッセージ
 */

class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1秒
    this.maxDelay = 30000; // 30秒
    this.errorListeners = [];
  }

  /**
   * エラーを処理
   * @param {Error} error - エラーオブジェクト
   * @param {Object} context - エラーコンテキスト
   * @returns {Object} - 処理されたエラー情報
   */
  handleError(error, context = {}) {
    console.error('Error occurred:', error, context);

    // エラータイプを判定
    const errorType = this.classifyError(error);
    
    // エラーメッセージを生成
    const userMessage = this.getUserFriendlyMessage(error, errorType);
    
    // エラー情報を構築
    const errorInfo = {
      type: errorType,
      originalError: error,
      message: userMessage,
      context,
      timestamp: new Date().toISOString(),
      canRetry: this.canRetry(errorType),
      shouldReauth: errorType === 'AUTH_ERROR'
    };

    // リスナーに通知
    this.notifyListeners(errorInfo);

    return errorInfo;
  }

  /**
   * エラータイプを分類
   * @param {Error} error - エラーオブジェクト
   * @returns {string} - エラータイプ
   */
  classifyError(error) {
    // ネットワークエラー
    if (!navigator.onLine) {
      return 'NETWORK_OFFLINE';
    }
    
    if (error.message?.includes('fetch') || 
        error.message?.includes('network') ||
        error.name === 'NetworkError') {
      return 'NETWORK_ERROR';
    }

    // 認証エラー
    if (error.message?.includes('auth') ||
        error.message?.includes('authenticated') ||
        error.message?.includes('session') ||
        error.message?.includes('token') ||
        error.status === 401) {
      return 'AUTH_ERROR';
    }

    // バリデーションエラー
    if (error.message?.includes('validation') ||
        error.message?.includes('invalid') ||
        error.message?.includes('required') ||
        error.status === 400) {
      return 'VALIDATION_ERROR';
    }

    // 権限エラー
    if (error.status === 403) {
      return 'PERMISSION_ERROR';
    }

    // リソースが見つからない
    if (error.status === 404) {
      return 'NOT_FOUND_ERROR';
    }

    // サーバーエラー
    if (error.status >= 500) {
      return 'SERVER_ERROR';
    }

    // タイムアウト
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }

    // レート制限
    if (error.status === 429) {
      return 'RATE_LIMIT_ERROR';
    }

    // その他
    return 'UNKNOWN_ERROR';
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを生成
   * @param {Error} error - エラーオブジェクト
   * @param {string} errorType - エラータイプ
   * @returns {string} - ユーザー向けメッセージ
   */
  getUserFriendlyMessage(error, errorType) {
    const messages = {
      'NETWORK_OFFLINE': 'インターネット接続がありません。オンラインに戻ると自動的に同期されます。',
      'NETWORK_ERROR': 'ネットワークエラーが発生しました。接続を確認して再度お試しください。',
      'AUTH_ERROR': 'ログインセッションが期限切れです。再度ログインしてください。',
      'VALIDATION_ERROR': '入力内容に誤りがあります。確認して再度お試しください。',
      'PERMISSION_ERROR': 'この操作を実行する権限がありません。',
      'NOT_FOUND_ERROR': '要求されたリソースが見つかりませんでした。',
      'SERVER_ERROR': 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。',
      'TIMEOUT_ERROR': '処理がタイムアウトしました。再度お試しください。',
      'RATE_LIMIT_ERROR': 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
      'UNKNOWN_ERROR': '予期しないエラーが発生しました。'
    };

    let message = messages[errorType] || messages['UNKNOWN_ERROR'];

    // 特定のエラーメッセージがある場合は追加
    if (error.message && !error.message.includes('fetch')) {
      message += `\n詳細: ${error.message}`;
    }

    return message;
  }

  /**
   * リトライ可能かチェック
   * @param {string} errorType - エラータイプ
   * @returns {boolean} - リトライ可能か
   */
  canRetry(errorType) {
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
      'RATE_LIMIT_ERROR'
    ];
    return retryableErrors.includes(errorType);
  }

  /**
   * Exponential backoffでリトライ
   * @param {Function} fn - リトライする関数
   * @param {Object} options - オプション
   * @returns {Promise} - 実行結果
   */
  async retryWithBackoff(fn, options = {}) {
    const {
      maxRetries = this.maxRetries,
      baseDelay = this.baseDelay,
      maxDelay = this.maxDelay,
      context = {},
      onRetry = null
    } = options;

    const operationId = context.operationId || `op_${Date.now()}`;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 実行を試みる
        const result = await fn();
        
        // 成功したらリトライカウントをクリア
        this.retryAttempts.delete(operationId);
        
        return result;
      } catch (error) {
        lastError = error;
        
        // エラーを分類
        const errorType = this.classifyError(error);
        
        // リトライ不可能なエラーの場合は即座に失敗
        if (!this.canRetry(errorType)) {
          throw error;
        }

        // 最後の試行の場合は失敗
        if (attempt === maxRetries) {
          console.error(`Operation failed after ${maxRetries} retries:`, error);
          throw error;
        }

        // Exponential backoffで待機時間を計算
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        );

        // ジッターを追加（ランダムな遅延で衝突を避ける）
        const jitter = Math.random() * 0.3 * delay;
        const totalDelay = delay + jitter;

        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(totalDelay)}ms`);

        // リトライコールバックを呼び出し
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, totalDelay, error);
        }

        // 待機
        await this.wait(totalDelay);
      }
    }

    throw lastError;
  }

  /**
   * 待機
   * @param {number} ms - ミリ秒
   * @returns {Promise}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * エラーを表示
   * @param {string} message - エラーメッセージ
   * @param {Object} options - オプション
   */
  showError(message, options = {}) {
    const {
      title = 'エラー',
      type = 'error',
      duration = 5000,
      actions = []
    } = options;

    // 既存のエラー通知を削除
    const existingNotifications = document.querySelectorAll('.error-notification');
    existingNotifications.forEach(n => n.remove());

    // エラー通知を作成
    const notification = document.createElement('div');
    notification.className = `error-notification error-notification-${type}`;
    
    const actionsHtml = actions.length > 0 ? `
      <div class="error-actions">
        ${actions.map(action => `
          <button class="error-action-btn" data-action="${action.id}">
            ${action.label}
          </button>
        `).join('')}
      </div>
    ` : '';

    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-notification-header">
          <span class="error-notification-icon">${this.getErrorIcon(type)}</span>
          <span class="error-notification-title">${title}</span>
          <button class="error-notification-close" aria-label="閉じる">×</button>
        </div>
        <div class="error-notification-message">${message}</div>
        ${actionsHtml}
      </div>
    `;

    document.body.appendChild(notification);

    // アニメーション
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // 閉じるボタン
    const closeBtn = notification.querySelector('.error-notification-close');
    closeBtn.addEventListener('click', () => {
      this.hideNotification(notification);
    });

    // アクションボタン
    actions.forEach(action => {
      const btn = notification.querySelector(`[data-action="${action.id}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          action.handler();
          this.hideNotification(notification);
        });
      }
    });

    // 自動で閉じる
    if (duration > 0) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, duration);
    }

    return notification;
  }

  /**
   * 通知を非表示
   * @param {HTMLElement} notification - 通知要素
   */
  hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  /**
   * エラーアイコンを取得
   * @param {string} type - エラータイプ
   * @returns {string} - アイコン
   */
  getErrorIcon(type) {
    const icons = {
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'success': '✅'
    };
    return icons[type] || icons['error'];
  }

  /**
   * バリデーションエラーを表示
   * @param {Object} errors - フィールドごとのエラー
   */
  showValidationErrors(errors) {
    Object.keys(errors).forEach(fieldName => {
      const field = document.querySelector(`[name="${fieldName}"]`);
      if (field) {
        // フィールドにエラークラスを追加
        field.classList.add('field-error');
        
        // エラーメッセージを表示
        let errorElement = field.parentElement.querySelector('.field-error-message');
        if (!errorElement) {
          errorElement = document.createElement('div');
          errorElement.className = 'field-error-message';
          field.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = errors[fieldName];
      }
    });
  }

  /**
   * バリデーションエラーをクリア
   * @param {string} fieldName - フィールド名（省略時は全て）
   */
  clearValidationErrors(fieldName = null) {
    if (fieldName) {
      const field = document.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.classList.remove('field-error');
        const errorElement = field.parentElement.querySelector('.field-error-message');
        if (errorElement) {
          errorElement.remove();
        }
      }
    } else {
      // 全てのエラーをクリア
      document.querySelectorAll('.field-error').forEach(field => {
        field.classList.remove('field-error');
      });
      document.querySelectorAll('.field-error-message').forEach(msg => {
        msg.remove();
      });
    }
  }

  /**
   * エラーリスナーを追加
   * @param {Function} callback - コールバック関数
   */
  addErrorListener(callback) {
    this.errorListeners.push(callback);
  }

  /**
   * エラーリスナーを削除
   * @param {Function} callback - コールバック関数
   */
  removeErrorListener(callback) {
    this.errorListeners = this.errorListeners.filter(l => l !== callback);
  }

  /**
   * リスナーに通知
   * @param {Object} errorInfo - エラー情報
   */
  notifyListeners(errorInfo) {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (error) {
        console.error('Error listener failed:', error);
      }
    });
  }

  /**
   * グローバルエラーハンドラーを設定
   */
  setupGlobalHandlers() {
    // 未処理のPromise拒否
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      const errorInfo = this.handleError(event.reason, {
        type: 'unhandled_rejection'
      });
      
      // ユーザーに通知
      this.showError(errorInfo.message, {
        title: 'エラーが発生しました',
        type: 'error'
      });
      
      event.preventDefault();
    });

    // グローバルエラー
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      const errorInfo = this.handleError(event.error, {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      
      // 重大なエラーのみユーザーに通知
      if (errorInfo.type !== 'UNKNOWN_ERROR') {
        this.showError(errorInfo.message, {
          title: 'エラーが発生しました',
          type: 'error'
        });
      }
    });

    console.log('✅ Global error handlers initialized');
  }
}

// グローバルインスタンス
const errorHandler = new ErrorHandler();

// グローバルハンドラーを自動設定
errorHandler.setupGlobalHandlers();
