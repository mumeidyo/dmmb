import { Client, GatewayIntentBits, Events, Message, TextChannel, ChannelType } from 'discord.js';
import { storage } from './storage';
import { handleCommand } from './commands';
import { Rule } from '@shared/schema';
import { containsNgWord } from './ngwords';

// メッセージ履歴を保持するためのデータ構造
interface MessageHistory {
  userId: string;
  channelId: string;
  content: string;
  count: number;
  timestamp: number;
  messageIds: string[]; // 過去のメッセージIDを保存
}

// ユーザーごとのメッセージ履歴を保持するマップ
// キーは "userId-channelId" 形式
const messageHistoryMap = new Map<string, MessageHistory>();

// 連続メッセージのしきい値（これ以上連続で同じメッセージを送信すると警告/削除）
const SPAM_THRESHOLD = 5;

// 履歴の有効期限（ミリ秒）- 30秒
const HISTORY_EXPIRY = 30 * 1000;

// Initialize Discord client with necessary intents
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

let prefix = '!'; // Default prefix, will be updated from settings

// メッセージ履歴を更新し、連続メッセージをチェックする関数
function updateMessageHistory(message: Message): { isSpam: boolean; messageIds?: string[] } {
  const userId = message.author.id;
  const channelId = message.channel.id;
  const content = message.content;
  const messageId = message.id;
  const key = `${userId}-${channelId}`;
  const now = Date.now();
  
  // 履歴をクリーンアップ
  cleanupExpiredHistory();
  
  // 既存の履歴を取得
  const existingHistory = messageHistoryMap.get(key);
  
  // 同じ内容のメッセージが連続しているかチェック
  if (existingHistory && existingHistory.content === content) {
    // 期限切れでなければカウントを増やす
    if (now - existingHistory.timestamp < HISTORY_EXPIRY) {
      existingHistory.count++;
      existingHistory.timestamp = now;
      
      // メッセージIDを保存
      if (!existingHistory.messageIds) {
        existingHistory.messageIds = [];
      }
      existingHistory.messageIds.push(messageId);
      
      console.log(`連続メッセージ検出: ユーザー ${message.author.username} が "${content}" を ${existingHistory.count}回連続投稿`);
      
      // しきい値を超えたらスパムと判定
      if (existingHistory.count >= SPAM_THRESHOLD) {
        console.log(`スパム検出: ユーザー ${message.author.username} のメッセージ "${content}" を削除します (${existingHistory.messageIds.length}件)`);
        return { isSpam: true, messageIds: existingHistory.messageIds }; // スパムと判定し、全てのメッセージIDを返す
      }
    } else {
      // 期限切れならリセット
      existingHistory.count = 1;
      existingHistory.timestamp = now;
      existingHistory.messageIds = [messageId];
    }
  } else {
    // 新しいメッセージまたは異なるメッセージなら新規作成
    messageHistoryMap.set(key, {
      userId,
      channelId,
      content,
      count: 1,
      timestamp: now,
      messageIds: [messageId]
    });
  }
  
  return { isSpam: false }; // スパムではない
}

// 期限切れのメッセージ履歴をクリーンアップする関数
function cleanupExpiredHistory(): void {
  const now = Date.now();
  // Array.fromでMap.entriesをArrayに変換して反復処理
  Array.from(messageHistoryMap.entries()).forEach(([key, history]) => {
    if (now - history.timestamp > HISTORY_EXPIRY) {
      messageHistoryMap.delete(key);
    }
  });
}

// 定期的にメッセージ履歴をクリーンアップ（5分ごと）
setInterval(cleanupExpiredHistory, 5 * 60 * 1000);

