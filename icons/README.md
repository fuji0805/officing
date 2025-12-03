# PWA Icons

このディレクトリには、PWA用のアイコン画像を配置します。

## 必要なアイコンサイズ

以下のサイズのPNG画像を用意してください：

- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

## アイコン作成方法

### オプション1: ブラウザベースジェネレーター（推奨）

1. `generate-icons.html` をブラウザで開く
2. 各サイズの「Download」ボタンをクリック
3. ダウンロードしたPNG画像をこのディレクトリに保存
4. ファイル名を適切にリネーム（例: icon-192.png）

### オプション2: ImageMagickスクリプト

ImageMagickがインストールされている場合：

```bash
cd icons
chmod +x create-icons.sh
./create-icons.sh
```

### オプション3: オンラインツール

- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://www.pwabuilder.com/)
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)

### オプション4: 手動作成

1. 512x512のベース画像を作成
2. 画像編集ソフト（Photoshop、GIMP、Figmaなど）で各サイズにリサイズ
3. このディレクトリに保存

## デザインガイドライン

- シンプルで認識しやすいデザイン
- 背景色: #4F46E5（プライマリカラー）
- アイコンは中央に配置
- 余白を適切に確保（Safe Area: 80%）
- Maskable Icon対応（192px, 512px）

## Maskable Icons

Android Adaptive Iconsに対応するため、192pxと512pxのアイコンは「maskable」として設定されています。

- 重要な要素は中央80%の領域に配置
- 外側20%は切り取られる可能性があります

## 検証

アイコンが正しく設定されているか確認：

1. Chrome DevToolsを開く
2. Application > Manifest を確認
3. アイコンが正しく表示されることを確認

または、[Manifest Validator](https://manifest-validator.appspot.com/)を使用
