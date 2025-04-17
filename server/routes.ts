import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertFolderSchema, insertFileSchema } from "@shared/schema";
import { log } from "./vite"; // Assuming a logging utility exists

// Extend Express namespace to include Multer types
declare global {
  namespace Express {
    interface User {
      id: number;
    }
    interface Request {
      user?: User;
      files?: { [fieldname: string]: Multer.File[]; } | Multer.File[] | undefined;
    }
  }
}

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "You must be logged in to access this resource" });
};

// Ensure `userId` is always a number
const getUserId = (req: Request): number => {
  if (!req.user || typeof req.user.id !== 'number') {
    throw new Error("Unauthorized: User not logged in");
  }
  return req.user.id;
};

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Fix Multer configuration types
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  })
});

const DEFAULT_USER_ID = 1; // Using the demo user

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication routes
  setupAuth(app);

  // Get storage stats
  app.get('/api/storage', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getStorageStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get storage stats" });
    }
  });

  // Folder routes
  app.get('/api/folders', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const parentId = req.query.parentId ? Number(req.query.parentId) : null;
      const folders = await storage.getFoldersByParentId(parentId, userId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  // Enhanced error handling for folder creation
  app.post('/api/folders', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not logged in" });
      }

      const validation = insertFolderSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validation.success) {
        log(`Validation error: ${JSON.stringify(validation.error.errors)}`, "api/folders");
        return res.status(400).json({ message: "Invalid folder data", errors: validation.error.errors });
      }

      const folder = await storage.createFolder(validation.data);
      res.status(201).json(folder);
    } catch (error) {
      const err = error as Error;
      log(`Error creating folder: ${err.message}`, "api/folders");
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.patch('/api/folders/:id', async (req: Request, res: Response) => {
    try {
      const folderId = Number(req.params.id);
      const folder = await storage.updateFolder(folderId, req.body);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  app.delete('/api/folders/:id', async (req: Request, res: Response) => {
    try {
      const folderId = Number(req.params.id);
      const success = await storage.deleteFolder(folderId);
      
      if (!success) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // File routes
  app.get('/api/files', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const folderId = req.query.folderId ? Number(req.query.folderId) : null;
      const files = await storage.getFilesByFolderId(folderId, userId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get('/api/files/recent', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const recentFiles = await storage.getRecentFiles(userId, limit);
      res.json(recentFiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent files" });
    }
  });

  app.get('/api/files/shared', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const sharedFiles = await storage.getSharedFiles(userId);
      res.json(sharedFiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared files" });
    }
  });

  // Enhanced error handling for file upload
  app.post('/api/upload', upload.array('files'), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not logged in" });
      }

      const uploadedFiles = req.files as Express.Multer.File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const folderId = req.body.folderId ? Number(req.body.folderId) : null;
      const savedFiles = [];

      for (const file of uploadedFiles) {
        const fileData = {
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          path: file.path,
          folderId,
          userId,
          isShared: 0,
          sharedBy: null
        };

        try {
          const savedFile = await storage.createFile(fileData);
          savedFiles.push(savedFile);
        } catch (err) {
          console.error(`Failed to save file ${file.originalname}:`, err);
          // Continue with next file
        }
      }

      if (savedFiles.length === 0) {
        return res.status(400).json({ message: "No files were successfully saved" });
      }

      res.status(201).json(savedFiles);
    } catch (error) {
      const err = error as Error;
      log(`Error uploading files: ${err.message}`, "api/upload");
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  app.get('/api/files/:id', async (req: Request, res: Response) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.patch('/api/files/:id', async (req: Request, res: Response) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.updateFile(fileId, req.body);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.delete('/api/files/:id', async (req: Request, res: Response) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Delete the physical file
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.error("Error deleting file:", err);
      }
      
      const success = await storage.deleteFile(fileId);
      if (!success) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.get('/api/download/:id', async (req: Request, res: Response) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      
      res.download(file.path, file.name);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  return httpServer;
}
