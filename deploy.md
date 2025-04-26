# Renderへのデプロイ方法

このドキュメントでは、Discord モデレーションボットをRenderにデプロイする方法について詳しく説明します。

## 前提条件

1. [Render](https://render.com/) アカウント（無料プランでOK）
2. [Discord Developer Portal](https://discord.com/developers/applications) でボットを作成済み
3. Discordボットトークン
4. Gitリポジトリ（GitHubなど）にコードをプッシュ済み

## デプロイ手順

### 1. Renderアカウントを設定する

1. [Render](https://render.com/) にアクセスし、アカウントを作成するか、既存のアカウントでログインします。
2. ダッシュボードで「New +」ボタンをクリックし、「Web Service」を選択します。

### 2. リポジトリを接続する

1. 「Connect a repository」セクションで、このプロジェクトをホストしているGitリポジトリ（GitHub, GitLab, Bitbucket）を選択します。
2. アクセス権限を付与し、リポジトリを選択します。

### 3. 設定を構成する

以下の設定を入力します：

- **Name**: `discord-moderation-bot`（任意の名前）
- **Environment**: `Node`
- **Region**: お好みのリージョン
- **Branch**: `main`（またはデプロイしたいブランチ）
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 4. 環境変数を設定する

「Environment」セクションで、以下の環境変数を追加します：

- `NODE_ENV`: `production`
- `DISCORD_BOT_TOKEN`: Discord Developer Portalで取得したボットトークン（秘密情報としてマーク）

### 5. デプロイを開始する

1. 「Create Web Service」ボタンをクリックします。
2. Renderがプロジェクトをデプロイするのを待ちます（数分かかる場合があります）。

### 6. デプロイメントを確認する

1. デプロイが完了したら、URLが提供されます（例: `https://discord-moderation-bot.onrender.com`）。
2. `/api/status` エンドポイントにアクセスして、ボットのステータスを確認できます（例: `https://discord-moderation-bot.onrender.com/api/status`）。
3. Webダッシュボードにアクセスするには、提供されたURLにブラウザでアクセスします。

### 7. ボットを監視する

Renderダッシュボードからログを確認して、ボットが正常に動作していることを確認します。エラーが発生した場合は、ログを確認して問題を解決してください。

## トラブルシューティング

### ボットがオンラインにならない場合

1. Renderダッシュボードのログを確認します。
2. `DISCORD_BOT_TOKEN` が正しく設定されているか確認します。
3. Discord Developer Portalでボットが有効になっていて、必要な権限が付与されているか確認します。

### メモリ使用量エラーが発生する場合

無料プランには512MBのメモリ制限があります。アプリケーションが多くのメモリを使用している場合は、有料プランにアップグレードするか、コードを最適化してメモリ使用量を減らす必要があります。

### データベース接続の問題

スケーリングを考慮する場合、MemStorage（メモリ内ストレージ）からNeonやSupabaseなどの永続的なデータベースに移行することを検討してください。

## アップデートを行う方法

1. コードの変更をリポジトリにプッシュします。
2. Renderは自動的に新しいコミットを検出し、新しいビルドを開始します。