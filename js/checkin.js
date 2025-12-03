/**
 * Check-in Module
 * 
 * QRコードチェックイン機能の実装
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 14.1, 14.2, 14.3, 14.4
 */

class CheckinManager {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * QR URLからtagパラメータを抽出
   * @param {string} url - チェックイン用URL
   * @returns {string|null} - 抽出されたtag、または null
   * 
   * Requirements: 1.1, 14.2
   */
  parseQRUrl(url) {
    try {
      const urlObj = new URL(url);
      const tag = urlObj.searchParams.get('tag');
      
      if (!tag || tag.trim() === '') {
        console.log('⚠️ Tag parameter missing or empty, using default');
        return null;
      }
      
      // タグのバリデーション（英数字、ハイフン、アンダースコアのみ）
      const validTagPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validTagPattern.test(tag)) {
        console.warn('⚠️ Invalid tag format, using default');
        return null;
      }
      
      console.log('✅ Tag extracted:', tag);
      return tag.trim();
    } catch (error) {
      console.error('❌ Failed to parse URL:', error);
      return null;
    }
  }

  /**
   * デフォルトタグを取得
   * @returns {string} - デフォルトタグ
   * 
   * Requirements: 14.3
   */
  getDefaultTag() {
    return CONFIG.DEFAULT_TAG || 'office';
  }

  /**
   * チェックインを自動実行
   * @param {string} tag - チェックイン場所のタグ
   * @returns {Promise<Object>} - チェックイン結果
   * 
   * Requirements: 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 14.4
   */
  async executeCheckin(tag) {
    if (this.isProcessing) {
      console.log('⏳ Check-in already in progress');
      return { success: false, error: 'Check-in already in progress' };
    }

    this.isProcessing = true;

    try {
      // リトライロジックでチェックインを実行
      return await errorHandler.retryWithBackoff(
        async () => {
          // 認証チェック
          const user = await getCurrentUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          // タグが無効な場合はデフォルトを使用
          const finalTag = tag || this.getDefaultTag();
          console.log('📍 Checking in with tag:', finalTag);

          // Edge Functionを呼び出し
          const client = getSupabaseClient();
          if (!client) throw new Error('Supabase client not initialized');

          const { data, error } = await client.functions.invoke('checkin', {
            body: {
              tag: finalTag,
              timestamp: new Date().toISOString()
            }
          });

          if (error) {
            throw error;
          }

          if (!data.success) {
            return {
              success: false,
              error: data.error,
              isDuplicate: data.isDuplicate || false
            };
          }

          console.log('✅ Check-in successful');
          return {
            success: true,
            attendance: data.attendance,
            monthlyCount: data.rewards.monthlyCount,
            streak: {
              currentStreak: data.rewards.streak.current,
              maxStreak: data.rewards.streak.max,
              isNewRecord: data.rewards.streak.isNewRecord
            },
            ticketsEarned: data.rewards.ticketsEarned,
            newTitles: data.newTitles || [],
            tag: finalTag
          };
        },
        {
          maxRetries: 3,
          context: { operationId: 'checkin', tag },
          onRetry: (attempt, maxRetries, delay) => {
            console.log(`Retrying check-in (${attempt}/${maxRetries}) in ${Math.round(delay)}ms...`);
          }
        }
      );
    } catch (error) {
      console.error('❌ Check-in failed:', error);
      
      // エラーハンドリング
      const errorInfo = errorHandler.handleError(error, {
        operation: 'checkin',
        tag
      });

      // オフラインの場合はキューに追加
      if (errorInfo.type === 'NETWORK_OFFLINE' && offlineQueue) {
        errorHandler.showError(
          'オフラインです。チェックインをキューに追加しました。',
          {
            title: 'オフライン',
            type: 'info',
            duration: 3000
          }
        );
      } else if (errorInfo.shouldReauth) {
        // 認証エラーの場合はログイン画面へ
        errorHandler.showError(errorInfo.message, {
          title: '認証エラー',
          type: 'error',
          actions: [
            {
              id: 'reauth',
              label: 'ログイン',
              handler: () => {
                window.location.href = './login.html';
              }
            }
          ]
        });
      } else {
        // その他のエラー
        errorHandler.showError(errorInfo.message, {
          title: 'チェックインエラー',
          type: 'error'
        });
      }

      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 日付をYYYY-MM-DD形式にフォーマット
   * @param {Date} date - 日付オブジェクト
   * @returns {string} - フォーマットされた日付
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }



  /**
   * QRコードURLを自動検出して処理
   * @returns {Promise<Object|null>} - チェックイン結果、またはnull
   * 
   * Requirements: 1.1, 1.2
   */
  async handleQRCodeUrl() {
    const currentUrl = window.location.href;
    const tag = this.parseQRUrl(currentUrl);
    
    // tagパラメータがない場合は何もしない
    const urlObj = new URL(currentUrl);
    if (!urlObj.searchParams.has('tag')) {
      return null;
    }

    console.log('📱 QR Code detected, executing auto check-in...');
    
    // チェックインを自動実行
    const result = await this.executeCheckin(tag);
    
    return result;
  }
}

// グローバルインスタンス
const checkinManager = new CheckinManager();
