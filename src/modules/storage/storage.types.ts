export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  usageType?: string;
}

export interface UploadFileResult {
  fileUrl:  string;   // secure_url from Cloudinary
  publicId: string;   // public_id from Cloudinary (needed for deletion)
  format?:  string;
  width?:   number;
  height?:  number;
  size?:    number;   // bytes
}

export interface StorageProvider {
  uploadFile(input: UploadFileInput): Promise<UploadFileResult>;
  deleteFile(publicId: string): Promise<void>;
}
