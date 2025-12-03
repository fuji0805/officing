/**
 * Shop System
 * 
 * ポイントショップの管理
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

class ShopManager {
  constructor() {
    this.shopItems = [];
    this.userPoints = 0;
  }

  /**
   * ショップ画面を表示
   * Requirements: 9.5
   */
  async showShopScreen() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    // ローディング表示
    appDiv.innerHTML = `
      <div class="shop-screen">
        <div class="shop-container">
          <div class="loading-screen">
            <div class="spinner"></div>
            <p>読み込み中...</p>
          </div>
        </div>
      </div>
    `;

    try {
      // ユーザーの進捗データを取得
      await this.loadUserProgress();
      
      // ショップアイテムを取得
      await this.loadShopItems();
      
      // ショップUIをレンダリング
      this.renderShop();
    } catch (error) {
      console.error('Shop screen error:', error);
      this.showError('ショップデータの読み込みに失敗しました');
    }
  }

  /**
   * ユーザーの進捗データを読み込み
   * Requirements: 9.5
   */
  async loadUserProgress() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;

    const { data, error } = await client
      .from('user_progress')
      .select('total_points')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user progress:', error);
      throw error;
    }

    // データが存在しない場合は初期値を作成
    if (!data) {
      const { data: newData, error: insertError } = await client
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
        .select('total_points')
        .single();
      
      if (insertError) throw insertError;
      this.userPoints = newData?.total_points || 0;
    } else {
      this.userPoints = data.total_points || 0;
    }
  }

  /**
   * ショップアイテムを読み込み
   * Requirements: 9.5
   */
  async loadShopItems() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('shop_items')
      .select('*')
      .eq('is_available', true)
      .order('cost', { ascending: true });

    if (error) {
      console.error('Error loading shop items:', error);
      throw error;
    }

    this.shopItems = data || [];
  }

  /**
   * ショップUIをレンダリング
   * Requirements: 9.5
   */
  renderShop() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
      <div class="shop-screen">
        <div class="shop-container">
          <div class="shop-header">
            <h1 class="shop-title">🛒 ポイントショップ</h1>
            <p class="shop-subtitle">ポイントでアイテムを購入しよう</p>
          </div>
          
          <div class="shop-card">
            <!-- Point Balance Display -->
            <div class="shop-points-display">
              <div class="points-icon">💰</div>
              <div class="points-info">
                <div class="points-label">所持ポイント</div>
                <div class="points-value">${this.userPoints.toLocaleString()}</div>
              </div>
            </div>
            
            <!-- Shop Items List -->
            <div class="shop-items-section">
              <h2 class="shop-section-title">アイテム一覧</h2>
              ${this.shopItems.length > 0 ? this.renderShopItems() : this.renderEmptyState()}
            </div>
            
            <!-- Actions -->
            <div class="shop-actions">
              <button onclick="window.location.href='/'" class="btn btn-secondary btn-full">
                ダッシュボードへ戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * ショップアイテムリストをレンダリング
   * Requirements: 9.5
   */
  renderShopItems() {
    return `
      <div class="shop-items-list">
        ${this.shopItems.map(item => this.renderShopItem(item)).join('')}
      </div>
    `;
  }

  /**
   * 個別のショップアイテムをレンダリング
   * Requirements: 9.5
   */
  renderShopItem(item) {
    const canAfford = this.userPoints >= item.cost;
    const itemIcon = this.getItemIcon(item.item_type);
    const itemTypeLabel = this.getItemTypeLabel(item.item_type);

    return `
      <div class="shop-item ${!canAfford ? 'shop-item-unaffordable' : ''}">
        <div class="shop-item-header">
          <div class="shop-item-icon">${itemIcon}</div>
          <div class="shop-item-info">
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-type">${itemTypeLabel}</div>
          </div>
        </div>
        
        <div class="shop-item-description">
          ${item.description || ''}
        </div>
        
        <div class="shop-item-footer">
          <div class="shop-item-cost">
            <span class="cost-icon">💰</span>
            <span class="cost-value">${item.cost.toLocaleString()}</span>
          </div>
          <button 
            class="btn btn-primary btn-sm shop-item-buy-btn"
            onclick="shopManager.purchaseItem('${item.id}')"
            ${!canAfford ? 'disabled' : ''}
          >
            ${canAfford ? '購入' : 'ポイント不足'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * アイテムタイプに応じたアイコンを取得
   */
  getItemIcon(itemType) {
    const icons = {
      'lottery_ticket': '🎫',
      'stamp': '🎨',
      'title': '👑',
      'item': '📦'
    };
    return icons[itemType] || '📦';
  }

  /**
   * アイテムタイプのラベルを取得
   */
  getItemTypeLabel(itemType) {
    const labels = {
      'lottery_ticket': 'くじチケット',
      'stamp': 'スタンプ',
      'title': '称号',
      'item': 'アイテム'
    };
    return labels[itemType] || 'アイテム';
  }

  /**
   * 空の状態を表示
   */
  renderEmptyState() {
    return `
      <div class="shop-empty">
        <p>現在購入可能なアイテムはありません</p>
      </div>
    `;
  }

  /**
   * アイテムを購入
   * Requirements: 9.2, 9.3, 9.4
   */
  async purchaseItem(itemId) {
    try {
      // アイテム情報を取得
      const item = this.shopItems.find(i => i.id === itemId);
      if (!item) {
        errorHandler.showError('アイテムが見つかりません', {
          title: '購入エラー',
          type: 'error'
        });
        return;
      }

      // ポイント不足チェック (Requirement 9.4)
      if (this.userPoints < item.cost) {
        errorHandler.showError('ポイントが不足しています', {
          title: '購入エラー',
          type: 'warning'
        });
        return;
      }

      // 確認ダイアログ
      if (!confirm(`${item.name}を${item.cost}ポイントで購入しますか？`)) {
        return;
      }

      // リトライロジックで購入処理を実行
      await errorHandler.retryWithBackoff(
        async () => await this.executePurchase(item),
        {
          maxRetries: 2,
          context: { operation: 'shop-purchase', itemId, itemName: item.name },
          onRetry: (attempt, maxRetries) => {
            console.log(`Retrying purchase (${attempt}/${maxRetries})...`);
          }
        }
      );

      // 成功メッセージを表示
      this.showPurchaseSuccess(item);

      // ショップ画面を再読み込み
      setTimeout(() => {
        this.showShopScreen();
      }, 2000);

    } catch (error) {
      console.error('Purchase error:', error);
      
      const errorInfo = errorHandler.handleError(error, {
        operation: 'shop-purchase',
        itemId
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
          title: '購入エラー',
          type: 'error'
        });
      }
    }
  }

  /**
   * 購入処理を実行
   * Requirements: 9.2, 9.3
   */
  async executePurchase(item) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) {
      throw new Error('認証が必要です');
    }

    const userId = user.id;

    // トランザクション的な処理
    // 1. ポイントを減算 (Requirement 9.2)
    const { data: progressData, error: progressError } = await client
      .from('user_progress')
      .select('total_points')
      .eq('user_id', userId)
      .single();

    if (progressError) {
      throw new Error('ユーザー情報の取得に失敗しました');
    }

    // 再度ポイント不足チェック
    if (progressData.total_points < item.cost) {
      throw new Error('ポイントが不足しています');
    }

    // ポイントを減算
    const newPoints = progressData.total_points - item.cost;
    const { error: updateError } = await client
      .from('user_progress')
      .update({ 
        total_points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('ポイントの減算に失敗しました');
    }

    // 2. アイテムを付与 (Requirement 9.3)
    await this.deliverItem(userId, item);

    // ローカルのポイント残高を更新
    this.userPoints = newPoints;
  }

  /**
   * アイテムを付与
   * Requirements: 9.3
   */
  async deliverItem(userId, item) {
    switch (item.item_type) {
      case 'lottery_ticket':
        await this.deliverLotteryTicket(userId, item);
        break;
      case 'title':
        await this.deliverTitle(userId, item);
        break;
      case 'stamp':
      case 'item':
        // 将来の拡張用
        console.log('Item delivery not yet implemented for type:', item.item_type);
        break;
      default:
        console.warn('Unknown item type:', item.item_type);
    }
  }

  /**
   * くじチケットを付与
   */
  async deliverLotteryTicket(userId, item) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const ticketCount = item.item_value?.count || 1;

    // 既存のチケット数を取得
    const { data: existingTicket } = await client
      .from('lottery_tickets')
      .select('ticket_count')
      .eq('user_id', userId)
      .single();

    if (existingTicket) {
      // 既存のチケットに加算
      const { error } = await client
        .from('lottery_tickets')
        .update({
          ticket_count: existingTicket.ticket_count + ticketCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error('チケットの付与に失敗しました');
      }
    } else {
      // 新規作成
      const { error } = await client
        .from('lottery_tickets')
        .insert({
          user_id: userId,
          ticket_count: ticketCount,
          earned_from: 'shop_purchase'
        });

      if (error) {
        throw new Error('チケットの付与に失敗しました');
      }
    }
  }

  /**
   * 称号を付与
   */
  async deliverTitle(userId, item) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    const titleId = item.item_value?.title_id;
    if (!titleId) {
      throw new Error('称号IDが指定されていません');
    }

    // 既に所持しているかチェック
    const { data: existingTitle } = await client
      .from('user_titles')
      .select('id')
      .eq('user_id', userId)
      .eq('title_id', titleId)
      .single();

    if (existingTitle) {
      throw new Error('この称号は既に所持しています');
    }

    // 称号を付与
    const { error } = await client
      .from('user_titles')
      .insert({
        user_id: userId,
        title_id: titleId,
        unlocked_at: new Date().toISOString()
      });

    if (error) {
      throw new Error('称号の付与に失敗しました');
    }
  }

  /**
   * 購入成功メッセージを表示
   */
  showPurchaseSuccess(item) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    const overlay = document.createElement('div');
    overlay.className = 'purchase-success-overlay';
    overlay.innerHTML = `
      <div class="purchase-success-content">
        <div class="purchase-success-icon">${this.getItemIcon(item.item_type)}</div>
        <div class="purchase-success-title">購入完了！</div>
        <div class="purchase-success-item">${item.name}</div>
        <div class="purchase-success-message">アイテムを受け取りました</div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 2秒後に自動で閉じる
    setTimeout(() => {
      overlay.remove();
    }, 2000);
  }

  /**
   * エラーメッセージを表示
   * Requirements: 9.4
   */
  showError(message) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    const overlay = document.createElement('div');
    overlay.className = 'shop-error-overlay';
    overlay.innerHTML = `
      <div class="shop-error-content">
        <div class="shop-error-icon">❌</div>
        <div class="shop-error-title">エラー</div>
        <div class="shop-error-message">${message}</div>
        <button class="btn btn-primary" onclick="this.closest('.shop-error-overlay').remove()">
          閉じる
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }
}

// グローバルインスタンス
const shopManager = new ShopManager();
