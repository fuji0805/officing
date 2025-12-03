/**
 * Supabase Configuration Template
 * 
 * セットアップ手順:
 * 1. このファイルを config.js にコピー
 * 2. https://supabase.com でプロジェクトを作成
 * 3. Project Settings → API から以下の情報を取得:
 *    - Project URL
 *    - anon/public key
 * 4. 下記の SUPABASE_URL と SUPABASE_ANON_KEY を更新
 */

const CONFIG = {
  // Supabase接続情報（実際の値に置き換えてください）
  SUPABASE_URL: 'YOUR_SUPABASE_PROJECT_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  
  // アプリケーション設定
  APP_NAME: 'Officing',
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
