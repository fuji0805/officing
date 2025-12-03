/**
 * Supabase Client Initialization
 * 
 * Supabaseクライアントの初期化と基本的なヘルパー関数
 */

let supabaseClient = null;

/**
 * Supabaseクライアントを初期化
 */
function initSupabase() {
  // 既に初期化されている場合は既存のクライアントを返す
  if (supabaseClient) {
    console.log('✅ Supabase client already initialized');
    return supabaseClient;
  }

  if (!window.supabase) {
    console.error('Supabase library not loaded');
    return null;
  }

  try {
    supabaseClient = window.supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY
    );
    
    console.log('✅ Supabase client initialized');
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

/**
 * Supabaseクライアントを取得
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * 現在の認証セッションを取得
 */
async function getCurrentSession() {
  const client = getSupabaseClient();
  if (!client) return null;
  
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * 現在のユーザーを取得
 */
async function getCurrentUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  
  try {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

/**
 * 認証状態の変更を監視
 */
function onAuthStateChange(callback) {
  const client = getSupabaseClient();
  if (!client) return null;
  
  return client.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    callback(event, session);
  });
}

/**
 * Magic Link認証を実行
 */
async function signInWithMagicLink(email) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  
  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Google OAuth認証を実行
 */
async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * ログアウト
 */
async function signOut() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * セッションをリフレッシュ
 */
async function refreshSession() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  
  try {
    const { data, error } = await client.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    throw error;
  }
}

/**
 * セッションの有効性をチェック
 */
async function isSessionValid() {
  try {
    const session = await getCurrentSession();
    if (!session) return false;
    
    // セッションの有効期限をチェック
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const isValid = expiresAt > now;
    
    // 有効期限が近い場合は自動リフレッシュ
    const timeUntilExpiry = expiresAt - now;
    if (isValid && timeUntilExpiry < 300) { // 5分以内
      try {
        await refreshSession();
        console.log('✅ Session refreshed automatically');
      } catch (error) {
        console.error('Failed to auto-refresh session:', error);
        
        // エラーハンドリング
        if (typeof errorHandler !== 'undefined') {
          errorHandler.handleError(error, {
            operation: 'session-refresh'
          });
        }
        
        return false;
      }
    }
    
    return isValid;
  } catch (error) {
    console.error('Failed to check session validity:', error);
    return false;
  }
}

/**
 * 認証が必要な操作を実行（自動リトライ付き）
 */
async function withAuth(fn) {
  // セッションの有効性をチェック
  const valid = await isSessionValid();
  
  if (!valid) {
    const error = new Error('User not authenticated');
    error.status = 401;
    throw error;
  }
  
  return await fn();
}
