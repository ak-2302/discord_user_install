#!/usr/bin/env node
import fs from "node:fs/promises";

const apiUrl = "https://api.github.com/repos/ak-2302/EmoteLab/contents/Export/mei_all_2026-11-21-00-42-59?ref=master";
const output = "/Users/myuser/Documents/GitHub/discord-stamps/stamps/manifest.json";
const response = await fetch(apiUrl, { headers: { accept: "application/vnd.github+json" } });
if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
const files = (await response.json()).filter((file) => file.type === "file" && file.name.endsWith(".gif"));
const old = JSON.parse(await fs.readFile(output, "utf8"));
const oldById = new Map(old.stamps.map((stamp) => [stamp.id, stamp]));
function uniqueId(baseId, used) {
  let id = baseId;
  let suffix = 2;
  while (used.has(id)) id = `${baseId.slice(0, 32 - String(suffix).length - 1)}-${suffix++}`;
  used.add(id);
  return id;
}

const translations = {
  Angry: "怒る", Arrive: "到着", Battery: "バッテリー", Charge: "充電", Low: "残量わずか",
  Bell: "ベル", Bite: "噛む", Blep: "舌を出す", Blink: "まばたき", Blow: "かむ", Nose: "鼻",
  Blushing: "照れる", Bongo: "ボンゴ", Frame: "フレーム", FrameLeft: "左フレーム", FrameRight: "右フレーム", Smooth: "なめらか",
  Left: "左", Right: "右", Spoon: "スプーン", Blush: "照れ", Read: "読む", Bonk: "ぽかん", Book: "本", Boop: "つんつん", Bug: "バグ", Button: "ボタン", Punch: "パンチ", Cake: "ケーキ",
  Card: "カード", Swipe: "スワイプ", Caught: "捕まえた", Phone: "スマホ", Video: "動画", Camera: "カメラ", Cauldron: "大釜",
  Magic: "魔法", Stir: "かき混ぜる", Celebration: "お祝い", Cheek: "ほっぺ", Squeeze: "つまむ", Cheer: "応援", Cheers: "乾杯", Caramelldansen: "キャラメルダンセン", Helltaker: "ヘルテイカー", Scuba: "スキューバ", Cortisol: "コルチゾール",
  Cheese: "チーズ", Slap: "びんた", CheeseSlap: "チーズびんた", Clown: "ピエロ", Coke: "コーラ", CokeShake: "コーラを振る", Copium: "コピウム", Crowbar: "バール",
  Cry: "泣く", Cut: "切る", Scissors: "はさみ", Dance: "踊る", Dead: "死亡", Dizzy: "めまい", Draw: "描く",
  Normal: "通常", Tired: "疲れた", Drink: "飲む", Beverage: "飲み物", Cup: "カップ", Energy: "エネルギー", BeverageCup: "ドリンクカップ", EnergyDrink: "エナジードリンク",
  Drive: "運転", Drooling: "よだれ", Chopstick: "箸", Fork: "フォーク", ForkKnife: "フォークとナイフ", Dum: "おバカ顔", Sticker: "ステッカー",
  Easter: "イースター", Eat: "食べる", Donut: "ドーナツ", Popcorn: "ポップコーン", Watermelon: "スイカ", Electric: "電気", Fan: "扇風機", Folding: "折りたたみ", Fans: "扇子",
  Exclamation: "びっくり", Fire: "炎", Game: "ゲーム", Get: "受ける", Hit: "攻撃", GetHit: "攻撃を受ける", Bits: "ビッツ",
  Coin: "コイン", Custom: "カスタム", Heart: "ハート", Slipper: "スリッパ", Gift: "ギフト", Greeting: "あいさつ",
  Guitar: "ギター", Gun: "銃", Trigger: "引き金", Happy: "嬉しい", TriggerHappy: "乱射", Head: "頭", Nod: "うなずく", Shake: "振る", Hurt: "痛い",
  Hydrate: "水分補給", Hypnosis: "催眠", Idea: "ひらめき", Jail: "牢屋", Knife: "ナイフ", Laugh: "笑う", Point: "指さす",
  Lick: "なめる", Ice: "アイス", Cream: "クリーム", Popsicle: "アイスキャンディー", Lightstick: "ペンライト", Loading: "読み込み中",
  Mug: "マグカップ", Sleep: "寝る", Love: "愛", Letter: "手紙", LoveLetter: "ラブレター", Lurk: "潜む", Luv: "好き",
  Megaphone: "メガホン", Money: "お金", Music: "音楽", Mute: "ミュート", Need: "必要", Food: "食べ物", Nerd: "オタク",
  Nervous: "緊張", Noted: "了解", Idle: "待機", Talk: "話す", Yap: "おしゃべり", Paid: "有料", Break: "休憩", Easy: "簡単", Hard: "難しい", Mode: "モード", PaidBreak: "有料休憩",
  Tuber: "チューバー", PNGTuber: "PNGチューバー", Pat: "なでる", Pillow: "枕", Rub: "こする", Popcat: "ポップキャット",
  Press: "押す", Pumpkin: "かぼちゃ", Question: "疑問", Raid: "襲撃", Red: "赤", Packet: "袋", RedPacket: "ご祝儀袋", Redpacket: "ご祝儀袋",
  Reverse: "反転", Rose: "バラ", Scared: "怖い", Cross: "十字", Score: "スコア", Point: "点", Shy: "恥ずかしい", Sick: "具合が悪い", Bed: "ベッド", bed: "ベッド",
  Sing: "歌う", Six: "六", Seven: "七", Preparing: "準備中", Stage: "段階", UU: "ダブルユー", Sparkling: "キラキラ",
  Spray: "スプレー", Stop: "止まれ", Stops: "止まる", Working: "動作中", StopsWorking: "動かない", Sunglasses: "サングラス", Gleam: "きらめき", Loop: "ループ",
  Pixel: "ピクセル", Remove: "外す", Surprise: "驚く", Swatter: "ハエたたき", Sweat: "汗", Wipe: "拭く",
  Tablet: "タブレット", Tail: "しっぽ", Wag: "振る", Take: "持っていく", My: "私の", Tape: "テープ", Tea: "お茶",
  Think: "考える", Confident: "自信満々", Serious: "真剣", This: "これ", Is: "は", Fine: "大丈夫", Thumb: "親指", Down: "下", Up: "上",
  Trash: "ゴミ", Bin: "箱", Trophy: "トロフィー", Type: "入力", Annoyed: "うんざり", Wiggle: "ゆらゆら", Wink: "ウインク", Work: "仕事", Nap: "昼寝", Yay: "やったー",
};

function labelFor(name) {
  if (/^[ぁ-んァ-ヶ一-龯\s]+$/.test(name)) return name;
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Za-z])(\d)/g, "$1 $2").replace(/(\d)([A-Za-z])/g, "$1 $2").split(/[-\s]+/).filter(Boolean);
  return words.map((word) => translations[word] ?? word).join("・");
}

const usedIds = new Set();
const stamps = files.map((file, index) => {
  const baseId = file.name.slice(0, -4).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  const id = uniqueId(baseId || `stamp-${index + 1}`, usedIds);
  const previous = oldById.get(id);
  return {
    id,
    label: labelFor(file.name.slice(0, -4)),
    description: file.name.slice(0, -4),
    emoji: previous?.emoji ?? { name: "✨" },
    gif: file.download_url,
  };
});
await fs.writeFile(output, `${JSON.stringify({ version: 1, stamps }, null, 2)}\n`);
console.log(`${stamps.length}件のスタンプを生成しました: ${output}`);