// Initialize the bot
export async function initBot(): Promise<void> {
  try {
    // Get bot settings from storage
    const settings = await storage.getBotSettings();
    // Use token from environment variable or settings
    const token = process.env.DISCORD_BOT_TOKEN || settings?.token;
    
    if (token) {
      // Set prefix from settings or default
      prefix = settings?.prefix || '!';
      
      // If we have settings but no token in settings, update it with env token
      if (settings && !settings.token && process.env.DISCORD_BOT_TOKEN) {
        try {
          await storage.updateBotSettings({
            token: process.env.DISCORD_BOT_TOKEN,
            prefix: settings.prefix || '!',
            status: settings.status || 'online'
          });
        } catch (storageError) {
          console.warn('Failed to update bot settings in storage:', storageError);
          // Render環境ではこのエラーを無視して続行
        }
      }
      
      // Login with token
      await client.login(token);
      console.log('Discord bot is online!');
      
      // Set bot status
      const status = settings?.status || 'online';
      if (status === 'online') {
        client.user?.setStatus('online');
      } else if (status === 'idle') {
        client.user?.setStatus('idle');
      } else if (status === 'dnd') {
        client.user?.setStatus('dnd');
      }
      
      client.user?.setActivity('メッセージを監視中');
    } else {
      console.error('No bot token found in environment or settings. Bot will not start.');
    }
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
    
    // 本番環境でのエラーログを詳細に出力
    if (process.env.NODE_ENV === 'production') {
      console.error('Bot initialization error details:', {
        hasToken: !!process.env.DISCORD_BOT_TOKEN,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : 'No stack trace available'
      });
    }
  }
}

