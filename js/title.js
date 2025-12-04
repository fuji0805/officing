/**
 * Title System
 * 
 * 称号システムの実装
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 14.5
 */

class TitleManager {
  constructor() {
    this.titles = [];
    this.userTitles = [];
  }

  /**
   * Check if user meets title unlock conditions
   * Requirements: 6.1
   * 
   * @param {object} title - Title object with unlock conditions
   * @param {object} userStats - User statistics
   * @returns {boolean} True if conditions are met
   */
  checkUnlockCondition(title, userStats) {
    const conditionType = title.unlock_condition_type;
    const conditionValue = title.unlock_condition_value;

    switch (conditionType) {
      case 'streak':
        return userStats.currentStreak >= conditionValue.threshold;
      
      case 'attendance':
        return userStats.totalAttendance >= conditionValue.count;
      
      case 'level':
        return userStats.level >= conditionValue.level;
      
      case 'quest':
        return userStats.completedQuests >= conditionValue.count;
      
      case 'tag':
        const tagCount = userStats.tagCounts?.[conditionValue.tag] || 0;
        return tagCount >= conditionValue.count;
      
      default:
        console.warn('Unknown unlock condition type:', conditionType);
        return false;
    }
  }

  /**
   * Get all titles with unlock status for current user
   * Requirements: 6.2, 6.5
   */
  async getAllTitlesWithStatus() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get all titles
    const { data: allTitles, error: titlesError } = await client
      .from('titles')
      .select('*')
      .order('created_at', { ascending: true });

    if (titlesError) throw titlesError;

    // Get user's unlocked titles
    const { data: unlockedTitles, error: userTitlesError } = await client
      .from('user_titles')
      .select('title_id, unlocked_at')
      .eq('user_id', user.id);

    if (userTitlesError) throw userTitlesError;

    // Create a map of unlocked title IDs
    const unlockedMap = {};
    unlockedTitles.forEach(ut => {
      unlockedMap[ut.title_id] = ut.unlocked_at;
    });

