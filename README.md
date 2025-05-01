# First Moments - 子供の成長記録アプリ

子供の成長の瞬間を記録し、思い出として残すための Web アプリケーションです。写真とともに大切な瞬間を保存できます。

## 技術スタック

- **フロントエンド**

  - Vue.js 3
  - TypeScript
  - SCSS
  - Vue Router (ルーティング)
  - Vuex (状態管理)

- **バックエンド**

  - Firebase Authentication (認証)
  - Firebase Firestore (データベース)
  - Firebase Storage (画像ストレージ)
  - Firebase Hosting (ホスティング)
  - Firebase Functions (サーバーレス関数)

- **その他のライブラリ**
  - browser-image-compression (画像圧縮)

## 環境構築

### 前提条件

- Node.js (v14 以上)
- npm (v6 以上)
- Firebase CLI (`npm install -g firebase-tools`)

### インストール

```bash
# リポジトリのクローン
git clone <リポジトリURL>
cd first-moments

# 依存パッケージのインストール
npm install
```

## ローカル開発環境

### 開発サーバーの起動

```bash
# 開発サーバーの起動
npm run serve
```

開発サーバーは http://localhost:8080 で起動します。

### Firebase エミュレーターの起動

ローカル開発では Firebase エミュレーターを使用します。別のターミナルで以下のコマンドを実行してください：

```bash
# Firebase エミュレーターの起動
firebase emulators:start
```

エミュレーター UI は http://localhost:4000 でアクセスできます。

### エミュレーターデータの保存と読み込み

エミュレーターのデータを保持するには、以下のコマンドを使用します：

```bash
# データを保存しながらエミュレーターを起動
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
```

## 本番環境

### Firebase プロジェクト情報

- **プロジェクト名**: first-moments-app
- **ホスティング URL**: https://first-moments-app.web.app
- **Firebase コンソール**: https://console.firebase.google.com/project/first-moments-app

### 本番環境への接続

`src/firebase/index.ts` ファイルに Firebase の設定情報が含まれています。開発環境では自動的にエミュレーターに接続し、本番環境では Firebase の本番サービスに接続します。

## デプロイ方法

### ビルドとデプロイ

```bash
# アプリケーションのビルド
npm run build

# Firebase Hosting へのデプロイ
firebase deploy --only hosting
```

### 部分的なデプロイ

```bash
# Hosting のみデプロイ
firebase deploy --only hosting

# Storage ルールのみデプロイ
firebase deploy --only storage

# Firestore ルールのみデプロイ
firebase deploy --only firestore

# Functions のみデプロイ
firebase deploy --only functions
```

## 主な機能

- ユーザー認証（登録・ログイン）
- 子供の成長記録の作成
- 写真のアップロード（自動圧縮機能付き）
- 記録の一覧表示と詳細表示

## 画像圧縮について

アップロードされる画像は自動的に圧縮されます。現在の設定は以下の通りです：

- 最大サイズ: 500KB
- 最大解像度: 1280px

これにより、Firebase Storage の無料枠（5GB）を効率的に使用できます。

## 開発ガイドライン

- コミット前に `npm run lint` を実行してコードスタイルを確認してください
- 新機能の追加時は、まずローカル環境でテストしてから本番環境にデプロイしてください
- 本番環境のデータを操作する際は十分注意してください

## ライセンス

このプロジェクトは [MIT ライセンス](LICENSE) の下で公開されています。
