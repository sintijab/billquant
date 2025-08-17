import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertSiteAreaSchema, insertSiteSubareaSchema, insertActivityCategorySchema, insertActivitySchema, insertBoqItemSchema } from "@shared/schema";
import { apiRequest } from "../client/src/lib/queryClient";

export async function registerRoutes(app: Express): Promise<Server> {
  // Project routes
  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      // For demo purposes, using a mock user ID
      const project = await storage.createProject({ ...projectData, userId: "demo-user" });
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid project data" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const updates = req.body;
      const project = await storage.updateProject(req.params.id, updates);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Site area routes
  app.post("/api/projects/:projectId/areas", async (req, res) => {
    try {
      const areaData = insertSiteAreaSchema.parse({ ...req.body, projectId: req.params.projectId });
      const area = await storage.createSiteArea(areaData);
      res.json(area);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid area data" });
    }
  });

  app.get("/api/projects/:projectId/areas", async (req, res) => {
    try {
      const areas = await storage.getSiteAreasByProjectId(req.params.projectId);
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch areas" });
    }
  });

  // Site subarea routes
  app.post("/api/areas/:areaId/subareas", async (req, res) => {
    try {
      const subareaData = insertSiteSubareaSchema.parse({ ...req.body, areaId: req.params.areaId });
      const subarea = await storage.createSiteSubarea(subareaData);
      res.json(subarea);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid subarea data" });
    }
  });

  app.get("/api/areas/:areaId/subareas", async (req, res) => {
    try {
      const subareas = await storage.getSiteSubareasByAreaId(req.params.areaId);
      res.json(subareas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subareas" });
    }
  });

  // Activity category routes
  app.post("/api/projects/:projectId/categories", async (req, res) => {
    try {
      const categoryData = insertActivityCategorySchema.parse({ ...req.body, projectId: req.params.projectId });
      const category = await storage.createActivityCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid category data" });
    }
  });

  app.get("/api/projects/:projectId/categories", async (req, res) => {
    try {
      const categories = await storage.getActivityCategoriesByProjectId(req.params.projectId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Activity routes
  app.post("/api/categories/:categoryId/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse({ ...req.body, categoryId: req.params.categoryId });
      const activity = await storage.createActivity(activityData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid activity data" });
    }
  });

  app.get("/api/categories/:categoryId/activities", async (req, res) => {
    try {
      const activities = await storage.getActivitiesByCategoryId(req.params.categoryId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const success = await storage.deleteActivity(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // BOQ item routes
  app.post("/api/projects/:projectId/boq-items", async (req, res) => {
    try {
      const boqData = insertBoqItemSchema.parse({ ...req.body, projectId: req.params.projectId });
      const boqItem = await storage.createBoqItem(boqData);
      res.json(boqItem);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid BOQ item data" });
    }
  });

  app.get("/api/projects/:projectId/boq-items", async (req, res) => {
    try {
      const boqItems = await storage.getBoqItemsByProjectId(req.params.projectId);
      res.json(boqItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch BOQ items" });
    }
  });

  app.delete("/api/boq-items/:id", async (req, res) => {
    try {
      const success = await storage.deleteBoqItem(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "BOQ item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete BOQ item" });
    }
  });

  // AI analysis endpoints (mock for now)
  app.post("/api/ai/analyze-site-visit", async (req, res) => {
    try {
      // Mock AI analysis response
      const mockActivities = [
        {
          categoryName: "Demolizioni e Rimozioni",
          icon: "hammer",
          activities: [
            { description: "Rimozione pavimento in legno esistente", location: "Soggiorno", quantity: "27.3", unit: "m²" },
            { description: "Demolizione cucina esistente", location: "Cucina", quantity: "14.0", unit: "m²" }
          ]
        },
        {
          categoryName: "Impianti Elettrici",
          icon: "tools",
          activities: [
            { description: "Prese elettriche standard", location: "Soggiorno", quantity: "8", unit: "pz" },
            { description: "Punti luce a soffitto", location: "Cucina", quantity: "4", unit: "pz" }
          ]
        }
      ];
      
      res.json(mockActivities);
    } catch (error) {
      res.status(500).json({ message: "AI analysis failed" });
    }
  });

  app.post("/api/ai/generate-boq", async (req, res) => {
    try {
      // Mock BOQ generation response
      const mockBoqItems = [
        {
          code: "B.02.10.0010.007",
          description: "Demolizione di fabbricati volumetria ≤ 5000 m³",
          quantity: "35.0",
          unit: "m³",
          unitPrice: "11.87",
          total: "415.45",
          priceSource: "PAT 2025"
        },
        {
          code: "E.02.15.0025.003",
          description: "Rimozione pavimento in legno esistente",
          quantity: "27.3",
          unit: "m²",
          unitPrice: "8.50",
          total: "232.05",
          priceSource: "DEI 2025"
        }
      ];
      
      res.json(mockBoqItems);
    } catch (error) {
      res.status(500).json({ message: "BOQ generation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
