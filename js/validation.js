/**
 * Validation Utilities
 * 
 * 入力バリデーション用のユーティリティ関数
 */

const Validator = {
  /**
   * メールアドレスのバリデーション
   * @param {string} email - メールアドレス
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateEmail(email) {
    if (!email || email.trim() === '') {
      return {
        valid: false,
        error: 'メールアドレスを入力してください'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: '有効なメールアドレスを入力してください'
      };
    }

    return { valid: true };
  },

  /**
   * タグのバリデーション
   * @param {string} tag - タグ
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateTag(tag) {
    if (!tag || tag.trim() === '') {
      return {
        valid: false,
        error: 'タグを入力してください'
      };
    }

    // 英数字、ハイフン、アンダースコアのみ
    const tagRegex = /^[a-zA-Z0-9_-]+$/;
    if (!tagRegex.test(tag)) {
      return {
        valid: false,
        error: 'タグは英数字、ハイフン、アンダースコアのみ使用できます'
      };
    }

    if (tag.length > 50) {
      return {
        valid: false,
        error: 'タグは50文字以内で入力してください'
      };
    }

    return { valid: true };
  },

  /**
   * 必須フィールドのバリデーション
   * @param {string} value - 値
   * @param {string} fieldName - フィールド名
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateRequired(value, fieldName = 'この項目') {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        valid: false,
        error: `${fieldName}は必須です`
      };
    }

    return { valid: true };
  },

  /**
   * 数値のバリデーション
   * @param {any} value - 値
   * @param {Object} options - オプション { min, max, integer }
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateNumber(value, options = {}) {
    const { min, max, integer = false } = options;

    const num = Number(value);
    if (isNaN(num)) {
      return {
        valid: false,
        error: '数値を入力してください'
      };
    }

    if (integer && !Number.isInteger(num)) {
      return {
        valid: false,
        error: '整数を入力してください'
      };
    }

    if (min !== undefined && num < min) {
      return {
        valid: false,
        error: `${min}以上の値を入力してください`
      };
    }

    if (max !== undefined && num > max) {
      return {
        valid: false,
        error: `${max}以下の値を入力してください`
      };
    }

    return { valid: true };
  },

  /**
   * 文字列長のバリデーション
   * @param {string} value - 値
   * @param {Object} options - オプション { min, max }
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateLength(value, options = {}) {
    const { min, max } = options;

    if (!value) {
      value = '';
    }

    const length = value.length;

    if (min !== undefined && length < min) {
      return {
        valid: false,
        error: `${min}文字以上で入力してください`
      };
    }

    if (max !== undefined && length > max) {
      return {
        valid: false,
        error: `${max}文字以内で入力してください`
      };
    }

    return { valid: true };
  },

  /**
   * URLのバリデーション
   * @param {string} url - URL
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateUrl(url) {
    if (!url || url.trim() === '') {
      return {
        valid: false,
        error: 'URLを入力してください'
      };
    }

    try {
      new URL(url);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: '有効なURLを入力してください'
      };
    }
  },

  /**
   * 日付のバリデーション
   * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') {
      return {
        valid: false,
        error: '日付を入力してください'
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return {
        valid: false,
        error: '日付はYYYY-MM-DD形式で入力してください'
      };
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: '有効な日付を入力してください'
      };
    }

    return { valid: true };
  },

  /**
   * フォーム全体のバリデーション
   * @param {Object} rules - バリデーションルール
   * @param {Object} values - フォームの値
   * @returns {Object} - { valid: boolean, errors: Object }
   */
  validateForm(rules, values) {
    const errors = {};
    let valid = true;

    Object.keys(rules).forEach(fieldName => {
      const rule = rules[fieldName];
      const value = values[fieldName];

      // 必須チェック
      if (rule.required) {
        const result = this.validateRequired(value, rule.label || fieldName);
        if (!result.valid) {
          errors[fieldName] = result.error;
          valid = false;
          return;
        }
      }

      // 値が空の場合は他のバリデーションをスキップ
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return;
      }

      // タイプ別バリデーション
      if (rule.type === 'email') {
        const result = this.validateEmail(value);
        if (!result.valid) {
          errors[fieldName] = result.error;
          valid = false;
        }
      } else if (rule.type === 'number') {
        const result = this.validateNumber(value, rule);
        if (!result.valid) {
          errors[fieldName] = result.error;
          valid = false;
        }
      } else if (rule.type === 'url') {
        const result = this.validateUrl(value);
        if (!result.valid) {
          errors[fieldName] = result.error;
          valid = false;
        }
      } else if (rule.type === 'date') {
        const result = this.validateDate(value);
        if (!result.valid) {
          errors[fieldName] = result.error;
          valid = false;
        }
      }

      // 長さチェック
      if (rule.minLength || rule.maxLength) {
        const result = this.validateLength(value, {
          min: rule.minLength,
          max: rule.maxLength
        });
        if (!result.valid) {
          errors[fieldName] = result.error;
          valid = false;
        }
      }

      // カスタムバリデーション
      if (rule.custom) {
        const result = rule.custom(value);
        if (!result.valid) {
          errors[fieldName] = result.error;
          valid = false;
        }
      }
    });

    return { valid, errors };
  },

  /**
   * フォームバリデーションを実行してエラーを表示
   * @param {Object} rules - バリデーションルール
   * @param {Object} values - フォームの値
   * @returns {boolean} - バリデーション結果
   */
  validateAndShowErrors(rules, values) {
    const { valid, errors } = this.validateForm(rules, values);

    if (!valid && typeof errorHandler !== 'undefined') {
      errorHandler.showValidationErrors(errors);
    }

    return valid;
  }
};
