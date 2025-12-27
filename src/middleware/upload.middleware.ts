// middleware/upload.middleware.ts
import { Context, Next } from 'hono';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 确保用户上传目录存在
const userUploadDir = path.join(process.cwd(), 'public', 'images', 'lenovo');
if (!fs.existsSync(userUploadDir)) {
  fs.mkdirSync(userUploadDir, { recursive: true });
}

// 允许的图片类型
const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];


function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File;
}

export const uploadMiddleware = async (c: Context, next: Next) => {
  console.log('=== Hono 上传中间件开始 ===');
  
  try {
    const contentType = c.req.header('Content-Type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      console.log('不是 multipart/form-data 请求，跳过文件处理');
      return next();
    }
    
    // 使用 Hono 的 formData 解析
    const formData = await c.req.formData();
    const files: any[] = [];
    const body: Record<string, string> = {};
    
    console.log('FormData 条目数量:', [...formData.entries()].length);
    
    for (const [key, value] of formData.entries()) {
      console.log(`处理字段: ${key}, 类型: ${isFile(value) ? 'File' : 'Text'}`);
      
      if (isFile(value)) {
        // 处理文件
        if (key === 'images') {
          // 验证文件类型
          if (!allowedMimes.includes(value.type)) {
            throw new Error(`不支持的文件类型: ${value.type}`);
          }
          
          // 验证文件大小 (5MB)
          if (value.size > 5 * 1024 * 1024) {
            throw new Error(`文件大小超过限制: ${value.name}`);
          }
          
          // 生成文件名
          const uuid = uuidv4();
          const ext = path.extname(value.name);
          const filename = uuid + ext;
          const filepath = path.join(userUploadDir, filename);
          
          // 保存文件
          const arrayBuffer = await value.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(filepath, buffer);
          
          files.push({
            fieldname: key,
            originalname: value.name,
            filename: filename,
            path: filepath,
            size: value.size,
            mimetype: value.type,
            destination: userUploadDir
          });
          
          console.log(`文件保存成功: ${value.name} -> ${filename}`);
        }
      } else {
        // 处理文本字段
        body[key] = value.toString();
      }
    }
    
    // 将文件信息和请求体挂载到 context
    c.set('uploadedFiles', files);
    c.set('formBody', body);
    
    console.log('处理后的文件数量:', files.length);
    console.log('处理后的表单字段:', Object.keys(body));
    console.log('=== Hono 上传中间件结束 ===');
    
    return next();
  } catch (error) {
    console.error('上传中间件错误:', error);
    throw error;
  }
};

// 辅助函数：从 context 获取上传的文件
export function getUploadedFiles(c: Context): any[] {
  return c.get('uploadedFiles') || [];
}

// 辅助函数：从 context 获取表单字段
export function getFormBody(c: Context): Record<string, string> {
  return c.get('formBody') || {};
}

