import { 
  users, type User, type InsertUser,
  rules, type Rule, type InsertRule,
  moderationLogs, type ModerationLog, type InsertModerationLog,
  stats, type Stats,
  botSettings, type BotSettings, type InsertBotSettings
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Rule methods
  getRules(): Promise<Rule[]>;
  getRuleById(id: number): Promise<Rule | undefined>;
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: number, rule: Partial<InsertRule>): Promise<Rule | undefined>;
  deleteRule(id: number): Promise<boolean>;
  
  // Moderation log methods
  getLogs(limit?: number): Promise<ModerationLog[]>;
  createLog(log: InsertModerationLog): Promise<ModerationLog>;
  
  // Stats methods
  getStats(): Promise<Stats>;
  incrementMessagesMonitored(count?: number): Promise<Stats>;
  incrementMessagesDeleted(count?: number): Promise<Stats>;
  incrementWarningsIssued(count?: number): Promise<Stats>;
  
  // Bot settings methods
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rulesMap: Map<number, Rule>;
  private logsArray: ModerationLog[];
  private statsObj: Stats;
  private botSettingsObj: BotSettings | undefined;
  
  private userCurrentId: number;
  private ruleCurrentId: number;
  private logCurrentId: number;
  
  constructor() {
    this.users = new Map();
    this.rulesMap = new Map();
    this.logsArray = [];
    this.statsObj = {
      id: 1,
      messagesMonitored: 0,
      messagesDeleted: 0,
      warningsIssued: 0,
      lastUpdated: new Date()
    };
    
    this.userCurrentId = 1;
    this.ruleCurrentId = 1;
    this.logCurrentId = 1;
    
    // Initialize with some default rules
    this.createRule({
      name: "不適切な言葉",
      keywords: "***,***,***",
      action: "メッセージ削除 + 警告",
      enabled: true
    });
    
    this.createRule({
      name: "スパム防止",
      keywords: "同一メッセージ（5回以上）",
      action: "メッセージ削除",
      enabled: true
    });
    
    this.createRule({
      name: "宣伝リンク",
      keywords: "discord.gg/*,invite/*",
      action: "メッセージ削除 + ミュート（10分）",
      enabled: true
    });
    
    this.createRule({
      name: "過度な大文字",
      keywords: "大文字70%以上",
      action: "警告",
      enabled: false
    });
    
    // Add some sample logs
    this.createLog({
      userId: "123456789",
      username: "ユーザー#1234",
      action: "メッセージ削除",
      reason: "不適切な言葉",
      messageContent: "削除されたメッセージ"
    });
    
    this.createLog({
      userId: "987654321",
      username: "サーバー民#5678",
      action: "警告",
      reason: "スパム送信",
      messageContent: "スパムメッセージ"
    });
    
    this.createLog({
      userId: "456789123",
      username: "新規さん#9012",
      action: "ミュート (10分)",
      reason: "招待リンク共有",
      messageContent: "discord.gg/abcdef"
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Rule methods
  async getRules(): Promise<Rule[]> {
    return Array.from(this.rulesMap.values());
  }
  
  async getRuleById(id: number): Promise<Rule | undefined> {
    return this.rulesMap.get(id);
  }
  
  async createRule(insertRule: InsertRule): Promise<Rule> {
    const id = this.ruleCurrentId++;
    const rule: Rule = { 
      ...insertRule, 
      id,
      enabled: insertRule.enabled ?? true
    };
    this.rulesMap.set(id, rule);
    return rule;
  }
  
  async updateRule(id: number, updateData: Partial<InsertRule>): Promise<Rule | undefined> {
    const existingRule = this.rulesMap.get(id);
    if (!existingRule) return undefined;
    
    const updatedRule = { ...existingRule, ...updateData };
    this.rulesMap.set(id, updatedRule);
    return updatedRule;
  }
  
  async deleteRule(id: number): Promise<boolean> {
    return this.rulesMap.delete(id);
  }
  
  // Moderation log methods
  async getLogs(limit?: number): Promise<ModerationLog[]> {
    const sortedLogs = [...this.logsArray].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sortedLogs.slice(0, limit) : sortedLogs;
  }
  
  async createLog(insertLog: InsertModerationLog): Promise<ModerationLog> {
    const id = this.logCurrentId++;
    const log: ModerationLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
      messageContent: insertLog.messageContent || null
    };
    
    this.logsArray.push(log);
    return log;
  }
  
  // Stats methods
  async getStats(): Promise<Stats> {
    return { ...this.statsObj, lastUpdated: new Date() };
  }
  
  async incrementMessagesMonitored(count: number = 1): Promise<Stats> {
    this.statsObj.messagesMonitored += count;
    this.statsObj.lastUpdated = new Date();
    return this.statsObj;
  }
  
  async incrementMessagesDeleted(count: number = 1): Promise<Stats> {
    this.statsObj.messagesDeleted += count;
    this.statsObj.lastUpdated = new Date();
    return this.statsObj;
  }
  
  async incrementWarningsIssued(count: number = 1): Promise<Stats> {
    this.statsObj.warningsIssued += count;
    this.statsObj.lastUpdated = new Date();
    return this.statsObj;
  }
  
  // Bot settings methods
  async getBotSettings(): Promise<BotSettings | undefined> {
    return this.botSettingsObj;
  }
  
  async updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    if (!this.botSettingsObj) {
      this.botSettingsObj = {
        id: 1,
        token: settings.token || "",
        prefix: settings.prefix || "!",
        status: settings.status || "online"
      };
    } else {
      this.botSettingsObj = { ...this.botSettingsObj, ...settings };
    }
    
    return this.botSettingsObj;
  }
}

export const storage = new MemStorage();
