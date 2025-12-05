/**
 * Supabase Configuration
 * 
 * セットアップ手順:
 * 1. https://supabase.com でプロジェクトを作成
 * 2. Project Settings → API から以下の情報を取得:
 *    - Project URL
 *    - anon/public key
 * 3. 下記の SUPABASE_URL と SUPABASE_ANON_KEY を更新
 */

const CONFIG = {
  // Supabase接続情報（実際の値に置き換えてください）
  SUPABASE_URL: 'https://uudcybalamailzeydebz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZGN5YmFsYW1haWx6ZXlkZWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODg3NDMsImV4cCI6MjA4MDI2NDc0M30.ebitBMPy2jGJWpl8Zo_MIg6DMaVhGLMUc7v7ARb2N78',
  
  // アプリケーション設定
  APP_NAME: 'Officing',
  BASE_PATH: '/officing/', // GitHub Pages base path
  DEFAULT_TAG: 'office',
  
  // くじシステム設定
  LOTTERY_THRESHOLDS: [4, 8, 12],
  PITY_THRESHOLD: 10,
  
  // レベルシステム設定
  BASE_XP_REQUIREMENT: 100,
  XP_GROWTH_RATE: 1.5,
  
  // クエスト設定
  DAILY_QUEST_COUNT: 3,
  
  // ランク別報酬倍率
  RANK_MULTIPLIERS: {
    S: 3.0,
    A: 2.0,
    B: 1.5,
    C: 1.0
  }
};

// 設定の検証
if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL' || 
    CONFIG.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Supabase設定が未完了です。js/config.js を更新してください。');
}

/**
 * ベースパスを考慮したURLを生成
 * @param {string} path - 相対パス（例: 'login.html', 'css/main.css'）
 * @returns {string} ベースパスを含む完全なパス
 */
function getAppPath(path) {
  // パスが既に絶対パスまたはhttp(s)で始まる場合はそのまま返す
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  
  // 先頭の './' を削除
  const cleanPath = path.replace(/^\.\//, '');
  
  // ベースパスと結合
  return CONFIG.BASE_PATH + cleanPath;
}
