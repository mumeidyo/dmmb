# Discord モデレーションボット

Discord サーバーの健全性を維持するための高度なモデレーションボットです。不適切なコンテンツフィルタリングやルール適用を通じてサーバーを保護します。

## 主な機能

- 不適切な言葉の自動フィルタリング
- ユーザー定義ルールによるメッセージのモデレーション
- スパム防止（連続投稿の検出と削除）
- プライベートDMによる警告通知
- ウェブダッシュボードによる管理

## 環境設定

このボットを実行するには以下の環境変数が必要です：

- `DISCORD_BOT_TOKEN`: Discord Bot のトークン

## Renderでのデプロイ方法

1. Renderアカウントを作成し、ログインします
2. 「New Web Service」をクリックします
3. このリポジトリのURLを入力します
4. 以下の設定を行います：
   - **Name**: discord-moderation-bot（または任意の名前）
   - **Environment**: Node
   - **Region**: お好みのリージョン
   - **Branch**: main（またはデプロイしたいブランチ）
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. 「Environment Variables」セクションで以下の変数を追加します：
   - `NODE_ENV`: production
   - `DISCORD_BOT_TOKEN`: Discord Botトークン（シークレットとして追加）
6. 「Create Web Service」をクリックしてデプロイを開始します

## ローカル開発

ローカルで開発する場合は以下のコマンドを実行します：

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## セキュリティに関する注意

- Discord Bot トークンは安全に保管し、公開リポジトリにコミットしないようにしてください
- 本番環境では常に環境変数を使用してトークンを提供してください