// Message handler
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot's own messages
  if (message.author.bot) return;
  
  try {
    // Increment messages monitored counter
    await storage.incrementMessagesMonitored();
    
    // Check if it's a command
    if (message.content.startsWith(prefix)) {
      await handleCommand(message, prefix);
      return;
    }
    
    // まず連投チェック（スパム防止ルールが有効な場合）
    const rules = await storage.getRules();
    const spamRule = rules.find(rule => rule.name === "スパム防止" && rule.enabled);
    
    if (spamRule) {
      const spamCheck = updateMessageHistory(message);
      if (spamCheck.isSpam && spamCheck.messageIds) {
        // スパムと判定された場合、過去のメッセージも含めて全て削除
        await handleSpamMessages(message, spamCheck.messageIds, spamRule);
        return;
      }
    }
    
    // 通常のルールチェック
    await moderateMessage(message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Function to check message against rules
async function moderateMessage(message: Message): Promise<void> {
  try {
    // Get enabled rules
    const rules = await storage.getRules();
    const enabledRules = rules.filter(rule => rule.enabled);
    
    // Check each rule
    for (const rule of enabledRules) {
      if (violatesRule(message, rule)) {
        await applyModeration(message, rule);
        break; // Stop after first rule violation
      }
    }
  } catch (error) {
    console.error('Error moderating message:', error);
  }
}

// Function to check if message violates a rule
function violatesRule(message: Message, rule: Rule): boolean {
  const content = message.content;
  
  // 不適切な言葉のチェック（NGワードリストを使用）
  if (rule.name === "不適切な言葉") {
    const result = containsNgWord(content);
    if (result.found) {
      console.log(`NGワード検出: "${result.word}" in メッセージ: "${content}"`);
      return true;
    }
    return false;
  }
  
  // スパム防止（特殊ルール）
  if (rule.name === "スパム防止") {
    // This would require more complex check with message history
    // Simplified implementation for demo
    return false;
  }
  
  // 過度な大文字（特殊ルール）
  if (rule.name === "過度な大文字") {
    const upperCount = (content.match(/[A-Z]/g) || []).length;
    const totalChars = content.length;
    
    if (totalChars > 10) { // 少なくとも10文字以上のメッセージのみチェック
      const upperPercentage = (upperCount / totalChars) * 100;
      return upperPercentage >= 70;
    }
    return false;
  }
  
  // 宣伝リンク（Discord招待リンクなど）
  if (rule.name === "宣伝リンク") {
    // Discord招待リンク
    if (/discord\.gg\/[\w-]+/i.test(content)) return true;
    // Discordの別形式の招待リンク
    if (/invite\/[\w-]+/i.test(content)) return true;
    return false;
  }
  
  // 上記のいずれにも該当しない場合は、キーワードベースでチェック
  const keywords = rule.keywords.split(',').map(k => k.trim().toLowerCase());
  const lowerContent = content.toLowerCase();
  
  for (const keyword of keywords) {
    if (keyword.includes('*')) {
      // ワイルドカード（*）を含むパターンの場合は正規表現に変換
      const pattern = keyword.replace(/\*/g, '.*');
      const regex = new RegExp(pattern, 'i');
      if (regex.test(lowerContent)) return true;
    } else if (lowerContent.includes(keyword)) {
      // 単純な部分一致
      return true;
    }
  }
  
  return false;
}

// スパムメッセージを一括処理する関数
async function handleSpamMessages(message: Message, messageIds: string[], rule: Rule): Promise<void> {
  try {
    const channel = message.channel;
    
    // チャンネルがTextChannelであることを確認
    if (!channel.isTextBased() || channel.isDMBased()) {
      return;
    }
    
    // 削除するメッセージの総数
    const deleteCount = messageIds.length;
    
    // メッセージを一括削除する（14日以内のメッセージのみ）
    try {
      // Guild以外のチャンネルでは動作しない場合がある
      if (channel.type === ChannelType.GuildText) {
        // 一括削除（bulkDelete）は最大100件までで14日以内のメッセージのみ対象
        await channel.bulkDelete(messageIds, true);
        console.log(`スパム防止: ${deleteCount}件のメッセージを一括削除しました`);
      } else {
        // 一件ずつ削除（フォールバック）
        for (const id of messageIds) {
          try {
            const msg = await channel.messages.fetch(id);
            await msg.delete();
          } catch (err) {
            console.error(`メッセージ削除に失敗しました: ${id}`, err);
          }
        }
        console.log(`スパム防止: ${deleteCount}件のメッセージを個別削除しました`);
      }
      
      // 削除カウンターを更新
      await storage.incrementMessagesDeleted(deleteCount);
      
      // DMで通知
      try {
        await message.author.send(`連続して同じメッセージ「${message.content}」を${SPAM_THRESHOLD}回以上送信したため、${deleteCount}件のメッセージを全て削除しました。短時間に同じメッセージを連投するのは避けてください。`);
      } catch (dmError) {
        console.error('DMを送信できませんでした:', dmError);
      }
      
      // ログ記録
      await storage.createLog({
        userId: message.author.id,
        username: `${message.author.username}#${message.author.discriminator}`,
        action: rule.action,
        reason: rule.name,
        messageContent: `連続投稿（${deleteCount}件）: ${message.content}`
      });
      
    } catch (err) {
      console.error('一括削除に失敗しました:', err);
      // 通常の1件削除にフォールバック
      await applyModeration(message, rule);
    }
  } catch (error) {
    console.error('スパムメッセージ処理中にエラーが発生しました:', error);
  }
}

// Apply moderation action based on rule
async function applyModeration(message: Message, rule: Rule): Promise<void> {
  const action = rule.action;
  
  try {
    if (action.includes('メッセージ削除')) {
      await message.delete();
      await storage.incrementMessagesDeleted();
      
      // メッセージ削除の場合はDMに詳細を送信
      if (rule.name === "不適切な言葉") {
        const result = containsNgWord(message.content);
        if (result.found && result.word) {
          try {
            await message.author.send(`あなたのメッセージは「${result.word}」という禁止ワードを含んでいたため削除されました。`);
          } catch (dmError) {
            console.error('DMを送信できませんでした:', dmError);
          }
        }
      } else if (rule.name === "スパム防止") {
        try {
          await message.author.send(`連続して同じメッセージ「${message.content}」を${SPAM_THRESHOLD}回以上送信したため、メッセージを削除しました。短時間に同じメッセージを連投するのは避けてください。`);
        } catch (dmError) {
          console.error('DMを送信できませんでした:', dmError);
        }
      }
    }
    
    if (action.includes('警告')) {
      // 警告メッセージをDMに送信
      try {
        await message.author.send(`警告: ${rule.name} に違反するメッセージを送信しました。`);
      } catch (error) {
        console.error('DMを送信できませんでした:', error);
      }
      await storage.incrementWarningsIssued();
    }
    
    if (action.includes('ミュート')) {
      // Extract mute duration in minutes
      const durationMatch = action.match(/\((\d+)分\)/);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 10; // Default to 10 minutes
      
      const member = message.guild?.members.cache.get(message.author.id);
      if (member) {
        // Need a mute role or timeout permission
        try {
          await member.timeout(duration * 60 * 1000, `${rule.name}違反`);
        } catch (error) {
          console.error('Unable to mute member:', error);
          // ミュートできない場合はDMでエラーメッセージを送信
          try {
            await message.author.send(`ミュート処理に失敗しました。サーバー管理者に連絡してください。`);
          } catch (dmError) {
            console.error('DMを送信できませんでした:', dmError);
          }
        }
      }
    }
    
    // Log moderation action
    await storage.createLog({
      userId: message.author.id,
      username: `${message.author.username}#${message.author.discriminator}`,
      action: action,
      reason: rule.name,
      messageContent: message.content
    });
    
  } catch (error) {
    console.error('Error applying moderation action:', error);
  }
}

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

// When the client is ready
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});
