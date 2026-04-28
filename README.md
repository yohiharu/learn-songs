# learn-songs

YouTubeプレイリストの曲をスワイプで覚えるWebアプリです。
Claude Codeで作りました。バグには注意してください

## デモURL
https://app.yohiharu.com

さくらのレンタルサーバ上で、フロントエンドの静的配信と、CGIで動くバックエンドで構成されています。css、jsの静的ファイルはcloudflareによるCDNで配信されます。

## 構成

```
learn-songs/
├── learn-songs-front/   # フロントエンド (React + Vite)
└── learn-songs-cgi/     # バックエンド (Python CGI)
```

## 必要なもの

- Node.js
- Python 3
- YouTube Data API v3 のAPIキー
- Apache（.htaccess による CGI 設定が必要）

## セットアップ

### 1. YouTube Data API キーの取得

[Google Cloud Console](https://console.cloud.google.com/) で YouTube Data API v3 を有効化し、APIキーを取得してください。

### 2. バックエンド (CGI) の設定

```bash
cd learn-songs-cgi
cp .env.example .env
```

`.env` を編集して値を設定します：

```
YOUTUBE_API_KEY=取得したAPIキー
ALLOWED_ORIGIN=フロントエンドのURL（例: http://localhost:5173）
```

`playlist.py` に実行権限を付与します：

```bash
chmod +x playlist.py
```

`learn-songs-cgi/` をApacheのドキュメントルート配下に配置してください。`.htaccess` により、そのディレクトリでCGIが有効になります。

### 3. フロントエンドの設定

```bash
cd learn-songs-front
cp .env.example .env
```

`.env` を編集して値を設定します：

```
VITE_API_BASE_URL=CGIディレクトリのURL（例: http://localhost/learn-songs-cgi）
```

依存パッケージをインストールします：

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
cd learn-songs-front
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

### 5. 本番ビルド

```bash
cd learn-songs-front
npm run build
```

`dist/` ディレクトリの中身をApacheのドキュメントルート配下に配置してください。

## 使い方

1. アプリを開き、YouTubeプレイリストのID（例: `PLxxxxxxxxxx`）またはURLを入力して「開始する」をクリック
2. 曲カードが表示されるので、スワイプして覚え具合を記録
3. 進捗はブラウザのlocalStorageに保存されます
