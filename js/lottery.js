/**
 * Lottery System
 * 
 * くじシステムの実装
 * Requirements: 3.5, 4.1
 */

class LotteryManager {
  constructor() {
    this.isDrawing = false;
  }

  /**
   * くじ画面を表示
   * Requirements: 3.5, 4.1
   */
  async showLotteryScreen() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    try {
      // ユーザーの進捗データを取得
      const userData = await this.getUserProgress();
      
      if (!userData) {
        this.showError('ユーザーデータの取得に失敗しました');
        return;
      }

      // チケット数を取得
      const ticketCount = await this.getTicketCount(userData.user_id);

      appDiv.innerHTML = `
        <div class="lottery-screen">
          <div class="lottery-container">
            <div class="lottery-header">
              <h1 class="lottery-title">🎰 くじ引き</h1>
              <p class="lottery-subtitle">チケットを使ってくじを引こう！</p>
            </div>
            
            <div class="lottery-card">
              <!-- チケット数表示 -->
              <div class="lottery-ticket-display">
                <div class="ticket-icon">🎫</div>
                <div class="ticket-count-label">所持チケット</div>
                <div class="ticket-count-value" id="ticket-count">${ticketCount}</div>
              </div>
              
              <!-- くじ実行ボタン -->
              <div class="lottery-draw-section">
                <button 
                  id="draw-button" 
                  class="btn btn-primary btn-full btn-lottery"
                  ${ticketCount === 0 ? 'disabled' : ''}
                  onclick="lotteryManager.drawLottery()"
                >
                  ${ticketCount === 0 ? 'チケットがありません' : 'くじを引く'}
                </button>
                
                ${ticketCount === 0 ? `
                  <p class="lottery-hint">
                    💡 チケットは出社4回、8回、12回で獲得できます
                  </p>
                ` : ''}
              </div>
              
              <!-- 景品ランク説明 -->
              <div class="lottery-ranks">
                <h3 class="lottery-ranks-title">景品ランク</h3>
                <div class="rank-list">
                  <div class="rank-item rank-s">
                    <span class="rank-badge">S</span>
                    <span class="rank-name">超レア</span>
                  </div>
                  <div class="rank-item rank-a">
                    <span class="rank-badge">A</span>
                    <span class="rank-name">レア</span>
                  </div>
                  <div class="rank-item rank-b">
                    <span class="rank-badge">B</span>
                    <span class="rank-name">アンコモン</span>
                  </div>
                  <div class="rank-item rank-c">
                    <span class="rank-badge">C</span>
                    <span class="rank-name">コモン</span>
                  </div>
                </div>
              </div>
              
              <!-- ナビゲーション -->
              <div class="lottery-actions">
                <button onclick="if(typeof dashboardManager !== 'undefined') { dashboardManager.isLoading = false; dashboardManager.showDashboard(); }" class="btn btn-secondary btn-full">
                  ダッシュボードへ戻る
                </button>
              </div>
            </div>
          </div>
          
          <!-- 抽選結果モーダル（非表示） -->
          <div id="lottery-result-modal" class="lottery-result-modal" style="display: none;">
            <div class="lottery-result-content">
              <div class="lottery-result-animation" id="lottery-animation">
                <div class="lottery-spinner">🎰</div>
                <p class="lottery-drawing-text">抽選中...</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // 背景色を設定
      if (typeof setScreenBackground !== 'undefined') {
        setScreenBackground('linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)');
      }
      
      // ナビゲーションバーをマウント
      if (typeof navigationManager !== 'undefined') {
        navigationManager.mount('/lottery', userData.total_points);
      }
    } catch (error) {
      console.error('Failed to show lottery screen:', error);
      this.showError('くじ画面の表示に失敗しました');
    }
  }

  /**
   * ユーザー進捗データを取得
   */
  async getUserProgress() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await client
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * チケット数を取得
   * Requirements: 3.5
   */
  async getTicketCount(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('lottery_tickets')
      .select('ticket_count')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // データが存在しない場合は初期レコードを作成
    if (!data) {
      const { data: newData, error: insertError } = await client
        .from('lottery_tickets')
        .insert({
          user_id: userId,
          ticket_count: 0,
          earned_from: 'initial'
        })
        .select('ticket_count')
        .single();
      
      if (insertError) throw insertError;
      return newData?.ticket_count || 0;
    }

    return data.ticket_count || 0;
  }

  /**
   * くじを引く
   * Requirements: 4.1
   */
  async drawLottery() {
    if (this.isDrawing) return;
    
    this.isDrawing = true;
    const drawButton = document.getElementById('draw-button');
    if (drawButton) {
      drawButton.disabled = true;
      drawButton.textContent = '抽選中...';
    }

    try {
      // 抽選モーダルを表示
      this.showDrawingAnimation();

      // リトライロジックでくじを実行
      const result = await errorHandler.retryWithBackoff(
        async () => await this.executeLotteryDraw(),
        {
          maxRetries: 3,
          context: { operation: 'lottery-draw' },
          onRetry: (attempt, maxRetries) => {
            console.log(`Retrying lottery draw (${attempt}/${maxRetries})...`);
          }
        }
      );

      // アニメーション完了を待つ
      await this.wait(2000);

      // 結果を表示
      this.showPrizeResult(result);

      // チケット数を更新
      await this.updateTicketDisplay();

    } catch (error) {
      console.error('Lottery draw failed:', error);
      this.hideDrawingAnimation();
      
      const errorInfo = errorHandler.handleError(error, {
        operation: 'lottery-draw'
      });
      
      if (errorInfo.shouldReauth) {
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
        errorHandler.showError(errorInfo.message, {
          title: 'くじ抽選エラー',
          type: 'error',
          actions: [
            {
              id: 'retry',
              label: '再試行',
              handler: () => {
                this.drawLottery();
              }
            }
          ]
        });
      }
    } finally {
      this.isDrawing = false;
      if (drawButton) {
        drawButton.disabled = false;
        drawButton.textContent = 'くじを引く';
      }
    }
  }

  /**
   * くじ抽選を実行（Edge Function呼び出し）
   * Requirements: 4.1
   */
  async executeLotteryDraw() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Call lottery-draw Edge Function
    const { data, error } = await client.functions.invoke('lottery-draw', {
      method: 'POST'
    });

    if (error) {
      throw new Error(error.message || 'Lottery draw failed');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Lottery draw failed');
    }

    return data;
  }

  /**
   * 抽選アニメーションを表示
   */
  showDrawingAnimation() {
    const modal = document.getElementById('lottery-result-modal');
    if (modal) {
      modal.style.display = 'flex';
      
      // スピナーアニメーション
      const spinner = modal.querySelector('.lottery-spinner');
      if (spinner) {
        spinner.style.animation = 'spin 0.5s linear infinite';
      }
    }
  }

  /**
   * 抽選アニメーションを非表示
   */
  hideDrawingAnimation() {
    const modal = document.getElementById('lottery-result-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * 景品結果を表示
   * Requirements: 4.1
   */
  showPrizeResult(result) {
    const modal = document.getElementById('lottery-result-modal');
    if (!modal) return;

    const { prize, rank, pityCounter } = result;

    // ランクに応じた色
    const rankColors = {
      S: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
      A: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
      B: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
      C: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
    };

    // Extract reward information
    let rewardText = '';
    if (prize.reward_type === 'points' && prize.reward_value?.amount) {
      rewardText = `<div class="prize-points">+${prize.reward_value.amount} ポイント</div>`;
    } else if (prize.reward_type === 'title' && prize.reward_value?.title_name) {
      rewardText = `<div class="prize-points">称号「${prize.reward_value.title_name}」を獲得！</div>`;
    } else if (prize.reward_type === 'item' && prize.reward_value?.value) {
      rewardText = `<div class="prize-points">${prize.reward_value.value}円分</div>`;
    }

    // Pity counter display (if close to threshold)
    let pityText = '';
    if (pityCounter >= 7) {
      pityText = `<div class="pity-counter">天井まであと${10 - pityCounter}回</div>`;
    }

    modal.innerHTML = `
      <div class="lottery-result-content lottery-result-show">
        <div class="lottery-result-card" style="background: ${rankColors[rank]}">
          <div class="lottery-result-rank">
            <span class="result-rank-badge rank-${rank.toLowerCase()}">${rank}</span>
          </div>
          <div class="lottery-result-prize">
            <div class="prize-name">${prize.name}</div>
            <div class="prize-description">${prize.description || ''}</div>
            ${rewardText}
            ${pityText}
          </div>
          <button onclick="lotteryManager.closePrizeResult()" class="btn btn-primary btn-full">
            閉じる
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  /**
   * 景品結果モーダルを閉じる
   */
  closePrizeResult() {
    const modal = document.getElementById('lottery-result-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * チケット表示を更新
   */
  async updateTicketDisplay() {
    try {
      const userData = await this.getUserProgress();
      const ticketCount = await this.getTicketCount(userData.user_id);
      
      const ticketCountElement = document.getElementById('ticket-count');
      if (ticketCountElement) {
        ticketCountElement.textContent = ticketCount;
      }

      const drawButton = document.getElementById('draw-button');
      if (drawButton) {
        if (ticketCount === 0) {
          drawButton.disabled = true;
          drawButton.textContent = 'チケットがありません';
        } else {
          drawButton.disabled = false;
          drawButton.textContent = 'くじを引く';
        }
      }
    } catch (error) {
      console.error('Failed to update ticket display:', error);
    }
  }

  /**
   * エラーを表示
   */
  showError(message) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
      <div class="error-screen">
        <h1>エラー</h1>
        <p>${message}</p>
        <button onclick="window.location.href='/'" class="btn btn-primary">
          ダッシュボードへ戻る
        </button>
      </div>
    `;
  }

  /**
   * 待機
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// グローバルインスタンス
const lotteryManager = new LotteryManager();
