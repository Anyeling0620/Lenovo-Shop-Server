// middleware/upload.middleware.ts
import { Context, Next } from 'hono';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 确保用户上传目录存在
const userUploadDir = path.join(process.cwd(), 'public','images','lenovo');  
if (!fs.existsSync(userUploadDir)) {
  fs.mkdirSync(userUploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, userUploadDir);
  },
  filename: function (req, file, cb) {
    // 使用UUID生成唯一文件名
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    // 格式：UUID + 原始扩展名
    cb(null, uuid + ext);
  }
});

// 文件过滤
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的图片类型
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (JPEG, PNG, GIF, WebP)'));
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
    files: 5 // 最多5个文件
  }
});

// 中间件包装器 - 处理多个文件
export const uploadMiddleware = async (c: Context, next: Next) => {
  return new Promise((resolve, reject) => {
    upload.array('images', 5)(c.req.raw as any, c.req.raw as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(next());
      }
    });
  });
};

// 或者创建多个中间件函数
export const uploadSingleMiddleware = (fieldName: string) => {
  return async (c: Context, next: Next) => {
    return new Promise((resolve, reject) => {
      upload.single(fieldName)(c.req.raw as any, c.req.raw as any, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(next());
        }
      });
    });
  };
};

export const uploadArrayMiddleware = (fieldName: string, maxCount: number = 5) => {
  return async (c: Context, next: Next) => {
    return new Promise((resolve, reject) => {
      upload.array(fieldName, maxCount)(c.req.raw as any, c.req.raw as any, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(next());
        }
      });
    });
  };
};

// 辅助函数：获取上传文件的信息
export interface UploadedFileInfo {
  originalname: string;
  filename: string; // UUID文件名
  path: string; // 完整路径
  size: number;
  mimetype: string;
  destination: string;
}

// 从请求中获取上传文件信息
export function getUploadedFiles(req: any): UploadedFileInfo[] {
  if (req.files && Array.isArray(req.files)) {
    return req.files.map((file: any) => ({
      originalname: file.originalname,
      filename: file.filename, // UUID文件名
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      destination: file.destination
    }));
  }
  return [];
}

// 获取单个上传文件信息
export function getUploadedFile(req: any): UploadedFileInfo | null {
  if (req.file) {
    return {
      originalname: req.file.originalname,
      filename: req.file.filename, // UUID文件名
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      destination: req.file.destination
    };
  }
  return null;
}
