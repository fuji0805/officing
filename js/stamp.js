/**
 * Stamp Collection Module
 * 
 * スタンプ帳機能の実装
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

class StampManager {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth() + 1; // 1-12
    this.stamps = [];
  }

  /**
   * スタンプ帳画面を表示
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   */
  async showStampCollectionScreen() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      authManager.showAuthScreen({ returnUrl: window.location.href });
      return;
    }

    // 現在の月のスタンプデータを取得
    await this.loadStamps(this.currentYear, this.currentMonth);

    appDiv.innerHTML = `
      <div class="stamp-collection-screen">
        <div class="stamp-collection-container">
          <div class="stamp-collection-header">
            <h1 class="stamp-collection-title">📅 スタンプ帳</h1>
          </div>
          
          <div class="stamp-collection-card">
            <!-- Month Navigation -->
            <div class="stamp-month-nav">
              <button class="btn-month-nav" id="prev-month" onclick="stampManager.navigateMonth(-1)">
                ◀ 前月
              </button>
              <div class="stamp-current-month" id="current-month-display">
                ${this.currentYear}年 ${this.currentMonth}月
              </div>
              <button class="btn-month-nav" id="next-month" onclick="stampManager.navigateMonth(1)">
                次月 ▶
              </button>
            </div>
            
            <!-- Calendar View -->
            <div class="stamp-calendar" id="stamp-calendar">
              ${this.renderCalendar()}
            </div>
            
            <!-- Stamp Detail Modal (hidden by default) -->
            <div class="stamp-detail-modal" id="stamp-detail-modal" style="display: none;">
              <div class="stamp-detail-content">
                <div class="stamp-detail-header">
                  <h3 class="stamp-detail-title">スタンプ詳細</h3>
                  <button class="stamp-detail-close" onclick="stampManager.closeStampDetail()">✕</button>
                </div>
                <div class="stamp-detail-body" id="stamp-detail-body">
                  <!-- Detail content will be inserted here -->
                </div>
              </div>
            </div>
            
            <div class="stamp-collection-actions">
              <button onclick="goToDashboard()" class="btn btn-secondary btn-full">
                ダッシュボードへ戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 背景色を設定
    if (typeof setScreenBackground !== 'undefined') {
      setScreenBackground('linear-gradient(135deg, #EC4899 0%, #BE185D 100%)');
    }
    
    // ナビゲーションバーをマウント
    await mountNavigation('/stamps');
  }

  /**
   * 月別スタンプデータを取得
   * Requirements: 12.1, 12.2
   * 
   * @param {number} year - 年
   * @param {number} month - 月 (1-12)
   */
  async loadStamps(year, month) {
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client not initialized');

      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // 指定された年月のスタンプを取得
      const { data, error } = await client
        .from('attendances')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
        .order('check_in_date', { ascending: true });

      if (error) throw error;

      this.stamps = data || [];
      console.log(`✅ Loaded ${this.stamps.length} stamps for ${year}/${month}`);
      
      return this.stamps;
    } catch (error) {
      console.error('❌ Failed to load stamps:', error);
      this.stamps = [];
      return [];
    }
  }

  /**
   * カレンダービューをレンダリング
   * Requirements: 12.1, 12.2, 12.4
   */
  renderCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // スタンプデータをマップに変換（日付をキーに）
    const stampMap = new Map();
    this.stamps.forEach(stamp => {
      const date = new Date(stamp.check_in_date);
      const day = date.getDate();
      stampMap.set(day, stamp);
    });

    let html = '<div class="calendar-grid">';
    
    // 曜日ヘッダー
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach(day => {
      html += `<div class="calendar-weekday">${day}</div>`;
    });

    // 空白セル（月の最初の日まで）
    for (let i = 0; i < startDayOfWeek; i++) {
      html += '<div class="calendar-day calendar-day-empty"></div>';
    }

    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
      const stamp = stampMap.get(day);
      const hasStamp = !!stamp;
      const isToday = this.isToday(this.currentYear, this.currentMonth, day);
      
      let dayClass = 'calendar-day';
      if (hasStamp) dayClass += ' calendar-day-stamped';
      if (isToday) dayClass += ' calendar-day-today';
      
      const clickHandler = hasStamp 
        ? `onclick="stampManager.showStampDetail(${day})"` 
        : '';
      
      html += `
        <div class="${dayClass}" ${clickHandler}>
          <div class="calendar-day-number">${day}</div>
          ${hasStamp ? '<div class="calendar-stamp-icon">🎫</div>' : ''}
        </div>
      `;
    }

    html += '</div>';
    
    // 空の月の表示
    if (this.stamps.length === 0) {
      html += `
        <div class="stamp-empty-state">
          <div class="stamp-empty-icon">📭</div>
          <div class="stamp-empty-text">この月のスタンプはまだありません</div>
        </div>
      `;
    }

    return html;
  }

  /**
   * 指定された日付が今日かどうかをチェック
   */
  isToday(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() + 1 === month &&
           today.getDate() === day;
  }

  /**
   * 月間ナビゲーション
   * Requirements: 12.5
   * 
   * @param {number} direction - 方向 (-1: 前月, 1: 次月)
   */
  async navigateMonth(direction) {
    this.currentMonth += direction;
    
    // 年をまたぐ処理
    if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }

    // スタンプデータを再読み込み
    await this.loadStamps(this.currentYear, this.currentMonth);

    // 表示を更新
    const monthDisplay = document.getElementById('current-month-display');
    if (monthDisplay) {
      monthDisplay.textContent = `${this.currentYear}年 ${this.currentMonth}月`;
    }

    const calendar = document.getElementById('stamp-calendar');
    if (calendar) {
      calendar.innerHTML = this.renderCalendar();
    }
  }

  /**
   * スタンプ詳細を表示
   * Requirements: 12.3
   * 
   * @param {number} day - 日
   */
  showStampDetail(day) {
    // 該当するスタンプを検索
    const stamp = this.stamps.find(s => {
      const date = new Date(s.check_in_date);
      return date.getDate() === day;
    });

    if (!stamp) return;

    // 日時をフォーマット
    const checkInDate = new Date(stamp.check_in_time);
    const dateStr = this.formatDate(checkInDate);
    const timeStr = this.formatTime(checkInDate);

    // 詳細モーダルを表示
    const modal = document.getElementById('stamp-detail-modal');
    const body = document.getElementById('stamp-detail-body');
    
    if (modal && body) {
      body.innerHTML = `
        <div class="stamp-detail-stamp">
          <div class="stamp-detail-icon">🎫</div>
          <div class="stamp-detail-date">${dateStr}</div>
          <div class="stamp-detail-time">${timeStr}</div>
        </div>
        <div class="stamp-detail-info">
          <div class="stamp-detail-row">
            <span class="stamp-detail-label">📍 場所</span>
            <span class="stamp-detail-value">${stamp.tag}</span>
          </div>
          <div class="stamp-detail-row">
            <span class="stamp-detail-label">📅 日付</span>
            <span class="stamp-detail-value">${dateStr}</span>
          </div>
          <div class="stamp-detail-row">
            <span class="stamp-detail-label">🕐 時刻</span>
            <span class="stamp-detail-value">${timeStr}</span>
          </div>
        </div>
      `;
      
      modal.style.display = 'flex';
    }
  }

  /**
   * スタンプ詳細モーダルを閉じる
   */
  closeStampDetail() {
    const modal = document.getElementById('stamp-detail-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * 日付をフォーマット
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
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
   * ダッシュボードへ戻る
   */
  goToDashboard() {
    // URLを更新（ベースパスを維持）
    history.pushState({ page: 'dashboard' }, 'Dashboard', '/officing/');
    
    if (typeof dashboardManager !== 'undefined') {
      dashboardManager.showDashboard();
    } else {
      goToDashboard();
    }
  }
}

// グローバルインスタンス
const stampManager = new StampManager();
