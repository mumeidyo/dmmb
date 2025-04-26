import { Message, PermissionFlagsBits } from 'discord.js';
import { storage } from './storage';

// Command handler function
export async function handleCommand(message: Message, prefix: string): Promise<void> {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  
  // Check permissions - only allow moderators and admins
  const member = message.member;
  if (!member) return;
  
  const hasPermission = 
    member.permissions.has(PermissionFlagsBits.Administrator) || 
    member.permissions.has(PermissionFlagsBits.ModerateMembers);
  
  // Basic commands (help) available to all
  if (command === 'help') {
    await handleHelp(message);
    return;
  }
  
  // Admin-only commands
  if (!hasPermission) {
    await message.reply('このコマンドを使用する権限がありません。');
    return;
  }
  
  // Handle different commands
  switch (command) {
    case 'delete':
      await handleDelete(message, args);
      break;
    case 'warn':
      await handleWarn(message, args);
      break;
    case 'rule':
      await handleRule(message, args);
      break;
    case 'ban':
      await handleBan(message, args);
      break;
    default:
      await message.reply(`未知のコマンドです。${prefix}help で利用可能なコマンドを確認してください。`);
  }
}

// Help command
async function handleHelp(message: Message): Promise<void> {
  const helpEmbed = {
    color: 0x5865F2, // Discord blurple
    title: '言論統制Bot - コマンド一覧',
    description: '以下のコマンドが利用できます：',
    fields: [
      {
        name: '!help',
        value: '利用可能なコマンドの一覧を表示します',
      },
      {
        name: '!delete [数]',
        value: '指定した数のメッセージを削除します（モデレーター権限が必要）',
      },
      {
        name: '!warn [@ユーザー] [理由]',
        value: '指定したユーザーに警告を送信します（モデレーター権限が必要）',
      },
      {
        name: '!rule [add/remove/list]',
        value: 'モデレーションルールを管理します（モデレーター権限が必要）',
      },
      {
        name: '!ban [@ユーザー] [理由]',
        value: '指定したユーザーをサーバーからBANします（管理者権限が必要）',
      },
    ],
    footer: {
      text: '言論統制Bot',
    },
  };
  
  await message.channel.send({ embeds: [helpEmbed] });
}

