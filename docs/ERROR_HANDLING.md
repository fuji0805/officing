# エラーハンドリングとバリデーション実装ガイド

## 概要

Officingアプリケーションの統合エラーハンドリングシステムの実装ドキュメントです。

## 実装内容

### 1. エラーハンドラーモジュール (`js/error-handler.js`)

包括的なエラーハンドリング機能を提供するモジュール。

#### 主な機能

- **エラー分類**: エラータイプの自動判定
- **ユーザーフレンドリーなメッセージ**: 技術的なエラーを分かりやすく変換
- **リトライロジック**: Exponential backoffによる自動リトライ
- **エラー通知**: 視覚的なエラー通知UI
- **バリデーションエラー表示**: フォームフィールドのエラー表示
- **グローバルエラーハンドラー**: 未処理のエラーをキャッチ

#### エラータイプ

- `NETWORK_OFFLINE`: オフライン状態
- `NETWORK_ERROR`: ネットワークエラー
- `AUTH_ERROR`: 認証エラー (401)
- `VALIDATION_ERROR`: バリデーションエラー (400)
- `PERMISSION_ERROR`: 権限エラー (403)
- `NOT_FOUND_ERROR`: リソース未検出 (404)
- `SERVER_ERROR`: サーバーエラー (5xx)
- `TIMEOUT_ERROR`: タイムアウト
- `RATE_LIMIT_ERROR`: レート制限 (429)
- `UNKNOWN_ERROR`: その他のエラー

#### 使用例

```javascript
// エラーを処理
try {
  await someOperation();
} catch (error) {
  const errorInfo = errorHandler.handleError(error, {
    operation: 'checkin',
    context: { tag: 'office-a' }
  });
  
  errorHandler.showError(errorInfo.message, {
    title: 'チェックインエラー',
    type: 'error'
  });
}

// リトライロジック
const result = await errorHandler.retryWithBackoff(
  async () => await apiCall(),
  {
    maxRetries: 3,
    baseDelay: 1000,
    context: { operation: 'api-call' },
    onRetry: (attempt, maxRetries, delay) => {
      console.log(`Retry ${attempt}/${maxRetries} in ${delay}ms`);
    }
  }
);

// エラー通知を表示
errorHandler.showError('操作に失敗しました', {
  title: 'エラー',
  type: 'error',
  duration: 5000,
  actions: [
    {
      id: 'retry',
      label: '再試行',
      handler: () => retryOperation()
    }
  ]
});

// バリデーションエラーを表示
errorHandler.showValidationErrors({
  email: 'メールアドレスを入力してください',
  password: 'パスワードは8文字以上必要です'
});

// バリデーションエラーをクリア
errorHandler.clearValidationErrors();
```

### 2. バリデーションモジュール (`js/validation.js`)

入力バリデーション用のユーティリティ関数を提供。

#### 主な機能

- メールアドレスのバリデーション
- タグのバリデーション
- 必須フィールドのバリデーション
- 数値のバリデーション
- 文字列長のバリデーション
- URLのバリデーション
- 日付のバリデーション
- フォーム全体のバリデーション

#### 使用例

```javascript
// メールアドレスのバリデーション
const result = Validator.validateEmail('user@example.com');
if (!result.valid) {
  console.error(result.error);
}

// フォーム全体のバリデーション
const rules = {
  email: {
    required: true,
    type: 'email',
    label: 'メールアドレス'
  },
  points: {
    required: true,
    type: 'number',
    min: 0,
    max: 10000,
    integer: true,
    label: 'ポイント数'
  }
};

const values = {
  email: formData.get('email'),
  points: formData.get('points')
};

const valid = Validator.validateAndShowErrors(rules, values);
if (valid) {
  // フォーム送信処理
}
```

### 3. 統合されたモジュール

以下のモジュールにエラーハンドリングが統合されています：

#### チェックインモジュール (`js/checkin.js`)

- リトライロジックによる自動再試行
- オフライン時のキューイング通知
- 認証エラー時のログイン画面への誘導
- ユーザーフレンドリーなエラーメッセージ

#### 認証モジュール (`js/auth.js`)

- メールアドレスのバリデーション
- Magic Link送信のリトライ
- Google認証エラーの適切な処理
- ログアウトエラーの処理

#### くじモジュール (`js/lottery.js`)

- くじ抽選のリトライロジック
- 認証エラー時の再ログイン誘導
- 再試行アクション付きエラー通知

#### クエストモジュール (`js/quest.js`)

- クエスト完了のリトライロジック
- 認証エラーハンドリング
- 再試行機能付きエラー通知

#### ショップモジュール (`js/shop.js`)

