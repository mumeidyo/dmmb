// NGワードリスト
export const ngWords = [
  // 英語の不適切な単語
  "nigger", "niggers", "dead", "negro", "neger", "negar", "fuck", "shit", "cunt", "suck",
  "asshole", "bitch", "bullshit", "cock", "cunt", "damn it", "erection", "fuck you", "fuck",
  "fucking", "give a fuck", "kkkkkk", "motherfucker", "prick", "retarded", "screw you",
  "son of a bitch", "whore",
  

  "黒人", "ゲイ", "ユダヤ教", "足の爪", "足の爪食ってる",
  "低身長", "黒マッシュ", "黒マスク", "ヤリ目", "吐息厨", "v豚", "低脳", "どしイキリ厨",
  "乞食", 
  "底辺vtuber", "過激派フェミニスト", "ヴィーガン", "ワキガ", "手帳持ち1級","種無し",
  "エイズ", "梅毒", "皮被り", "粗チン", "短小xジェンダー", "左翼反日", "パチカスキレ症", "厨二病",
  "ネット恋愛してるポエマー", "なんj民", "時代遅れ二次元ガチ恋勢", "ひろゆきっず", "会話否定",
  "鉄オタ", "強姦", "魔アスぺ", "知的障害者", "精神疾患", "昼夜逆転", "ヒキニート", "レスバ好き",
  "コミュ障", "髪ボサボサ", "チー牛","彼女なし", "処女厨", "差別主義者",
  "熟女リョナntrアナルプレイヤー", "たけのこの里派",
  

  "泣きました", "私は黒人", "ゲイユダヤ教足の爪食ってる", "しまむらファッションツイ廃",
  "低身長黒マッシュ黒マスク", "v豚低脳", "底辺vtuber過激派"
];

// 完全一致検索を行う単語（部分一致だと誤検知の可能性がある単語）
export const exactMatchWords = [
  "ed", "v豚", "黒人", "ゲイ"
];

// NGワードが含まれているかチェック
export function containsNgWord(text: string): { found: boolean; word: string | null } {
  const lowerText = text.toLowerCase();
  
  // 完全一致をチェック
  const words = text.split(/\s+/);
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (exactMatchWords.includes(lowerWord)) {
      return { found: true, word: word };
    }
  }
  
  // 部分一致をチェック
  for (const ngWord of ngWords) {
    if (lowerText.includes(ngWord.toLowerCase())) {
      return { found: true, word: ngWord };
    }
  }
  
  return { found: false, word: null };
}