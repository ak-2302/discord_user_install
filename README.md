# Discord ユーザーインストール Bot

Discordのユーザーインストールに対応した、Cloudflare Workers製のInteractionsエンドポイントです。
サーバーへBotユーザーを追加せず、ユーザーアカウントに追加したアプリから `/ping` コマンドを実行できます。

## 必要な環境

- Node.js 22以上
- npm
- Cloudflareアカウント（デプロイ時）
- Discord Developer Portalで作成したアプリ

## セットアップ

```bash
npm install
cp .dev.vars.example .dev.vars
cp .env.example .env
```

`.dev.vars` にDiscordアプリの公開鍵を設定します。公開鍵はDeveloper Portalの General Information にあります。

```text
DISCORD_PUBLIC_KEY=your_discord_application_public_key
```

`.env` にはコマンド登録用のアプリケーションIDとBotトークンを設定します。`.env` はGitにコミットしません。

```text
DISCORD_APPLICATION_ID=your_discord_application_id
DISCORD_TOKEN=your_discord_bot_token
```

型定義生成とローカル起動:

```bash
npm run types
npm run dev
```

## Discord側の設定

1. Developer Portalの Installation で User Install を有効にする
2. User Installのスコープに `applications.commands` を設定する
3. `/ping` コマンドを登録する

```bash
npm run register
```

`DISCORD_TOKEN` はコマンド登録スクリプトだけで使用します。Worker本体には不要です。

## デプロイ

```bash
npx wrangler login
npm run deploy
npx wrangler secret put DISCORD_PUBLIC_KEY
```

デプロイ後に表示されたWorker URLの `/interactions` を、Developer Portalの General Information > Interactions Endpoint URL に設定します。
Discordの検証リクエストに成功し、`/ping` が登録済みであれば、ユーザーインストールしたアプリから実行できます。

## コマンド

- `GET /`：稼働確認
- `POST /interactions`：Discord Interactions受信（署名検証付き）
- `POST /register`：未提供。コマンド登録はローカルの `scripts/register.ts` で実行

登録済みコマンド:

- `/ping`：応答確認
- `/dice`：`XdY`形式で指定したサイコロを振る（例：`roll:2d6`、`roll:3d8`）
- `/weather`：Tokyo・Osaka・Sapporo・Fukuokaの現在の天気
- `/qr`：テキストやURLのQRコード（例：`url:https://example.com`）
- `/coin`：コインの表・裏を抽選
- `/choice`：A〜Dの候補から1つを抽選（例：`a:A b:B c:C d:D`）
- `/poke`：ポケモン名からヤッくんの図鑑ページを検索（例：`name:ピカチュウ`）
- `/league`：LoL日本語Wiki・OP.GG・LoLalyticsのチャンピオンページを表示（例：`champion:ゾーイ`）

全コマンドはユーザーインストールに対応し、Bot DM・通常DM・グループDMで利用できます。コマンド定義を変更した場合は `npm run register` で再登録してください。

コマンドの実装は `src/commands/` に1コマンド1ファイルで追加します。定義と処理を作成した後、`src/commands/index.ts` に登録してください。
