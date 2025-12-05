/**
 * Level and XP System
 * 
 * レベル・XPシステムの実装
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

class LevelManager {
  constructor() {
    // XP calculation constants
    this.BASE_XP = 100;
    this.EXPONENT = 1.5;
  }

  /**
   * Calculate XP required for a given level (exponential growth)
   * Requirements: 8.3
   * 
   * Formula: 100 * (level ^ 1.5)
   * 
   * @param {number} level - Target level
   * @returns {number} XP required to reach that level
   */
  calculateXPForLevel(level) {
    return Math.floor(this.BASE_XP * Math.pow(level, this.EXPONENT));
  }

  /**
   * Calculate level from total XP
   * Requirements: 8.2
   * 
   * @param {number} totalXP - Total accumulated XP
   * @returns {object} { level, currentXP, xpForNextLevel }
   */
  calculateLevelFromXP(totalXP) {
    let level = 1;
    let remainingXP = totalXP;
    
    while (true) {
      const xpForNextLevel = this.calculateXPForLevel(level + 1);
      
      if (remainingXP < xpForNextLevel) {
        return {
          level,
          currentXP: remainingXP,
          xpForNextLevel
        };
      }
      
      remainingXP -= xpForNextLevel;
      level++;
    }
  }

  /**
   * Process XP gain and check for level up
   * Requirements: 8.1, 8.2
   * 
   * @param {number} currentLevel - Current user level
   * @param {number} currentXP - Current XP in current level
   * @param {number} xpGained - XP to add
   * @returns {object} { newLevel, newXP, leveledUp, levelsGained }
   */
  processXPGain(currentLevel, currentXP, xpGained) {
    let level = currentLevel;
    let xp = currentXP + xpGained;
    let leveledUp = false;
    let levelsGained = 0;

    // Check for level up(s)
    while (true) {
      const xpForNextLevel = this.calculateXPForLevel(level + 1);
      
      if (xp < xpForNextLevel) {
        break;
      }
      
      xp -= xpForNextLevel;
      level++;
      leveledUp = true;
      levelsGained++;
    }

    return {
      newLevel: level,
      newXP: xp,
      xpForNextLevel: this.calculateXPForLevel(level + 1),
      leveledUp,
      levelsGained
    };
  }

  /**
   * Get level milestone titles
   * Requirements: 8.4
   * 
   * @param {number} level - User level
   * @returns {array} Array of milestone levels that unlock titles
   */
  getLevelMilestones() {
    return [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  }

  /**
   * Check if level is a milestone
   * Requirements: 8.4
   * 
   * @param {number} level - Level to check
   * @returns {boolean} True if level is a milestone
   */
  isMilestoneLevel(level) {
    return this.getLevelMilestones().includes(level);
  }

  /**
   * Calculate progress percentage to next level
   * Requirements: 8.5
   * 
   * @param {number} currentXP - Current XP in level
   * @param {number} xpForNextLevel - XP required for next level
   * @returns {number} Percentage (0-100)
   */
  calculateLevelProgress(currentXP, xpForNextLevel) {
    if (xpForNextLevel === 0) return 100;
    return Math.min(100, Math.floor((currentXP / xpForNextLevel) * 100));
  }

  /**
   * Format XP display
   * Requirements: 8.5
   * 
   * @param {number} xp - XP value
   * @returns {string} Formatted XP string
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
   * Get user progress data
   * Requirements: 8.5
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

    if (error) {
      if (error.code === 'PGRST116') {
        // User progress doesn't exist, create it
        return await this.createUserProgress(user.id);
      }
      throw error;
    }

    return data;
  }

  /**
   * Create initial user progress
   */
  async createUserProgress(userId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
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

    if (error) throw error;
    return data;
  }

  /**
   * Show profile screen
   * Requirements: 8.5
   */
  async showProfileScreen() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    try {
      // Get user progress
      const progress = await this.getUserProgress();
      
      // Calculate XP for next level
      const xpForNextLevel = this.calculateXPForLevel(progress.level + 1);
      const progressPercent = this.calculateLevelProgress(progress.current_xp, xpForNextLevel);

      // Get active title
      let activeTitle = null;
      if (progress.active_title_id) {
        const client = getSupabaseClient();
        const { data: titleData } = await client
          .from('titles')
          .select('*')
          .eq('id', progress.active_title_id)
          .single();
        
        activeTitle = titleData;
      }

      // Get unlocked titles count
      const client = getSupabaseClient();
      const user = await getCurrentUser();
      const { data: unlockedTitles } = await client
        .from('user_titles')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      const unlockedCount = unlockedTitles?.length || 0;

      // Get total attendance count
      const { data: attendances } = await client
        .from('attendances')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      const totalAttendance = attendances?.length || 0;

      // Get completed quests count
      const { data: completedQuests } = await client
        .from('user_quest_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      const completedQuestsCount = completedQuests?.length || 0;

      appDiv.innerHTML = `
        <div class="profile-screen">
          <div class="profile-container">
            <div class="profile-header">
              <h1 class="profile-title">👤 プロフィール</h1>
            </div>
            
            <div class="profile-card">
              <!-- Level Display -->
              <div class="profile-level-section">
                <div class="profile-level-badge">
                  <div class="profile-level-number">Lv.${progress.level}</div>
                  ${activeTitle ? `<div class="profile-active-title">👑 ${activeTitle.name}</div>` : ''}
                </div>
                
                <!-- XP Progress Bar -->
                <div class="profile-xp-container">
                  <div class="profile-xp-label">
                    <span>経験値</span>
                    <span>${this.formatXP(progress.current_xp)} / ${this.formatXP(xpForNextLevel)}</span>
                  </div>
                  <div class="profile-xp-bar">
                    <div class="profile-xp-fill" style="width: ${progressPercent}%"></div>
                  </div>
                  <div class="profile-xp-percent">${progressPercent}%</div>
                </div>
              </div>
              
              <!-- Stats Grid -->
              <div class="profile-stats-grid">
                <div class="profile-stat-card">
                  <div class="profile-stat-icon">💰</div>
                  <div class="profile-stat-value">${progress.total_points}</div>
                  <div class="profile-stat-label">ポイント</div>
                </div>
                
                <div class="profile-stat-card">
                  <div class="profile-stat-icon">🔥</div>
                  <div class="profile-stat-value">${progress.current_streak}</div>
                  <div class="profile-stat-label">連続出社</div>
                </div>
                
                <div class="profile-stat-card">
                  <div class="profile-stat-icon">📅</div>
                  <div class="profile-stat-value">${totalAttendance}</div>
                  <div class="profile-stat-label">総出社数</div>
                </div>
                
                <div class="profile-stat-card">
                  <div class="profile-stat-icon">✅</div>
                  <div class="profile-stat-value">${completedQuestsCount}</div>
                  <div class="profile-stat-label">クエスト完了</div>
                </div>
                
                <div class="profile-stat-card">
                  <div class="profile-stat-icon">👑</div>
                  <div class="profile-stat-value">${unlockedCount}</div>
                  <div class="profile-stat-label">称号獲得</div>
                </div>
                
                <div class="profile-stat-card">
                  <div class="profile-stat-icon">🏆</div>
                  <div class="profile-stat-value">${progress.max_streak}</div>
                  <div class="profile-stat-label">最高連続</div>
                </div>
              </div>
              
              <!-- Level Milestones -->
              <div class="profile-milestones">
                <h3 class="profile-section-title">レベルマイルストーン</h3>
                <div class="profile-milestone-list">
                  ${this.renderMilestones(progress.level)}
                </div>
              </div>
              
              <!-- Actions -->
              <div class="profile-actions">
                <button onclick="window.location.href='/titles-demo.html'" class="btn btn-primary btn-full">
                  👑 称号コレクションを見る
                </button>
                <button onclick="window.location.href='/officing/'" class="btn btn-secondary btn-full">
                  ダッシュボードへ戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to show profile screen:', error);
      this.showError('プロフィール画面の表示に失敗しました: ' + error.message);
    }
  }

  /**
   * Render level milestones
   * Requirements: 8.4
   */
  renderMilestones(currentLevel) {
    const milestones = this.getLevelMilestones();
    
    return milestones.map(milestone => {
      const achieved = currentLevel >= milestone;
      const xpRequired = this.calculateXPForLevel(milestone);
      
      return `
        <div class="profile-milestone ${achieved ? 'milestone-achieved' : ''}">
          <div class="milestone-level">Lv.${milestone}</div>
          <div class="milestone-info">
            <div class="milestone-xp">${this.formatXP(xpRequired)} XP必要</div>
            ${achieved ? '<div class="milestone-check">✓</div>' : ''}
          </div>
        </div>
      `;
    }).join('');
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
        <button onclick="window.location.href='/officing/'" class="btn btn-primary">
          ダッシュボードへ戻る
        </button>
      </div>
    `;
  }
}

// Global instance
const levelManager = new LevelManager();
