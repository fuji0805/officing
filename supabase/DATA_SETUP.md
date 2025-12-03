# データセットアップガイド

このドキュメントでは、Officingアプリケーションの初期データとマスターデータのセットアップ方法を説明します。

## 📋 概要

Officingには3つのSQLファイルがあります：

1. **schema.sql** - データベーススキーマ（テーブル、インデックス、RLSポリシー）
2. **master-data.sql** - 本番環境用のマスターデータ（推奨）
3. **sample-data.sql** - 開発・テスト用のサンプルデータ

## 🚀 セットアップ手順

### 1. スキーマの作成

まず、データベーススキーマを作成します。

```bash
# Supabase SQL Editorで実行、または
psql -h <your-db-host> -U postgres -d postgres -f supabase/schema.sql
```

### 2. マスターデータの投入

本番環境または個人利用の場合は `master-data.sql` を使用します。

```bash
# Supabase SQL Editorで実行、または
psql -h <your-db-host> -U postgres -d postgres -f supabase/master-data.sql
```

### 3. （オプション）サンプルデータの投入

開発・テスト環境の場合は `sample-data.sql` を使用できます。

```bash
psql -h <your-db-host> -U postgres -d postgres -f supabase/sample-data.sql
```

## 📊 マスターデータの内容

### 景品（Prizes）- Requirement 4.2

- **S ランク（5%）**: プレミアムギフトカード、特別休暇、レジェンド称号
- **A ランク（15%）**: 高級ランチチケット、ボーナスポイント（大）、レア称号
- **B ランク（30%）**: カフェチケット、ボーナスポイント（中）、特別スタンプ
- **C ランク（50%）**: ボーナスポイント（小・微）、通常スタンプ

合計: 12種類の景品

### クエスト（Quests）- Requirement 7.1

- **デイリークエスト**: 16種類（S: 3, A: 4, B: 4, C: 4）
- **ウィークリークエスト**: 4種類（S: 2, A: 2）
- **フレックスクエスト**: 10種類（マイルストーン達成）

合計: 30種類のクエスト

ランク別報酬倍率:
- S ランク: 3.0x
- A ランク: 2.0x
- B ランク: 1.5x
- C ランク: 1.0x

### 称号（Titles）- Requirement 6.1

- **ストリーク系**: 6種類（3日、7日、14日、30日、100日、365日）
- **出社回数系**: 6種類（10回、30回、50回、100回、200回、365回）
- **レベル系**: 5種類（Lv5、10、25、50、100）
- **クエスト系**: 4種類（10個、50個、100個、500個）
- **タグ系**: 5種類（場所別の出社回数）

合計: 26種類の称号

### ショップアイテム（Shop Items）- Requirement 9.5

- **くじチケット**: 4種類（1枚、3枚、5枚、10枚）※まとめ買いでお得
- **特別スタンプ**: 4種類（ゴールド、シルバー、レインボー、ダイヤモンド）
- **称号アンロック**: 3種類（ポイント富豪、ショップマスター、コレクター）
- **ブーストアイテム**: 3種類（XPブースト小・大、ポイントブースト）

合計: 14種類のアイテム

### システム設定（System Config）

デフォルト設定値:
- くじチケット付与タイミング: 4回、8回、12回
- Pity システム閾値: 50回
- デイリークエスト数: 3個
- XP計算式: base(100) × level^1.5
- クエストランク倍率: S=3.0, A=2.0, B=1.5, C=1.0
- デフォルトタグ: "office"
- 1日の最大チェックイン回数: 1回

## 🔍 データ検証

マスターデータ投入後、以下のクエリで検証できます：

