import { 
  type User, 
  type InsertUser, 
  type Project, 
  type InsertProject,
  type SiteArea,
  type InsertSiteArea,
  type SiteSubarea,
  type InsertSiteSubarea,
  type ActivityCategory,
  type InsertActivityCategory,
  type Activity,
  type InsertActivity,
  type BoqItem,
  type InsertBoqItem
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createProject(project: InsertProject & { userId: string }): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  
  createSiteArea(area: InsertSiteArea): Promise<SiteArea>;
  getSiteAreasByProjectId(projectId: string): Promise<SiteArea[]>;
  updateSiteArea(id: string, updates: Partial<SiteArea>): Promise<SiteArea | undefined>;
  
  createSiteSubarea(subarea: InsertSiteSubarea): Promise<SiteSubarea>;
  getSiteSubareasByAreaId(areaId: string): Promise<SiteSubarea[]>;
  updateSiteSubarea(id: string, updates: Partial<SiteSubarea>): Promise<SiteSubarea | undefined>;
  
  createActivityCategory(category: InsertActivityCategory): Promise<ActivityCategory>;
  getActivityCategoriesByProjectId(projectId: string): Promise<ActivityCategory[]>;
  updateActivityCategory(id: string, updates: Partial<ActivityCategory>): Promise<ActivityCategory | undefined>;
  
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByCategoryId(categoryId: string): Promise<Activity[]>;
  updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;
  
  createBoqItem(item: InsertBoqItem): Promise<BoqItem>;
  getBoqItemsByProjectId(projectId: string): Promise<BoqItem[]>;
  updateBoqItem(id: string, updates: Partial<BoqItem>): Promise<BoqItem | undefined>;
  deleteBoqItem(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private siteAreas: Map<string, SiteArea>;
  private siteSubareas: Map<string, SiteSubarea>;
  private activityCategories: Map<string, ActivityCategory>;
  private activities: Map<string, Activity>;
  private boqItems: Map<string, BoqItem>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.siteAreas = new Map();
    this.siteSubareas = new Map();
    this.activityCategories = new Map();
    this.activities = new Map();
    this.boqItems = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createProject(project: InsertProject & { userId: string }): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const newProject: Project = { 
      ...project, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async createSiteArea(area: InsertSiteArea): Promise<SiteArea> {
    const id = randomUUID();
    const newArea: SiteArea = { ...area, id, createdAt: new Date() };
    this.siteAreas.set(id, newArea);
    return newArea;
  }

  async getSiteAreasByProjectId(projectId: string): Promise<SiteArea[]> {
    return Array.from(this.siteAreas.values()).filter(a => a.projectId === projectId);
  }

  async updateSiteArea(id: string, updates: Partial<SiteArea>): Promise<SiteArea | undefined> {
    const area = this.siteAreas.get(id);
    if (!area) return undefined;
    
    const updatedArea = { ...area, ...updates };
    this.siteAreas.set(id, updatedArea);
    return updatedArea;
  }

  async createSiteSubarea(subarea: InsertSiteSubarea): Promise<SiteSubarea> {
    const id = randomUUID();
    const newSubarea: SiteSubarea = { ...subarea, id, createdAt: new Date() };
    this.siteSubareas.set(id, newSubarea);
    return newSubarea;
  }

  async getSiteSubareasByAreaId(areaId: string): Promise<SiteSubarea[]> {
    return Array.from(this.siteSubareas.values()).filter(s => s.areaId === areaId);
  }

  async updateSiteSubarea(id: string, updates: Partial<SiteSubarea>): Promise<SiteSubarea | undefined> {
    const subarea = this.siteSubareas.get(id);
    if (!subarea) return undefined;
    
    const updatedSubarea = { ...subarea, ...updates };
    this.siteSubareas.set(id, updatedSubarea);
    return updatedSubarea;
  }

  async createActivityCategory(category: InsertActivityCategory): Promise<ActivityCategory> {
    const id = randomUUID();
    const newCategory: ActivityCategory = { ...category, id, createdAt: new Date() };
    this.activityCategories.set(id, newCategory);
    return newCategory;
  }

  async getActivityCategoriesByProjectId(projectId: string): Promise<ActivityCategory[]> {
    return Array.from(this.activityCategories.values()).filter(c => c.projectId === projectId);
  }

  async updateActivityCategory(id: string, updates: Partial<ActivityCategory>): Promise<ActivityCategory | undefined> {
    const category = this.activityCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updates };
    this.activityCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const newActivity: Activity = { ...activity, id, createdAt: new Date() };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async getActivitiesByCategoryId(categoryId: string): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(a => a.categoryId === categoryId);
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity = { ...activity, ...updates };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return this.activities.delete(id);
  }

  async createBoqItem(item: InsertBoqItem): Promise<BoqItem> {
    const id = randomUUID();
    const newItem: BoqItem = { ...item, id, createdAt: new Date() };
    this.boqItems.set(id, newItem);
    return newItem;
  }

  async getBoqItemsByProjectId(projectId: string): Promise<BoqItem[]> {
    return Array.from(this.boqItems.values()).filter(b => b.projectId === projectId);
  }

  async updateBoqItem(id: string, updates: Partial<BoqItem>): Promise<BoqItem | undefined> {
    const item = this.boqItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.boqItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteBoqItem(id: string): Promise<boolean> {
    return this.boqItems.delete(id);
  }
}

export const storage = new MemStorage();
