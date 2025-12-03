/**
 * Quest System
 * 
 * クエストシステムの実装
 * Requirements: 7.1, 7.4, 7.5
 */

class QuestManager {
  constructor() {
    this.isProcessing = false;
    this.rankMultipliers = {
      'S': 3.0,
      'A': 2.0,
      'B': 1.5,
      'C': 1.0
    };
  }

  /**
   * クエスト画面を表示
   * Requirements: 7.5
   */
  async showQuestScreen() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    try {
      // ユーザーの進捗データを取得
      const userData = await this.getUserProgress();
      
      if (!userData) {
        this.showError('ユーザーデータの取得に失敗しました');
        return;
      }

      // 今日のクエストを取得
      const quests = await this.getDailyQuests(userData.user_id);

      appDiv.innerHTML = `
        <div class="quest-screen">
          <div class="quest-container">
            <div class="quest-header">
              <h1 class="quest-title">📋 デイリークエスト</h1>
              <p class="quest-subtitle">クエストを完了して報酬を獲得しよう！</p>
            </div>
            
            <div class="quest-card">
              ${quests.length === 0 ? `
                <div class="quest-empty">
                  <p>今日のクエストはまだ生成されていません</p>
                  <button onclick="questManager.generateDailyQuests()" class="btn btn-primary">
                    クエストを生成
                  </button>
                </div>
              ` : `
                <div class="quest-list" id="quest-list">
                  ${this.renderQuestList(quests)}
                </div>
              `}
              
              <!-- ナビゲーション -->
              <div class="quest-actions">
                <button onclick="window.location.href='/'" class="btn btn-secondary btn-full">
                  ダッシュボードへ戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to show quest screen:', error);
      this.showError('クエスト画面の表示に失敗しました');
    }
  }

  /**
   * クエスト一覧をレンダリング
   * Requirements: 7.5
   */
  renderQuestList(quests) {
    return quests.map(quest => {
      const isCompleted = !!quest.completed_at;
      const rankClass = `rank-${quest.rank.toLowerCase()}`;
      
      // 報酬を計算
      const xpReward = Math.floor(quest.base_xp * this.rankMultipliers[quest.rank]);
      const pointsReward = Math.floor(quest.base_points * this.rankMultipliers[quest.rank]);

      return `
        <div class="quest-item ${isCompleted ? 'quest-completed' : ''}" data-quest-id="${quest.quest_id}">
          <div class="quest-item-header">
            <div class="quest-rank-badge ${rankClass}">${quest.rank}</div>
            <div class="quest-item-title">${quest.title}</div>
            ${isCompleted ? '<div class="quest-check">✓</div>' : ''}
          </div>
          
          <div class="quest-item-description">
            ${quest.description || ''}
          </div>
          
          <div class="quest-item-rewards">
            <span class="quest-reward">⭐ ${xpReward} XP</span>
            <span class="quest-reward">💰 ${pointsReward} ポイント</span>
          </div>
          
          ${!isCompleted ? `
            <button 
              onclick="questManager.completeQuest('${quest.log_id}')" 
              class="btn btn-primary btn-sm quest-complete-btn"
            >
              完了する
            </button>
          ` : `
            <div class="quest-completed-label">完了済み</div>
          `}
        </div>
      `;
    }).join('');
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
   * 今日のデイリークエストを取得
   * Requirements: 7.5
   */
  async getDailyQuests(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const today = this.getTodayDate();

    // 今日割り当てられたクエストを取得
    const { data, error } = await client
      .from('user_quest_logs')
      .select(`
        id,
        quest_id,
        assigned_date,
        completed_at,
        xp_earned,
        points_earned,
        quests (
          id,
          title,
          description,
          rank,
          base_xp,
          base_points
        )
      `)
      .eq('user_id', userId)
      .eq('assigned_date', today)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // データを整形
    return (data || []).map(log => ({
      log_id: log.id,
      quest_id: log.quest_id,
      assigned_date: log.assigned_date,
      completed_at: log.completed_at,
      xp_earned: log.xp_earned,
      points_earned: log.points_earned,
      title: log.quests.title,
      description: log.quests.description,
      rank: log.quests.rank,
      base_xp: log.quests.base_xp,
      base_points: log.quests.base_points
    }));
  }

  /**
   * デイリークエストを生成
   * Requirements: 7.1
   */
  async generateDailyQuests() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client not initialized');

      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const today = this.getTodayDate();

      // 既存のクエストをチェック
      const existing = await this.getDailyQuests(user.id);
      if (existing.length > 0) {
        console.log('Daily quests already exist for today');
        await this.showQuestScreen();
        return;
      }

      // デイリークエストプールから3つランダムに選択
      const { data: questPool, error: questError } = await client
        .from('quests')
        .select('*')
        .eq('quest_type', 'daily')
        .eq('is_active', true);

      if (questError) throw questError;

      if (!questPool || questPool.length < 3) {
        throw new Error('Not enough daily quests in the pool');
      }

      // ランダムに3つ選択
      const selectedQuests = this.selectRandomQuests(questPool, 3);

      // クエストログに追加
      const questLogs = selectedQuests.map(quest => ({
        user_id: user.id,
        quest_id: quest.id,
        assigned_date: today,
        completed_at: null,
        xp_earned: null,
        points_earned: null
      }));

      const { error: insertError } = await client
        .from('user_quest_logs')
        .insert(questLogs);

      if (insertError) throw insertError;

      console.log('✅ Daily quests generated');
      
      // 画面を再読み込み
      await this.showQuestScreen();

    } catch (error) {
      console.error('Failed to generate daily quests:', error);
      this.showError('クエストの生成に失敗しました: ' + error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * ランダムにクエストを選択
   */
  selectRandomQuests(quests, count) {
    const shuffled = [...quests].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * クエストを完了
   * Requirements: 7.2, 7.3
   */
  async completeQuest(logId) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      // クエスト完了ボタンを無効化
      const button = event.target;
      if (button) {
        button.disabled = true;
        button.textContent = '処理中...';
      }

      // リトライロジックでクエスト完了を実行
      const data = await errorHandler.retryWithBackoff(
        async () => {
          const client = getSupabaseClient();
          if (!client) throw new Error('Supabase client not initialized');

          // セッションの有効性を確認
          console.log('Checking session validity...');
          const session = await getCurrentSession();
          console.log('Current session:', session ? 'Valid' : 'Invalid');
          
          if (!session || !session.access_token) {
            throw new Error('Session expired. Please log in again.');
          }

          // クライアントのセッションを明示的に設定
          await client.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });

          console.log('Invoking quest-complete function with logId:', logId);
          console.log('Session access token:', session.access_token ? 'Present' : 'Missing');
          
          const { data, error } = await client.functions.invoke('quest-complete', {
            body: { questLogId: logId }
          });

          console.log('Function response:', { data, error });

          if (error) {
            console.error('Edge Function error details:', error);
            // エラーレスポンスの詳細を取得
            if (error.context) {
              console.error('Error context:', error.context);
            }
            throw error;
          }

          if (!data.success) {
            throw new Error(data.error || 'Quest completion failed');
          }

          return data;
        },
        {
          maxRetries: 3,
          context: { operation: 'quest-complete', logId },
          onRetry: (attempt, maxRetries) => {
            console.log(`Retrying quest completion (${attempt}/${maxRetries})...`);
          }
        }
      );

      console.log('✅ Quest completed');

      // 報酬表示
      this.showRewardAnimation({
        xp: data.rewards.xpEarned,
        points: data.rewards.pointsEarned,
        levelUp: data.rewards.leveledUp,
        newLevel: data.rewards.level
      });

      // 新しい称号があれば表示
      if (data.newTitles && data.newTitles.length > 0) {
        setTimeout(() => {
          this.showTitleUnlockAnimation(data.newTitles);
        }, 2000);
      }

      // 画面を再読み込み
      setTimeout(() => {
        this.showQuestScreen();
      }, data.newTitles && data.newTitles.length > 0 ? 4000 : 2000);

    } catch (error) {
      console.error('Failed to complete quest:', error);
      
      const errorInfo = errorHandler.handleError(error, {
        operation: 'quest-complete',
        logId
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
                window.location.href = '/auth';
              }
            }
          ]
        });
      } else {
        errorHandler.showError(errorInfo.message, {
          title: 'クエスト完了エラー',
          type: 'error',
          actions: [
            {
              id: 'retry',
              label: '再試行',
              handler: () => {
                this.completeQuest(logId);
              }
            }
          ]
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * レベルに必要なXPを計算（指数関数的）
   * Requirements: 8.3
   */
  calculateXPForLevel(level) {
    // 基本: 100 * (level ^ 1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * 報酬アニメーションを表示
   */
  showRewardAnimation(rewards) {
    const overlay = document.createElement('div');
    overlay.className = 'reward-overlay';
    overlay.innerHTML = `
      <div class="reward-content">
        <div class="reward-icon">🎉</div>
        <div class="reward-title">クエスト完了！</div>
        <div class="reward-items">
          <div class="reward-item">⭐ +${rewards.xp} XP</div>
          <div class="reward-item">💰 +${rewards.points} ポイント</div>
          ${rewards.levelUp ? `
            <div class="reward-levelup">
              🎊 レベルアップ！ Lv.${rewards.newLevel}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);

    // 2秒後に自動で閉じる
    setTimeout(() => {
      overlay.remove();
    }, 2000);
  }

  /**
   * 称号アンロックアニメーションを表示
   */
  showTitleUnlockAnimation(titles) {
    const overlay = document.createElement('div');
    overlay.className = 'reward-overlay';
    overlay.innerHTML = `
      <div class="reward-content">
        <div class="reward-icon">👑</div>
        <div class="reward-title">称号獲得！</div>
        <div class="reward-items">
          ${titles.map(title => `
            <div class="reward-item title-unlock">
              ${title.name}
            </div>
            <div class="reward-description">
              ${title.description}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);

    // 2秒後に自動で閉じる
    setTimeout(() => {
      overlay.remove();
    }, 2000);
  }

  /**
   * デイリークエストをリセット
   * Requirements: 7.4
   * 
   * Note: この関数は通常、サーバー側のcronジョブで実行されるべきですが、
   * 簡易実装として手動リセット機能を提供します
   */
  async resetDailyQuests() {
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client not initialized');

      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const today = this.getTodayDate();

      // 今日より前の未完了デイリークエストを削除
      const { error } = await client
        .from('user_quest_logs')
        .delete()
        .eq('user_id', user.id)
        .lt('assigned_date', today)
        .is('completed_at', null);

      if (error) throw error;

      console.log('✅ Daily quests reset');

    } catch (error) {
      console.error('Failed to reset daily quests:', error);
      throw error;
    }
  }

  /**
   * 今日の日付を取得（YYYY-MM-DD形式）
   */
  getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
}

// グローバルインスタンス
const questManager = new QuestManager();
