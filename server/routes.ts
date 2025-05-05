import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import { createServer, type Server } from "http";
import { storage } from "./storage"; // Assuming storage is exported correctly from your storage file
import { setupAuth } from "./auth"; // Assuming setupAuth exists and works
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertFolderSchema } from "@shared/schema"; // Assuming insertFileSchema is also in @shared/schema
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
  if (req.isAuthenticated() && req.user && typeof req.user.id === 'number') {
    return next();
  }
  // Use 401 for not authenticated
  res.status(401).json({ message: "You must be logged in to access this resource" });
};

// Helper to safely get user ID and enforce authentication
const getUserId = (req: Request): number => {
  // isAuthenticated middleware should ensure req.user and req.user.id are set correctly
  if (!req.user || typeof req.user.id !== 'number') {
    // This should ideally not be reached if isAuthenticated is used properly
    throw new Error("Authentication failed: User ID not found");
  }
  return req.user.id;
};

// Ensure uploads directory exists - Keep this as is
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer configuration - Keep this as is
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR, // Note: EnhancedJsonStorage uses subdirectories, consider aligning this
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication routes (assuming these are handled elsewhere)
  setupAuth(app);

  // --- Secured API Routes ---

  // Get storage stats - Requires authentication
  app.get('/api/storage', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      const stats = await storage.getStorageStats(userId);
      res.json(stats);
    } catch (error) {
      // Log the actual error on the server side
      console.error("Error getting storage stats:", error);
      res.status(500).json({ message: "Failed to get storage stats" });
    }
  });

  // Folder routes - Require authentication
  app.get('/api/folders', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      const parentId = req.query.parentId ? Number(req.query.parentId) : null;
      // The storage method already filters by userId
      const folders = await storage.getFoldersByParentId(parentId, userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  // Create folder - Requires authentication and validates input
  app.post('/api/folders', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper

      const validation = insertFolderSchema.safeParse({
        ...req.body,
        userId, // Ensure the folder is created with the logged-in user's ID
      });

      if (!validation.success) {
        log(`Validation error creating folder: ${JSON.stringify(validation.error.errors)}`, "api/folders");
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

  // Update folder - Requires authentication and ownership check
  app.patch('/api/folders/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Get logged-in user ID
      const folderId = Number(req.params.id);

      // Fetch the folder to check ownership
      const folder = await storage.getFolderById(folderId);

      // Check if folder exists and belongs to the user
      if (!folder || folder.userId !== userId) {
        // Return 404 Not Found for security (doesn't reveal if folder exists but isn't theirs)
        return res.status(404).json({ message: "Folder not found" });
      }

      // Proceed with update if ownership is confirmed
      // It's also good practice to ensure the update data doesn't try to change the userId or id
      const updateData = { ...req.body };
      delete updateData.userId; // Prevent changing ownership via update
      delete updateData.id; // Prevent changing id via update


      const updatedFolder = await storage.updateFolder(folderId, updateData);

      // The updatedFolder should be the same as the original folder we fetched, but update for safety
      if (!updatedFolder) {
        // Should not happen if getFolderById succeeded, but good fallback
        return res.status(404).json({ message: "Folder not found after update attempt" });
      }

      res.json(updatedFolder);
    } catch (error) {
      console.error("Error updating folder:", error);
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  // Delete folder - Requires authentication and ownership check
  app.delete('/api/folders/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Get logged-in user ID
      const folderId = Number(req.params.id);

      // Fetch the folder to check ownership
      const folder = await storage.getFolderById(folderId);

      // Check if folder exists and belongs to the user
      if (!folder || folder.userId !== userId) {
        // Return 404 Not Found for security
        return res.status(404).json({ message: "Folder not found" });
      }

      // Proceed with deletion if ownership is confirmed
      const success = await storage.deleteFolder(folderId);

      if (!success) {
        // Should not happen if getFolderById succeeded, but good fallback
        return res.status(500).json({ message: "Failed to delete folder" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // File routes - Require authentication
  app.get('/api/files', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      const folderId = req.query.folderId ? Number(req.query.folderId) : null;
      // The storage method already filters by userId and folderId
      const files = await storage.getFilesByFolderId(folderId, userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Recent files - Requires authentication
  app.get('/api/files/recent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      // The storage method already filters by userId
      const recentFiles = await storage.getRecentFiles(userId, limit);
      res.json(recentFiles);
    } catch (error) {
      console.error("Error fetching recent files:", error);
      res.status(500).json({ message: "Failed to fetch recent files" });
    }
  });

  // Shared files - Requires authentication
  app.get('/api/files/shared', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      // The storage method already filters by userId and isShared
      const sharedFiles = await storage.getSharedFiles(userId);
      res.json(sharedFiles);
    } catch (error) {
      console.error("Error fetching shared files:", error);
      res.status(500).json({ message: "Failed to fetch shared files" });
    }
  });

  // File upload handler (array) - Requires authentication
  app.post('/api/upload', isAuthenticated, upload.array('files'), async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper

      const uploadedFiles = req.files as Express.Multer.File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const folderId = req.body.folderId ? Number(req.body.folderId) : null;
      const savedFiles = [];
      const errors = [];

      for (const file of uploadedFiles) {
        const fileData = {
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          path: file.path, // This is the actual path where multer stored the file
          folderId,
          userId, // Associate file with the logged-in user
          isShared: false,
          sharedBy: null
        };

        try {
          // Validate file data using Zod if you have insertFileSchema validation
          // const validation = insertFileSchema.safeParse(fileData);
          // if (!validation.success) {
          //     console.error(`Validation error for file ${file.originalname}:`, validation.error.errors);
          //     errors.push({ filename: file.originalname, message: "Validation failed", details: validation.error.errors });
          //     // Clean up the uploaded file if validation fails
          //     if (fs.existsSync(file.path)) {
          //         fs.unlinkSync(file.path);
          //     }
          //     continue; // Skip saving this file
          // }
          // const savedFile = await storage.createFile(validation.data);


          const savedFile = await storage.createFile(fileData); // Use the original fileData if not validating with Zod
          savedFiles.push(savedFile);
        } catch (err: any) {
          console.error(`Failed to save file ${file.originalname}:`, err.message);
          errors.push({ filename: file.originalname, message: err.message });
          // Clean up the uploaded file if storage fails
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          // Continue with next file
        }
      }

      if (savedFiles.length === 0) {
        if (errors.length > 0) {
          return res.status(400).json({ message: "No files were successfully saved", errors });
        }
        return res.status(400).json({ message: "No files were successfully saved" });
      }

      // If some files failed but others succeeded
      if (errors.length > 0) {
        return res.status(207).json({ // 207 Multi-Status
          message: "Some files failed to upload",
          savedFiles: savedFiles,
          errors: errors
        });
      }

      res.status(201).json(savedFiles);
    } catch (error) {
      const err = error as Error;
      log(`Error uploading files: ${err.message}`, "api/upload");
      res.status(500).json({ message: "Failed to upload files" });
    }
  });


  // File upload handler (single) - Requires authentication
  app.post("/api/files", isAuthenticated, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      const { folderId } = req.query;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileData = {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        path: file.path,
        folderId: folderId ? Number(folderId) : null,
        userId, // Associate file with the logged-in user
        isShared: false,
        sharedBy: null
      };

      // Add Zod validation here if you have insertFileSchema validation
      // const validation = insertFileSchema.safeParse(fileData);
      // if (!validation.success) {
      //    console.error("Validation error uploading single file:", validation.error.errors);
      //     // Clean up the uploaded file if validation fails
      //    if (fs.existsSync(file.path)) {
      //      fs.unlinkSync(file.path);
      //    }
      //    return res.status(400).json({ message: "Invalid file data", errors: validation.error.errors });
      // }
      // const savedFile = await storage.createFile(validation.data);

      const savedFile = await storage.createFile(fileData); // Use the original fileData if not validating with Zod
      res.json(savedFile);
    } catch (error: any) {
      console.error("File upload error:", error);
      // Clean up uploaded file if storage.createFile failed after multer saved it
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get file by ID - Requires authentication and ownership check
  app.get('/api/files/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Get logged-in user ID
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);

      // Check if file exists and belongs to the user
      if (!file || file.userId !== userId) {
        // Return 404 Not Found for security
        return res.status(404).json({ message: "File not found" });
      }

      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  // Update file - Requires authentication and ownership check
  app.patch('/api/files/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Get logged-in user ID
      const fileId = Number(req.params.id);

      // Fetch the file to check ownership
      const file = await storage.getFileById(fileId);

      // Check if file exists and belongs to the user
      if (!file || file.userId !== userId) {
        // Return 404 Not Found for security
        return res.status(404).json({ message: "File not found" });
      }

      // Proceed with update if ownership is confirmed
      // Prevent changing ownership via update
      const updateData = { ...req.body };
      delete updateData.userId;
      delete updateData.id;

      const updatedFile = await storage.updateFile(fileId, updateData);

      // Should not happen if getFileById succeeded
      if (!updatedFile) {
        return res.status(404).json({ message: "File not found after update attempt" });
      }

      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Delete file - Requires authentication and ownership check
  app.delete('/api/files/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Get logged-in user ID
      const fileId = Number(req.params.id);

      // Fetch the file to check ownership
      const file = await storage.getFileById(fileId);

      // Check if file exists and belongs to the user
      if (!file || file.userId !== userId) {
        // Return 404 Not Found for security
        return res.status(404).json({ message: "File not found" });
      }

      // Proceed with deletion if ownership is confirmed
      // The storage method will handle the physical file deletion if using JsonStorage
      const success = await storage.deleteFile(fileId);

      if (!success) {
        // Should not happen if getFileById succeeded
        return res.status(500).json({ message: "Failed to delete file" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Download file - Requires authentication and ownership check
  app.get('/api/download/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Get logged-in user ID
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);

      // Check if file exists and belongs to the user
      if (!file || file.userId !== userId) {
        // Return 404 Not Found for security
        return res.status(404).json({ message: "File not found" });
      }

      // Check if the physical file exists
      if (!fs.existsSync(file.path)) {
        console.error(`File not found on disk: ${file.path}`);
        // Could log which user tried to access
        return res.status(404).json({ message: "File not found on disk" });
      }

      // Proceed with download if ownership is confirmed
      res.download(file.path, file.name);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });


  // Trash management routes - Require authentication
  app.get('/api/trash', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      // Storage methods already filter by userId and isDeleted
      const folders = await storage.getFoldersInTrash(userId);
      const files = await storage.getFilesInTrash(userId);
      res.json({ folders, files });
    } catch (error) {
      console.error("Error fetching trash items:", error);
      res.status(500).json({ message: "Failed to fetch trash items" });
    }
  });

  app.delete('/api/trash', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      // Storage method operates on the user's trash
      await storage.emptyTrash(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error emptying trash:", error);
      res.status(500).json({ message: "Failed to empty trash" });
    }
  });

  // Specific trash routes - Require authentication
  app.get('/api/trash/folders', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      // Storage method already filters by userId and isDeleted
      const folders = await storage.getFoldersInTrash(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders in trash:", error);
      res.status(500).json({ message: "Failed to fetch folders in trash" });
    }
  });

  app.get('/api/trash/files', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      // Storage method already filters by userId and isDeleted
      const files = await storage.getFilesInTrash(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files in trash:", error);
      res.status(500).json({ message: "Failed to fetch files in trash" });
    }
  });

  app.post('/api/trash/empty', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); // Use getUserId helper
      // Storage method operates on the user's trash
      await storage.emptyTrash(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error emptying trash:", error);
      res.status(500).json({ message: "Failed to empty trash" });
    }
  });

  return httpServer;
}