```sql
-- レコード数の確認
SELECT 'Prizes' as table_name, COUNT(*) as count FROM prizes
UNION ALL
SELECT 'Quests' as table_name, COUNT(*) as count FROM quests
UNION ALL
SELECT 'Titles' as table_name, COUNT(*) as count FROM titles
UNION ALL
SELECT 'Shop Items' as table_name, COUNT(*) as count FROM shop_items;

-- 景品の重み分布確認（5%, 15%, 30%, 50%になっているか）
SELECT 
    rank,
    COUNT(*) as prize_count,
    SUM(weight) as total_weight,
    ROUND(SUM(weight) * 100.0 / (SELECT SUM(weight) FROM prizes), 2) as weight_percentage
FROM prizes
GROUP BY rank
ORDER BY rank;
```

## 🎮 ゲームバランス設計

### くじシステム
- 4回、8回、12回の出社でチケット獲得
- Pityシステムで50回でA+ランク確定
- 重み付き抽選で適切な確率分布

### クエストシステム
- デイリー: 毎日3個ランダム割り当て
- ウィークリー: 週単位の長期目標
- フレックス: マイルストーン達成型

### レベルシステム
- 指数関数的成長: XP = 100 × level^1.5
- レベル5: 500 XP
- レベル10: 3,162 XP
- レベル25: 15,811 XP

### ポイント経済
- クエスト報酬: 30〜1,000ポイント
- ショップ価格: 500〜5,000ポイント
- くじチケット: 500ポイント（基準価格）

## 🔧 カスタマイズ

### 景品の追加

```sql
INSERT INTO prizes (name, description, rank, weight, stock, reward_type, reward_value) 
VALUES ('新しい景品', '説明', 'A', 5, 10, 'item', '{"value": 1000}');
```

### クエストの追加

```sql
INSERT INTO quests (title, description, quest_type, rank, base_xp, base_points) 
VALUES ('新クエスト', '説明', 'daily', 'B', 150, 100);
```

### 称号の追加

```sql
INSERT INTO titles (name, description, unlock_condition_type, unlock_condition_value, icon) 
VALUES ('新称号', '説明', 'attendance', '{"count": 50}', '🎖️');
```

### ショップアイテムの追加

```sql
INSERT INTO shop_items (name, description, cost, item_type, item_value) 
VALUES ('新アイテム', '説明', 1000, 'lottery_ticket', '{"count": 2}');
```

### システム設定の変更

```sql
-- Pity閾値を変更
UPDATE system_config 
SET value = '30' 
WHERE key = 'pity_threshold';

-- デイリークエスト数を変更
UPDATE system_config 
SET value = '5' 
WHERE key = 'daily_quest_count';
```

## 📝 注意事項

1. **スキーマを先に実行**: `schema.sql` を実行してからマスターデータを投入してください
2. **重複実行**: マスターデータは複数回実行すると重複エラーが発生します。初回のみ実行してください
3. **RLSポリシー**: マスターデータテーブル（prizes, quests, titles, shop_items）は読み取り専用です
4. **在庫管理**: 景品の `stock` が NULL の場合は無制限です
5. **クエストの有効化**: `is_active = FALSE` にするとクエストが非表示になります

## 🔄 データ更新

### 景品の在庫補充

```sql
UPDATE prizes 
SET stock = stock + 10, is_available = TRUE 
WHERE name = 'プレミアムギフトカード';
```

### クエストの無効化

```sql
UPDATE quests 
SET is_active = FALSE 
WHERE title = '古いクエスト';
```

### ショップアイテムの価格変更

```sql
UPDATE shop_items 
SET cost = 450 
WHERE name = 'くじチケット';
```

## 🐛 トラブルシューティング

### エラー: relation "prizes" does not exist
→ `schema.sql` を先に実行してください

### エラー: duplicate key value violates unique constraint
→ マスターデータが既に投入されています。データをクリアするか、個別にUPDATEしてください

### エラー: permission denied
→ RLSポリシーを確認してください。管理者権限が必要な場合があります

## 📚 関連ドキュメント

- [スキーマリファレンス](SCHEMA_REFERENCE.md)
- [Supabaseセットアップ](SUPABASE_SETUP.md)
- [クイックスタート](QUICKSTART.md)

