/**
 * Dashboard Module
 * 
 * ダッシュボード（ホーム画面）の実装
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

class DashboardManager {
  constructor() {
    this.isLoading = false;
  }

  /**
   * ダッシュボード画面を表示
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
   */
  async showDashboard() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    // 既に読み込み中の場合は何もしない
    if (this.isLoading) {
      console.log('Dashboard already loading, skipping...');
      return;
    }
    
    console.log('Starting dashboard load...');
    this.isLoading = true;

    // URLを更新（まだ更新されていない場合のみ）
    if (window.location.pathname !== '/') {
      history.pushState({ page: 'dashboard' }, 'Dashboard', '/');
    }

    // ローディング画面を表示
    appDiv.innerHTML = `
      <div class="loading-screen">
        <div class="spinner"></div>
        <p>読み込み中...</p>
      </div>
    `;

    try {
      // 認証チェック
      const user = await getCurrentUser();
      if (!user) {
        this.isLoading = false;
        window.location.href = './login.html?returnUrl=' + encodeURIComponent(window.location.href);
        return;
      }

      // 必要なデータを並行取得
      const [
        progress,
        todayCheckin,
        ticketCount,
        activeTitle,
        todayQuests,
        monthlyCount
      ] = await Promise.all([
        this.getUserProgress(user.id),
        this.getTodayCheckinStatus(user.id),
        this.getTicketCount(user.id),
        this.getActiveTitle(user.id),
        this.getTodayQuests(user.id),
        this.getMonthlyCheckinCount(user.id)
      ]);

      // XP計算
      const xpForNextLevel = this.calculateXPForLevel(progress.level + 1);
      const progressPercent = this.calculateLevelProgress(progress.current_xp, xpForNextLevel);

      // ダッシュボードをレンダリング
      appDiv.innerHTML = this.renderDashboard({
        progress,
        todayCheckin,
        ticketCount,
        activeTitle,
        todayQuests,
        xpForNextLevel,
        progressPercent,
        monthlyCount
      });

      // ナビゲーションバーにポイントを表示
      if (typeof navigationManager !== 'undefined') {
        navigationManager.mount('/', progress.total_points);
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      this.showError('ダッシュボードの読み込みに失敗しました: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * ダッシュボードHTMLをレンダリング
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
   */
  renderDashboard(data) {
    const { progress, todayCheckin, ticketCount, activeTitle, todayQuests, xpForNextLevel, progressPercent, monthlyCount } = data;

    return `
      <div class="dashboard-screen">
        <div class="dashboard-container">
          <div class="dashboard-header">
            <h1 class="dashboard-title">🏠 ダッシュボード</h1>
            <p class="dashboard-subtitle">おかえりなさい！</p>
          </div>
          
          <!-- 今日のチェックイン状況 -->
          ${this.renderCheckinStatus(todayCheckin)}
          
          <!-- ユーザー情報カード -->
          <div class="dashboard-card">
            <!-- レベルとアクティブ称号 -->
            ${this.renderLevelDisplay(progress, activeTitle, xpForNextLevel, progressPercent)}
            
            <!-- クイック統計 -->
            ${this.renderQuickStats(progress, ticketCount, monthlyCount)}
            
            <!-- 今日のクエスト -->
            ${this.renderTodayQuests(todayQuests)}
            
            <!-- ナビゲーション -->
            ${this.renderNavigation()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 今日のチェックイン状況を表示
   * Requirements: 13.1
   */
  renderCheckinStatus(todayCheckin) {
    if (todayCheckin) {
      // チェックイン済み
      const time = this.formatTime(new Date(todayCheckin.check_in_time));
      return `
        <div class="dashboard-checkin-status checkin-done">
          <div class="checkin-status-icon">✅</div>
          <div class="checkin-status-content">
            <div class="checkin-status-title">本日チェックイン済み</div>
            <div class="checkin-status-detail">
              ${time} に ${todayCheckin.tag} でチェックイン
            </div>
          </div>
        </div>
      `;
    } else {
      // 未チェックイン
      return `
        <div class="dashboard-checkin-status checkin-pending">
          <div class="checkin-status-icon">📱</div>
          <div class="checkin-status-content">
            <div class="checkin-status-title">今日はまだチェックインしていません</div>
            <div class="checkin-status-detail">
              QRコードをスキャンしてチェックインしましょう！
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * レベルとアクティブ称号を表示
   * Requirements: 13.4
   */
  renderLevelDisplay(progress, activeTitle, xpForNextLevel, progressPercent) {
    return `
      <div class="level-display">
        <div class="level-info">
          <div class="level-number">Lv.${progress.level}</div>
          ${activeTitle ? 
            `<div class="level-title">👑 ${activeTitle.name}</div>` : 
            `<div class="level-title">レベル ${progress.level}</div>`
          }
        </div>
        <div class="level-progress">
          <div class="xp-bar-container">
            <div class="xp-bar-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="xp-text">
            ${this.formatXP(progress.current_xp)} / ${this.formatXP(xpForNextLevel)} XP (${progressPercent}%)
          </div>
        </div>
      </div>
    `;
  }

  /**
   * クイック統計を表示
   * Requirements: 13.2, 13.3
   */
  renderQuickStats(progress, ticketCount, monthlyCount) {
    return `
      <div class="quick-stats">
        <div class="stat-box">
          <span class="stat-value">📅 ${monthlyCount}</span>
          <span class="stat-label">今月の出社</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">🔥 ${progress.current_streak}</span>
          <span class="stat-label">連続出社</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">🎫 ${ticketCount}</span>
          <span class="stat-label">くじチケット</span>
        </div>
      </div>
    `;
  }

  /**
   * 今日のクエストを表示
   * Requirements: 13.5
   */
  renderTodayQuests(quests) {
    if (!quests || quests.length === 0) {
      return `
        <div class="dashboard-quests">
          <h3 class="dashboard-section-title">📋 今日のクエスト</h3>
          <div class="quest-empty">
            <p>今日のクエストはまだ生成されていません</p>
            <button onclick="dashboardManager.generateQuestsFromDashboard()" class="btn btn-sm btn-primary">
              クエストを生成
            </button>
          </div>
        </div>
      `;
    }

    // 最大3件まで表示
    const displayQuests = quests.slice(0, 3);

    return `
      <div class="dashboard-quests">
        <h3 class="dashboard-section-title">📋 今日のクエスト</h3>
        <div class="dashboard-quest-list">
          ${displayQuests.map(quest => this.renderQuestItem(quest)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * クエストアイテムをレンダリング
   * Requirements: 13.5
   */
  renderQuestItem(quest) {
    const isCompleted = !!quest.completed_at;
    const rankClass = `rank-${quest.rank.toLowerCase()}`;
    
    return `
      <div class="dashboard-quest-item ${isCompleted ? 'quest-completed' : ''}">
        <div class="quest-item-header">
          <span class="quest-rank-badge ${rankClass}">${quest.rank}</span>
          <span class="quest-item-title">${quest.title}</span>
          ${isCompleted ? '<span class="quest-check">✓</span>' : ''}
        </div>
        <div class="quest-item-description">${quest.description}</div>
        <div class="quest-item-rewards">
          <span class="quest-reward">⭐ ${quest.base_xp * (this.getRankMultiplier(quest.rank))} XP</span>
          <span class="quest-reward">💎 ${quest.base_points * (this.getRankMultiplier(quest.rank))} ポイント</span>
        </div>
        ${!isCompleted ? `
          <button onclick="dashboardManager.completeQuestFromDashboard('${quest.id}')" class="btn btn-sm btn-primary btn-full">
            完了する
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * ランク倍率を取得
   */
  getRankMultiplier(rank) {
    const multipliers = { S: 3.0, A: 2.0, B: 1.5, C: 1.0 };
    return multipliers[rank] || 1.0;
  }

  /**
   * ダッシュボードからクエストを完了
   */
  async completeQuestFromDashboard(questId) {
    try {
      if (typeof questManager !== 'undefined') {
        await questManager.completeQuest(questId);
        // ダッシュボードをリロード
        this.isLoading = false; // リロードを許可
        await this.showDashboard();
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
      alert('クエストの完了に失敗しました: ' + error.message);
    }
  }

  /**
   * ダッシュボードからクエストを生成
   */
  async generateQuestsFromDashboard() {
    try {
      if (typeof questManager !== 'undefined') {
        await questManager.generateDailyQuests();
        // ダッシュボードをリロード
        this.isLoading = false; // リロードを許可
        await this.showDashboard();
      }
    } catch (error) {
      console.error('Failed to generate quests:', error);
      alert('クエストの生成に失敗しました: ' + error.message);
    }
  }

  /**
   * ナビゲーションボタンを表示
   */
  renderNavigation() {
    return `
      <div class="nav-buttons">
        <a href="#" onclick="event.preventDefault(); questManager.showQuestScreen();" class="nav-btn">
          📋 クエスト
        </a>
        <a href="#" onclick="event.preventDefault(); lotteryManager.showLotteryScreen();" class="nav-btn">
          🎰 くじ
        </a>
        <a href="#" onclick="event.preventDefault(); titleManager.showTitleCollectionScreen();" class="nav-btn">
          👑 称号
        </a>
        <a href="#" onclick="event.preventDefault(); shopManager.showShopScreen();" class="nav-btn">
          🛒 ショップ
        </a>
        <a href="#" onclick="event.preventDefault(); stampManager.showStampCollectionScreen();" class="nav-btn">
          📅 スタンプ帳
        </a>
        <a href="#" onclick="event.preventDefault(); dashboardManager.showDashboard();" class="nav-btn">
          🏠 ホーム
        </a>
      </div>
    `;
  }

  /**
   * ユーザー進捗データを取得
   */
  async getUserProgress(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    
    // データが存在しない場合は初期値を作成
    if (!data) {
      const { data: newProgress, error: insertError } = await client
        .from('user_progress')
        .insert({
          user_id: userId,
          level: 1,
          current_xp: 0,
          total_points: 0,
          current_streak: 0,
          max_streak: 0,
          pity_counter: 0
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return newProgress;
    }
    
    return data;
  }

  /**
   * 今日のチェックイン状況を取得
   * Requirements: 13.1
   */
  async getTodayCheckinStatus(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const today = this.getTodayDate();

    const { data, error } = await client
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * チケット数を取得
   * Requirements: 13.3
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
      // レコードが存在しない場合は0を返す
      if (error.code === 'PGRST116') {
        return 0;
      }
      throw error;
    }

    return data?.ticket_count || 0;
  }

  /**
   * アクティブ称号を取得
   * Requirements: 13.4
   */
  async getActiveTitle(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    // user_progressからactive_title_idを取得
    const { data: progressData, error: progressError } = await client
      .from('user_progress')
      .select('active_title_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (progressError) throw progressError;

    if (!progressData || !progressData.active_title_id) {
      return null;
    }

    // 称号の詳細を取得
    const { data: titleData, error: titleError } = await client
      .from('titles')
      .select('*')
      .eq('id', progressData.active_title_id)
      .single();

    if (titleError) throw titleError;
    return titleData;
  }

  /**
   * 今日のクエストを取得
   * Requirements: 13.5
   */
  async getTodayQuests(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const today = this.getTodayDate();

    const { data, error } = await client
      .from('user_quest_logs')
      .select(`
        id,
        quest_id,
        assigned_date,
        completed_at,
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
      id: log.id,
      log_id: log.id,
      quest_id: log.quest_id,
      completed_at: log.completed_at,
      title: log.quests.title,
      description: log.quests.description,
      rank: log.quests.rank,
      base_xp: log.quests.base_xp,
      base_points: log.quests.base_points
    }));
  }

  /**
   * 月間カウントを取得（今月の出社回数）
   * Requirements: 13.2
   */
  async getMonthlyCheckinCount(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data, error, count } = await client
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month);

    if (error) throw error;
    return count || 0;
  }

  /**
   * レベルに必要なXPを計算
   */
  calculateXPForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * レベル進捗率を計算
   */
  calculateLevelProgress(currentXP, xpForNextLevel) {
    if (xpForNextLevel === 0) return 100;
    const percent = Math.floor((currentXP / xpForNextLevel) * 100);
    return Math.min(percent, 100);
  }

  /**
   * XPをフォーマット
   */
  formatXP(xp) {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + 'M';
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + 'K';
    }
    return xp.toString();
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
        <button onclick="window.location.reload()" class="btn btn-primary">
          再読み込み
        </button>
      </div>
    `;
  }
}

// グローバルインスタンス
const dashboardManager = new DashboardManager();