    // Combine data
    return allTitles.map(title => ({
      ...title,
      isUnlocked: !!unlockedMap[title.id],
      unlockedAt: unlockedMap[title.id] || null
    }));
  }

  /**
   * Get user statistics for title unlock checking
   * Requirements: 6.1
   */
  async getUserStats() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get user progress
    const { data: progress, error: progressError } = await client
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      throw progressError;
    }

    // Get total attendance count
    const { data: attendances, error: attendanceError } = await client
      .from('attendances')
      .select('id, tag', { count: 'exact' })
      .eq('user_id', user.id);

    if (attendanceError) throw attendanceError;

    // Count attendances by tag
    const tagCounts = {};
    attendances.forEach(att => {
      tagCounts[att.tag] = (tagCounts[att.tag] || 0) + 1;
    });

    // Get completed quests count
    const { data: completedQuests, error: questError } = await client
      .from('user_quest_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);

    if (questError) throw questError;

    return {
      level: progress?.level || 1,
      currentStreak: progress?.current_streak || 0,
      maxStreak: progress?.max_streak || 0,
      totalAttendance: attendances?.length || 0,
      completedQuests: completedQuests?.length || 0,
      tagCounts
    };
  }

  /**
   * Unlock a title for the user
   * Requirements: 6.1, 6.2
   * 
   * @param {string} titleId - Title ID to unlock
   * @returns {object} Unlocked title data
   */
  async unlockTitle(titleId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already unlocked
    const { data: existing } = await client
      .from('user_titles')
      .select('id')
      .eq('user_id', user.id)
      .eq('title_id', titleId)
      .single();

    if (existing) {
      console.log('Title already unlocked');
      return null;
    }

    // Unlock the title
    const { data, error } = await client
      .from('user_titles')
      .insert({
        user_id: user.id,
        title_id: titleId
      })
      .select()
      .single();

    if (error) throw error;

    // Get the title details
    const { data: titleData } = await client
      .from('titles')
      .select('*')
      .eq('id', titleId)
      .single();

    return titleData;
  }

  /**
   * Set active title for user
   * Requirements: 6.3, 6.4
   * 
   * @param {string} titleId - Title ID to set as active (null to clear)
   */
  async setActiveTitle(titleId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Verify user has unlocked this title (if not null)
    if (titleId) {
      const { data: userTitle } = await client
        .from('user_titles')
        .select('id')
        .eq('user_id', user.id)
        .eq('title_id', titleId)
        .single();

      if (!userTitle) {
        throw new Error('Title not unlocked');
      }
    }

    // Update active title
    const { error } = await client
      .from('user_progress')
      .update({ active_title_id: titleId })
      .eq('user_id', user.id);

    if (error) throw error;

    return true;
  }

  /**
   * Get active title for user
   * Requirements: 6.4
   */
  async getActiveTitle() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: progress } = await client
      .from('user_progress')
      .select('active_title_id')
      .eq('user_id', user.id)
      .single();

    if (!progress?.active_title_id) {
      return null;
    }

    const { data: title } = await client
      .from('titles')
      .select('*')
      .eq('id', progress.active_title_id)
      .single();

    return title;
  }

  /**
   * Check and unlock eligible titles
   * Requirements: 6.1, 6.2
   * 
   * @returns {array} Array of newly unlocked titles
   */
  async checkAndUnlockTitles() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get user stats
    const userStats = await this.getUserStats();

    // Get all titles
    const { data: allTitles } = await client
      .from('titles')
      .select('*');

    // Get already unlocked titles
    const { data: unlockedTitles } = await client
      .from('user_titles')
      .select('title_id')
      .eq('user_id', user.id);

    const unlockedIds = new Set(unlockedTitles.map(ut => ut.title_id));

    // Check each title
    const newlyUnlocked = [];
    for (const title of allTitles) {
      // Skip if already unlocked
      if (unlockedIds.has(title.id)) continue;

      // Check if conditions are met
      if (this.checkUnlockCondition(title, userStats)) {
        try {
          const unlockedTitle = await this.unlockTitle(title.id);
          if (unlockedTitle) {
            newlyUnlocked.push(unlockedTitle);
          }
        } catch (error) {
          console.error('Failed to unlock title:', title.name, error);
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Format unlock condition for display
   * Requirements: 6.5
   */
  formatUnlockCondition(title) {
    const type = title.unlock_condition_type;
    const value = title.unlock_condition_value;

    switch (type) {
      case 'streak':
        return `${value.threshold}日連続出社`;
      
      case 'attendance':
        return `累計${value.count}回出社`;
      
      case 'level':
        return `レベル${value.level}到達`;
      
      case 'quest':
        return `${value.count}個のクエスト完了`;
      
      case 'tag':
        return `${value.tag}で${value.count}回チェックイン`;
      
      default:
        return '条件不明';
    }
  }

  /**
   * Show title collection screen
   * Requirements: 6.5
   */
  async showTitleCollectionScreen() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    try {
      // Get all titles with status
      const titles = await this.getAllTitlesWithStatus();

      // Get active title
      const activeTitle = await this.getActiveTitle();

      // Group titles by type
      const groupedTitles = {
        streak: [],
        attendance: [],
        level: [],
        quest: [],
        tag: []
      };

      titles.forEach(title => {
        const type = title.unlock_condition_type;
        if (groupedTitles[type]) {
          groupedTitles[type].push(title);
        }
      });

      // Count unlocked titles
      const unlockedCount = titles.filter(t => t.isUnlocked).length;
      const totalCount = titles.length;

      appDiv.innerHTML = `
        <div class="title-collection-screen">
          <div class="title-collection-container">
            <div class="title-collection-header">
              <h1 class="title-collection-title">👑 称号コレクション</h1>
              <div class="title-collection-stats">
                <span class="title-count">${unlockedCount} / ${totalCount}</span>
                <span class="title-count-label">獲得済み</span>
              </div>
            </div>

            ${activeTitle ? `
              <div class="active-title-display">
                <div class="active-title-label">現在の称号</div>
                <div class="active-title-name">👑 ${activeTitle.name}</div>
                <div class="active-title-description">${activeTitle.description || ''}</div>
              </div>
            ` : `
              <div class="active-title-display no-active-title">
                <div class="active-title-label">称号が設定されていません</div>
                <div class="active-title-hint">獲得した称号をタップして設定できます</div>
              </div>
            `}

            <div class="title-groups">
              ${this.renderTitleGroup('🔥 連続出社', groupedTitles.streak, activeTitle?.id)}
              ${this.renderTitleGroup('📅 累計出社', groupedTitles.attendance, activeTitle?.id)}
              ${this.renderTitleGroup('⭐ レベル', groupedTitles.level, activeTitle?.id)}
              ${this.renderTitleGroup('✅ クエスト', groupedTitles.quest, activeTitle?.id)}
              ${this.renderTitleGroup('📍 場所', groupedTitles.tag, activeTitle?.id)}
            </div>

            <div class="title-collection-actions">
              <button onclick="titleManager.goToDashboard()" class="btn btn-secondary btn-full">
                ダッシュボードへ戻る
              </button>
            </div>
          </div>
        </div>
      `;

      // Add event listeners for title selection
      this.setupTitleEventListeners();
      
      // 背景色を設定
      if (typeof setScreenBackground !== 'undefined') {
        setScreenBackground('linear-gradient(135deg, #F59E0B 0%, #D97706 100%)');
      }
      
      // ナビゲーションバーをマウント
      await mountNavigation('/titles');
    } catch (error) {
      console.error('Failed to show title collection:', error);
      this.showError('称号コレクションの表示に失敗しました: ' + error.message);
    }
  }

  /**
   * Render a group of titles
   * Requirements: 6.5
   */
  renderTitleGroup(groupName, titles, activeTitleId) {
    if (titles.length === 0) return '';

    return `
      <div class="title-group">
        <h3 class="title-group-name">${groupName}</h3>
        <div class="title-list">
          ${titles.map(title => this.renderTitleCard(title, activeTitleId)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render a single title card
   * Requirements: 6.5
   */
  renderTitleCard(title, activeTitleId) {
    const isActive = title.id === activeTitleId;
    const isUnlocked = title.isUnlocked;
    const condition = this.formatUnlockCondition(title);

    return `
      <div class="title-card ${isUnlocked ? 'title-unlocked' : 'title-locked'} ${isActive ? 'title-active' : ''}"
           data-title-id="${title.id}"
           ${isUnlocked ? `onclick="titleManager.handleTitleClick('${title.id}')"` : ''}>
        <div class="title-card-header">
          <div class="title-card-name">${isUnlocked ? '👑' : '🔒'} ${title.name}</div>
          ${isActive ? '<div class="title-active-badge">装備中</div>' : ''}
        </div>
        <div class="title-card-description">${title.description || ''}</div>
        <div class="title-card-condition">
          ${isUnlocked ? 
            `<span class="title-unlocked-date">獲得: ${this.formatDate(title.unlockedAt)}</span>` :
            `<span class="title-condition">条件: ${condition}</span>`
          }
        </div>
      </div>
    `;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * Setup event listeners for title selection
   * Requirements: 6.3
   */
  setupTitleEventListeners() {
    // Event listeners are set via onclick in the HTML
  }

  /**
   * Handle title card click
   * Requirements: 6.3, 6.4
   */
  async handleTitleClick(titleId) {
    try {
      // Get current active title
      const activeTitle = await this.getActiveTitle();

      // If clicking the active title, deactivate it
      if (activeTitle && activeTitle.id === titleId) {
        const confirmed = confirm('この称号を外しますか？');
        if (confirmed) {
          await this.setActiveTitle(null);
          this.showTitleCollectionScreen(); // Refresh
        }
      } else {
        // Set as active title
        const confirmed = confirm('この称号を装備しますか？');
        if (confirmed) {
          await this.setActiveTitle(titleId);
          this.showTitleCollectionScreen(); // Refresh
        }
      }
    } catch (error) {
      console.error('Failed to update active title:', error);
      alert('称号の設定に失敗しました: ' + error.message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
      <div class="error-screen">
        <h1>エラー</h1>
        <p>${message}</p>
        <button onclick="titleManager.goToDashboard()" class="btn btn-primary">
          ダッシュボードへ戻る
        </button>
      </div>
    `;
  }

  /**
   * ダッシュボードへ戻る
   */
  goToDashboard() {
    // URLを更新
    history.pushState({ page: 'dashboard' }, 'Dashboard', '/');
    
    if (typeof dashboardManager !== 'undefined') {
      dashboardManager.showDashboard();
    } else {
      goToDashboard();
    }
  }
}

// Global instance
const titleManager = new TitleManager();
