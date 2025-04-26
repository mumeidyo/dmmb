import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertRuleSchema, insertBotSettingsSchema } from "@shared/schema";
import { initBot, client } from "./bot";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize Discord bot
  await initBot();
  
  // API routes
  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Get all rules
  app.get("/api/rules", async (req, res) => {
    try {
      const rules = await storage.getRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rules" });
    }
  });
  
  // Get a single rule
  app.get("/api/rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rule ID" });
      }
      
      const rule = await storage.getRuleById(id);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rule" });
    }
  });
  
  // Create a new rule
  app.post("/api/rules", async (req, res) => {
    try {
      const validatedData = insertRuleSchema.parse(req.body);
      const newRule = await storage.createRule(validatedData);
      res.status(201).json(newRule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rule" });
    }
  });
  
  // Update a rule
  app.patch("/api/rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rule ID" });
      }
      
      const validatedData = insertRuleSchema.partial().parse(req.body);
      const updatedRule = await storage.updateRule(id, validatedData);
      
      if (!updatedRule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json(updatedRule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update rule" });
    }
  });
  
  // Delete a rule
  app.delete("/api/rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rule ID" });
      }
      
      const success = await storage.deleteRule(id);
      
      if (!success) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });
  
  // Get logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });
  
  // Get bot settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      res.json(settings || { token: "", prefix: "!", status: "online" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot settings" });
    }
  });
  
  // Update bot settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const validatedData = insertBotSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateBotSettings(validatedData);
      
      // If token is updated, reconnect the bot
      if (validatedData.token && client.token !== validatedData.token) {
        await client.destroy();
        await initBot();
      }
      
      // If prefix is updated, update it in the bot
      if (validatedData.prefix) {
        // The prefix is retrieved from storage in commands.ts
      }
      
      // If status is updated, update it in the bot
      if (validatedData.status && client.isReady()) {
        if (validatedData.status === 'online') {
          client.user?.setStatus('online');
        } else if (validatedData.status === 'idle') {
          client.user?.setStatus('idle');
        } else if (validatedData.status === 'dnd') {
          client.user?.setStatus('dnd');
        }
      }
      
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bot settings" });
    }
  });
  
  // Get bot status
  app.get("/api/status", async (req, res) => {
    try {
      const isOnline = client.isReady();
      const status = {
        online: isOnline,
        lastUpdated: new Date().toISOString()
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot status" });
    }
  });

  return httpServer;
}
