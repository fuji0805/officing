/**
 * Screen Helper
 * 
 * すべての画面で共通のヘルパー関数
 */

/**
 * ダッシュボードに戻る
 */
function goToDashboard() {
  if (typeof dashboardManager !== 'undefined') {
    dashboardManager.isLoading = false;
    dashboardManager.showDashboard();
  }
}

/**
 * 画面にナビゲーションバーをマウント
 */
async function mountNavigation(path = '/') {
  if (typeof navigationManager !== 'undefined') {
    try {
      const user = await getCurrentUser();
      if (user) {
        const client = getSupabaseClient();
        const { data } = await client
          .from('user_progress')
          .select('total_points')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const points = data?.total_points || 0;
        navigationManager.mount(path, points);
      } else {
        navigationManager.mount(path);
      }
    } catch (error) {
      console.error('Failed to mount navigation:', error);
      navigationManager.mount(path);
    }
  }
}

/**
 * 画面の背景色を設定
 */
function setScreenBackground(gradient) {
  document.body.style.background = gradient;
  document.body.style.minHeight = '100vh';
}