- 購入処理のリトライロジック
- ポイント不足時の警告表示
- 認証エラーハンドリング

#### Supabaseクライアント (`js/supabase-client.js`)

- セッション自動リフレッシュ
- セッション有効性チェック
- 認証が必要な操作のラッパー関数

## Exponential Backoff アルゴリズム

リトライ時の待機時間は以下の式で計算されます：

```
delay = min(baseDelay * 2^attempt + jitter, maxDelay)
```

- `baseDelay`: 基本待機時間（デフォルト: 1000ms）
- `attempt`: リトライ回数（0から開始）
- `jitter`: ランダムな遅延（0〜30%）
- `maxDelay`: 最大待機時間（デフォルト: 30000ms）

### 例

- 1回目のリトライ: 1000ms + jitter
- 2回目のリトライ: 2000ms + jitter
- 3回目のリトライ: 4000ms + jitter
- 4回目のリトライ: 8000ms + jitter

## エラー通知のスタイル

### CSSクラス

- `.error-notification`: 基本通知スタイル
- `.error-notification-error`: エラー（赤）
- `.error-notification-warning`: 警告（黄）
- `.error-notification-info`: 情報（青）
- `.error-notification-success`: 成功（緑）

### フィールドバリデーション

- `.field-error`: エラーのあるフィールド
- `.field-error-message`: エラーメッセージ

## デモページ

エラーハンドリング機能のデモは以下のページで確認できます：

```
/error-handling-demo.html
```

### デモ内容

1. エラー通知（エラー、警告、情報、成功）
2. ネットワークエラーシミュレーション
3. 認証エラーシミュレーション
4. バリデーションエラー
5. リトライロジックのデモ
6. アクション付きエラー通知

## ベストプラクティス

### 1. エラーハンドリングの基本パターン

```javascript
try {
  // リトライロジックで操作を実行
  const result = await errorHandler.retryWithBackoff(
    async () => await operation(),
    {
      maxRetries: 3,
      context: { operation: 'operation-name' }
    }
  );
  
  return result;
} catch (error) {
  // エラーを処理
  const errorInfo = errorHandler.handleError(error, {
    operation: 'operation-name'
  });
  
  // 認証エラーの場合
  if (errorInfo.shouldReauth) {
    errorHandler.showError(errorInfo.message, {
      title: '認証エラー',
      type: 'error',
      actions: [
        {
          id: 'reauth',
          label: 'ログイン',
          handler: () => window.location.href = '/auth'
        }
      ]
    });
  } else {
    // その他のエラー
    errorHandler.showError(errorInfo.message, {
      title: 'エラー',
      type: 'error'
    });
  }
  
  throw error;
}
```

### 2. バリデーションの基本パターン

```javascript
// バリデーションルールを定義
const rules = {
  fieldName: {
    required: true,
    type: 'email', // or 'number', 'url', 'date'
    minLength: 5,
    maxLength: 100,
    label: 'フィールド名',
    custom: (value) => {
      // カスタムバリデーション
      if (someCondition) {
        return { valid: false, error: 'エラーメッセージ' };
      }
      return { valid: true };
    }
  }
};

// バリデーションを実行
const valid = Validator.validateAndShowErrors(rules, values);

if (valid) {
  // 処理を続行
}
```

### 3. リトライ可能なエラーとそうでないエラー

リトライ可能なエラー：
- ネットワークエラー
- タイムアウト
- サーバーエラー (5xx)
- レート制限

リトライ不可能なエラー：
- 認証エラー (401)
- 権限エラー (403)
- バリデーションエラー (400)
- リソース未検出 (404)

## トラブルシューティング

### エラー通知が表示されない

1. `error-handler.js`が読み込まれているか確認
2. CSSファイルに通知スタイルが含まれているか確認
3. ブラウザのコンソールでエラーを確認

### リトライが動作しない

1. エラーがリトライ可能なタイプか確認
2. `maxRetries`が0より大きいか確認
3. ネットワーク接続を確認

### バリデーションエラーが表示されない

1. フィールドに`name`属性が設定されているか確認
2. バリデーションルールが正しく定義されているか確認
3. `errorHandler.showValidationErrors()`が呼ばれているか確認

## 今後の拡張

- [ ] エラーログの収集と分析
- [ ] オフライン時の詳細なキュー管理
- [ ] カスタムエラータイプの追加
- [ ] 多言語対応
- [ ] エラー通知のカスタマイズオプション
- [ ] エラー統計ダッシュボード

## 関連ドキュメント

- [PWA実装ガイド](PWA_IMPLEMENTATION.md)
- [認証実装ガイド](AUTH_IMPLEMENTATION.md)
- [Supabaseセットアップ](SUPABASE_SETUP.md)
