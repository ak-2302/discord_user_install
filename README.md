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

ローカル起動:

```bash
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

### GitHub Actionsによる自動デプロイ

`main`へpushすると`.github/workflows/deploy.yml`がCloudflare Workersへ自動デプロイします。GitHubリポジトリのSettings > Secrets and variables > Actionsに、次のRepository secretsを登録してください。

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

API TokenにはWorkerのデプロイ権限を付与します。Discord公開鍵やスタンプマニフェストURLなどのWorker Secretは、初回だけ手動で次のように登録します。

```bash
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put STAMP_MANIFEST_URL
```

デプロイ後に表示されたWorker URLの `/interactions` を、Developer Portalの General Information > Interactions Endpoint URL に設定します。
Discordの検証リクエストに成功し、`/ping` が登録済みであれば、ユーザーインストールしたアプリから実行できます。

## コマンド

- `GET /`：稼働確認
- `POST /interactions`：Discord Interactions受信（署名検証付き）
- `POST /register`：未提供。コマンド登録はローカルの `scripts/register.js` で実行

登録済みコマンド:

- `/ping`：応答確認
- `/dice`：`XdY`形式で指定したサイコロを振る（例：`roll:2d6`、`roll:3d8`）
- `/weather`：Tokyo・Osaka・Sapporo・Fukuokaの現在の天気
- `/qr`：テキストやURLのQRコード（例：`url:https://example.com`）
- `/coin`：コインの表・裏を抽選
- `/choice`：A〜Dの候補から1つを抽選（例：`a:A b:B c:C d:D`）
- `/poke`：ポケモン名からヤッくんの図鑑ページを検索（例：`name:ピカチュウ`）
- `/league`：LoL日本語Wiki・OP.GG・LoLalyticsのチャンピオンページを表示（例：`champion:ゾーイ`）
- `/unite`：ポケモンユナイト日本語Wikiのページを表示（例：`pokemon:アブソル`）
- `/calc`：四則演算の計算式を計算（例：`expression:(12 + 3) * 4`）
- `/schedule`：Embedで今日・明日・今月、または指定日のGoogle Calendar予定を確認（プルダウン・日付入力・再読み込み対応）
- `/mail`：本人だけに見える非公開応答で、未読Gmailを最大10件、1通1Embedで確認（件名・本文・送信者・送信者アドレスを分離表示、受信日時はfooter、再読み込み対応）
- `/memo`：仮データのメモをEmbedで表示
- `/stamp`：公開GitHubリポジトリのマニフェストからスタンプを選び、ephemeralな絵文字ボタンで選択したGIFを投稿

全コマンドはユーザーインストールに対応し、サーバー内チャンネル・Bot DM・通常DM・グループDMで利用できます。コマンド定義を変更した場合は `npm run register` で再登録してください。

コマンドの実装は `src/commands/` に1コマンド1ファイルで追加します。定義と処理を作成した後、`src/commands/index.js` に登録してください。

`/stamp` は `STAMP_MANIFEST_URL`（HTTPSの公開URL）からスタンプ定義を取得します。マニフェストの形式は、`/Users/myuser/Documents/GitHub/discord-stamps/README.md` に作成したスタンプ仕様を参照してください。

## Google Apps Script連携

`gas/Code.gs`をGoogle Apps Scriptプロジェクトに貼り付け、プロジェクトのタイムゾーンを`Asia/Tokyo`に設定します。GASの「プロジェクトの設定」>「スクリプト プロパティ」に次の2項目を登録してください。

```text
GAS_SHARED_TOKEN=Workerと共有する長いランダム文字列
```

「デプロイ」>「新しいデプロイ」から種類を「ウェブアプリ」にし、次の設定でデプロイします。

- 次のユーザーとして実行：自分
- アクセスできるユーザー：全員

表示された`/exec` URLを`GAS_WEB_APP_URL`として使用します。GASはGoogleアカウント本人のCalendarとGmailを読み取り、初回実行時に必要な権限を要求します。メール本文はプレーンテキストとして取得して表示しますが、添付ファイルは取得しません。

## Worker Secretの設定

ローカルでは`.dev.vars`に設定し、本番では次のコマンドで登録します。

```bash
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put GAS_WEB_APP_URL
npx wrangler secret put GAS_SHARED_TOKEN
npx wrangler secret put STAMP_MANIFEST_URL
```

共有トークンを再発行するときは、GASのスクリプトプロパティとWorker Secretの`GAS_SHARED_TOKEN`を同じ新しい値に更新してください。その後、`npm run deploy`と`npm run register`を実行します。
