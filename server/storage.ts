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
import mime from "mime";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const FOLDERS_FILE = path.join(DATA_DIR, "folders.json");
const FILES_FILE = path.join(DATA_DIR, "files.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJsonFile<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

export class JsonStorage implements IStorage {
  protected users: User[];
  protected folders: Folder[];
  protected files: File[];
  public sessionStore: session.Store;

  constructor() {
    this.users = readJsonFile<User[]>(USERS_FILE);
    this.folders = readJsonFile<Folder[]>(FOLDERS_FILE);
    this.files = readJsonFile<File[]>(FILES_FILE);

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

  protected saveUsers() {
    writeJsonFile(USERS_FILE, this.users);
  }

  protected saveFolders() {
    writeJsonFile(FOLDERS_FILE, this.folders);
  }

  protected saveFiles() {
    writeJsonFile(FILES_FILE, this.files);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.users.length + 1;
    const user: User = { ...insertUser, id };
    this.users.push(user);
    this.saveUsers();
    return user;
  }

  // Folder operations
  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.folders.length + 1;
    const folder: Folder = {
      ...insertFolder,
      id,
      createdAt: new Date().toISOString(),
      color: insertFolder.color || "#0A84FF",
      parentId: insertFolder.parentId || null
    };
    this.folders.push(folder);
    this.saveFolders();
    return folder;
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    return this.folders.find(folder => folder.id === id);
  }

  async getFoldersByParentId(parentId: number | null, userId: number): Promise<Folder[]> {
    return this.folders.filter(folder => folder.parentId === parentId && folder.userId === userId);
  }

  async updateFolder(id: number, data: Partial<Folder>): Promise<Folder | undefined> {
    const folderIndex = this.folders.findIndex(folder => folder.id === id);
    if (folderIndex === -1) return undefined;

    const updatedFolder = { ...this.folders[folderIndex], ...data };
    this.folders[folderIndex] = updatedFolder;
    this.saveFolders();
    return updatedFolder;
  }

  async deleteFolder(id: number): Promise<boolean> {
    // Delete all files in this folder
    for (const file of this.files) {
      if (file.folderId === id) {
        this.files = this.files.filter(f => f.id !== file.id);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Delete all subfolders recursively
    for (const folder of this.folders) {
      if (folder.parentId === id) {
        await this.deleteFolder(folder.id);
      }
    }

    const folderIndex = this.folders.findIndex(folder => folder.id === id);
    if (folderIndex === -1) return false;

    this.folders.splice(folderIndex, 1);
    this.saveFolders();
    return true;
  }

  // File operations
  async createFile(insertFile: InsertFile): Promise<File> {
    const { name, size, type, userId, path, folderId = null } = insertFile;

    // Generate a new file ID
    const id = this.files.length + 1;

    // Create the file record
    const file: File = {
      id,
      name,
      size,
      type,
      path,
      userId,
      folderId,
      isShared: 0,
      sharedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to the files array and save
    this.files.push(file);
    this.saveFiles();

    return file;
  }

  async getFileById(id: number): Promise<File | undefined> {
    return this.files.find(file => file.id === id);
  }

  async getFilesByFolderId(folderId: number | null, userId: number): Promise<File[]> {
    return this.files.filter(file => file.folderId === folderId && file.userId === userId);
  }

  async getRecentFiles(userId: number, limit: number = 8): Promise<File[]> {
    return this.files
      .filter(file => file.userId === userId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, limit);
  }

  async getSharedFiles(userId: number): Promise<File[]> {
    return this.files.filter(file => file.userId === userId && file.isShared);
  }

  async updateFile(id: number, data: Partial<File>): Promise<File | undefined> {
    const fileIndex = this.files.findIndex(file => file.id === id);
    if (fileIndex === -1) return undefined;

    const updatedFile = {
      ...this.files[fileIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.files[fileIndex] = updatedFile;
    this.saveFiles();
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const fileIndex = this.files.findIndex(file => file.id === id);
    if (fileIndex === -1) return false;

    const [file] = this.files.splice(fileIndex, 1);
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    this.saveFiles();
    return true;
  }

  // Storage stats
  async getStorageStats(userId: number): Promise<StorageStats> {
    const userFiles = this.files.filter(file => file.userId === userId);

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf", "text/plain"];

export class EnhancedJsonStorage extends JsonStorage {
  async createFile(insertFile: InsertFile): Promise<File> {
    const { name, size, type, userId, folderId = null } = insertFile;

    // Validate file size
    if (size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(type)) {
      throw new Error(`Unsupported file type: ${type}. Allowed types are: ${ALLOWED_MIME_TYPES.join(", ")}`);
    }

    // Ensure user directory exists
    const userDir = path.join(UPLOADS_DIR, `user_${userId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Ensure folder directory exists
    const folderDir = folderId ? path.join(userDir, `folder_${folderId}`) : userDir;
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }

    // Generate unique file path
    const fileExtension = path.extname(name);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(folderDir, uniqueFileName);

    // Create the file record with all required fields
    const file: File = {
      id: this.files.length + 1,
      name,
      type,
      size,
      path: filePath,
      userId,
      folderId,
      isShared: 0,
      sharedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to the files array and save
    this.files.push(file);
    this.saveFiles();
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    const fileIndex = this.files.findIndex(file => file.id === id);
    if (fileIndex === -1) return false;

    const [file] = this.files.splice(fileIndex, 1);

    // Delete the physical file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error(`Failed to delete file at ${file.path}:`, error);
    }

    this.saveFiles();
    return true;
  }

  async cleanUpOrphanedFiles(): Promise<void> {
    const allFilePaths = this.files.map(file => file.path);

    // Iterate through user directories
    const userDirs = fs.readdirSync(UPLOADS_DIR);
    for (const userDir of userDirs) {
      const userPath = path.join(UPLOADS_DIR, userDir);
      if (!fs.statSync(userPath).isDirectory()) continue;

      const files = fs.readdirSync(userPath);
      for (const file of files) {
        const filePath = path.join(userPath, file);
        if (!allFilePaths.includes(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted orphaned file: ${filePath}`);
          } catch (error) {
            console.error(`Failed to delete orphaned file: ${filePath}`, error);
          }
        }
      }
    }
  }
}

export const storage = new JsonStorage();
