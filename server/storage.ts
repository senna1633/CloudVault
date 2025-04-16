import {
  users, type User, type InsertUser,
  folders, type Folder, type InsertFolder,
  files, type File, type InsertFile,
  type StorageStats
} from "@shared/schema";

// Interface for storage operations
import session from "express-session";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Folder operations
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFolderById(id: number): Promise<Folder | undefined>;
  getFoldersByParentId(parentId: number | null, userId: number): Promise<Folder[]>;
  updateFolder(id: number, data: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFileById(id: number): Promise<File | undefined>;
  getFilesByFolderId(folderId: number | null, userId: number): Promise<File[]>;
  getRecentFiles(userId: number, limit?: number): Promise<File[]>;
  getSharedFiles(userId: number): Promise<File[]>;
  updateFile(id: number, data: Partial<File>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  // Storage stats
  getStorageStats(userId: number): Promise<StorageStats>;

  // Session store
  sessionStore: session.Store;
}

import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private folders: Map<number, Folder>;
  private files: Map<number, File>;
  private userIdCounter: number;
  private folderIdCounter: number;
  private fileIdCounter: number;
  public sessionStore: session.Store;
  
  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.files = new Map();
    this.userIdCounter = 1;
    this.folderIdCounter = 1;
    this.fileIdCounter = 1;
    
    // Create memory session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with a demo user - will be replaced by registration
    this.createUser({
      username: "demo",
      password: "password"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Folder operations
  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.folderIdCounter++;
    const now = new Date();
    const folder: Folder = { 
      ...insertFolder, 
      id,
      createdAt: now
    };
    this.folders.set(id, folder);
    return folder;
  }
  
  async getFolderById(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }
  
  async getFoldersByParentId(parentId: number | null, userId: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      folder => folder.parentId === parentId && folder.userId === userId
    );
  }
  
  async updateFolder(id: number, data: Partial<Folder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder = { ...folder, ...data };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }
  
  async deleteFolder(id: number): Promise<boolean> {
    // Delete all files in this folder
    for (const file of Array.from(this.files.values())) {
      if (file.folderId === id) {
        this.files.delete(file.id);
      }
    }
    
    // Delete all subfolders recursively
    for (const folder of Array.from(this.folders.values())) {
      if (folder.parentId === id) {
        await this.deleteFolder(folder.id);
      }
    }
    
    return this.folders.delete(id);
  }
  
  // File operations
  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date().toISOString();
    const filePath = path.join(UPLOADS_DIR, `${id}-${insertFile.name}`);

    // Simulate file creation (in a real app, you'd save the file content here)
    fs.writeFileSync(filePath, "");

    const file: File = {
      ...insertFile,
      id,
      path: filePath,
      createdAt: now,
      updatedAt: now,
    };
    this.files.set(id, file);
    return file;
  }
  
  async getFileById(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }
  
  async getFilesByFolderId(folderId: number | null, userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.folderId === folderId && file.userId === userId
    );
  }
  
  async getRecentFiles(userId: number, limit: number = 8): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.userId === userId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, limit);
  }
  
  async getSharedFiles(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.userId === userId && file.isShared
    );
  }
  
  async updateFile(id: number, data: Partial<File>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { 
      ...file, 
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const file = this.files.get(id);
    if (!file) return false;

    // Delete the file from the local file system
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return this.files.delete(id);
  }
  
  // Storage stats
  async getStorageStats(userId: number): Promise<StorageStats> {
    const userFiles = Array.from(this.files.values()).filter(
      file => file.userId === userId
    );
    
    const usedSpace = userFiles.reduce((sum, file) => sum + file.size, 0);
    // Setting an extremely large storage limit (effectively unlimited for local usage)
    const totalSpace = 1024 * 1024 * 1024 * 1024 * 100; // 100TB in bytes
    const percentUsed = (usedSpace / totalSpace) * 100;
    
    return {
      usedSpace,
      totalSpace,
      percentUsed
    };
  }
}

export const storage = new MemStorage();