// Delete messages command
async function handleDelete(message: Message, args: string[]): Promise<void> {
  // Check if number of messages specified
  if (!args[0] || isNaN(parseInt(args[0]))) {
    await message.reply('削除するメッセージの数を指定してください。例：`!delete 5`');
    return;
  }
  
  // Parse number of messages to delete
  const amount = parseInt(args[0]);
  
  // Limit to 100 messages at a time
  if (amount <= 0 || amount > 100) {
    await message.reply('1から100の間の数を指定してください。');
    return;
  }
  
  try {
    // Delete command message first
    await message.delete();
    
    // Delete specified number of messages
    const fetched = await message.channel.messages.fetch({ limit: amount });
    await message.channel.bulkDelete(fetched, true);
    
    // Send confirmation message that deletes itself after 5 seconds
    const confirmMsg = await message.channel.send(`${amount}件のメッセージを削除しました。`);
    setTimeout(() => confirmMsg.delete().catch(err => console.error('Error deleting confirmation message:', err)), 5000);
    
    // Increment messages deleted counter
    await storage.incrementMessagesDeleted(amount);
    
    // Log the action
    await storage.createLog({
      userId: message.author.id,
      username: `${message.author.username}#${message.author.discriminator}`,
      action: 'メッセージ削除',
      reason: `コマンド実行 (!delete ${amount})`,
      messageContent: `${amount}件のメッセージを削除`
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    await message.channel.send('メッセージの削除中にエラーが発生しました。');
  }
}

// Warn user command
async function handleWarn(message: Message, args: string[]): Promise<void> {
  // Check if user is mentioned
  if (!message.mentions.users.size) {
    await message.reply('警告するユーザーをメンションしてください。例：`!warn @ユーザー 理由`');
    return;
  }
  
  const target = message.mentions.users.first();
  
  // Remove the mention from args and join the rest as reason
  args.shift();
  const reason = args.join(' ') || '理由は指定されていません';
  
  if (!target) return;
  
  try {
    // Send warning to the channel
    await message.channel.send(`<@${target.id}> 警告: ${reason}`);
    
    // Increment warnings issued counter
    await storage.incrementWarningsIssued();
    
    // Log the action
    await storage.createLog({
      userId: target.id,
      username: `${target.username}#${target.discriminator}`,
      action: '警告',
      reason: reason,
      messageContent: `コマンドによる警告`
    });
    
    // Send confirmation to moderator
    await message.reply(`ユーザー ${target.username} に警告を送信しました。`);
  } catch (error) {
    console.error('Error warning user:', error);
    await message.channel.send('ユーザーへの警告中にエラーが発生しました。');
  }
}

// Rule management command
async function handleRule(message: Message, args: string[]): Promise<void> {
  if (!args[0]) {
    await message.reply('アクションを指定してください。例：`!rule list`, `!rule add`, `!rule remove`');
    return;
  }
  
  const action = args[0].toLowerCase();
  
  switch (action) {
    case 'list':
      await listRules(message);
      break;
    case 'add':
      // Format: !rule add "Rule Name" "keywords,with,commas" "Action to take"
      if (args.length < 4) {
        await message.reply('ルールの追加形式: `!rule add "ルール名" "キーワード,カンマ区切り" "実行するアクション"`');
        return;
      }
      
      const matches = message.content.match(/"([^"]*)"/g);
      if (!matches || matches.length < 3) {
        await message.reply('ルールの追加形式: `!rule add "ルール名" "キーワード,カンマ区切り" "実行するアクション"`');
        return;
      }
      
      // Remove quotes and extract values
      const name = matches[0].replace(/"/g, '');
      const keywords = matches[1].replace(/"/g, '');
      const ruleAction = matches[2].replace(/"/g, '');
      
      await addRule(message, name, keywords, ruleAction);
      break;
    case 'remove':
      if (!args[1] || isNaN(parseInt(args[1]))) {
        await message.reply('削除するルールのIDを指定してください。例：`!rule remove 1`');
        return;
      }
      
      const ruleId = parseInt(args[1]);
      await removeRule(message, ruleId);
      break;
    default:
      await message.reply('有効なアクションを指定してください：`list`, `add`, `remove`');
  }
}

// List all rules
async function listRules(message: Message): Promise<void> {
  try {
    const rules = await storage.getRules();
    
    if (rules.length === 0) {
      await message.reply('ルールが設定されていません。');
      return;
    }
    
    let description = '現在のモデレーションルール：\n\n';
    
    rules.forEach(rule => {
      const status = rule.enabled ? '✅ 有効' : '❌ 無効';
      description += `**ID ${rule.id}: ${rule.name}**\n`;
      description += `キーワード: ${rule.keywords}\n`;
      description += `アクション: ${rule.action}\n`;
      description += `状態: ${status}\n\n`;
    });
    
    const rulesEmbed = {
      color: 0x5865F2,
      title: 'モデレーションルール一覧',
      description: description,
      footer: {
        text: '言論統制Bot',
      },
    };
    
    await message.channel.send({ embeds: [rulesEmbed] });
  } catch (error) {
    console.error('Error listing rules:', error);
    await message.channel.send('ルールの取得中にエラーが発生しました。');
  }
}

// Add a new rule
async function addRule(message: Message, name: string, keywords: string, action: string): Promise<void> {
  try {
    const newRule = await storage.createRule({
      name,
      keywords,
      action,
      enabled: true
    });
    
    await message.reply(`ルール "${newRule.name}" (ID: ${newRule.id}) を追加しました。`);
  } catch (error) {
    console.error('Error adding rule:', error);
    await message.channel.send('ルールの追加中にエラーが発生しました。');
  }
}

// Remove a rule
async function removeRule(message: Message, ruleId: number): Promise<void> {
  try {
    const rule = await storage.getRuleById(ruleId);
    
    if (!rule) {
      await message.reply(`ID ${ruleId} のルールは見つかりませんでした。`);
      return;
    }
    
    const success = await storage.deleteRule(ruleId);
    
    if (success) {
      await message.reply(`ルール "${rule.name}" (ID: ${ruleId}) を削除しました。`);
    } else {
      await message.reply(`ルールの削除に失敗しました。`);
    }
  } catch (error) {
    console.error('Error removing rule:', error);
    await message.channel.send('ルールの削除中にエラーが発生しました。');
  }
}

// Ban user command
async function handleBan(message: Message, args: string[]): Promise<void> {
  // Check if user is mentioned
  if (!message.mentions.users.size) {
    await message.reply('BANするユーザーをメンションしてください。例：`!ban @ユーザー 理由`');
    return;
  }
  
  // Check if the user has administrator permission
  const member = message.member;
  if (!member || !member.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply('このコマンドは管理者のみが使用できます。');
    return;
  }
  
  const target = message.mentions.users.first();
  if (!target) return;
  
  // Remove the mention from args and join the rest as reason
  args.shift();
  const reason = args.join(' ') || '理由は指定されていません';
  
  try {
    // Try to send DM to user before banning
    try {
      await target.send(`あなたは "${message.guild?.name}" サーバーからBANされました。理由: ${reason}`);
    } catch (dmError) {
      console.error('DMを送信できませんでした:', dmError);
    }
    
    // Ban the user from the guild
    if (message.guild) {
      await message.guild.members.ban(target, { reason });
      
      // Log the action
      await storage.createLog({
        userId: target.id,
        username: `${target.username}#${target.discriminator}`,
        action: 'BAN',
        reason: reason,
        messageContent: `コマンドによるBAN (!ban)`
      });
      
      // Send confirmation to moderator (privately via DM)
      try {
        await message.author.send(`ユーザー ${target.username} をサーバーからBANしました。理由: ${reason}`);
      } catch (dmError) {
        console.error('モデレーターへのDM送信に失敗:', dmError);
        // If DM fails, send a temporary message in the channel
        const confirmMsg = await message.channel.send(`ユーザー ${target.username} をサーバーからBANしました。`);
        setTimeout(() => confirmMsg.delete().catch(err => console.error('確認メッセージの削除に失敗:', err)), 5000);
      }
      
      // Delete the command message to keep the channel clean
      await message.delete().catch(err => console.error('コマンドメッセージの削除に失敗:', err));
    } else {
      await message.reply('このコマンドはサーバー内でのみ使用できます。');
    }
  } catch (error) {
    console.error('Error banning user:', error);
    await message.reply('ユーザーのBAN処理中にエラーが発生しました。必要な権限があるか確認してください。');
  }
}
