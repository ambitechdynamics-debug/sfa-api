import { cloudinary } from '../../config/cloudinary';
import { env } from '../../config/env';
import type { StorageProvider, UploadFileInput, UploadFileResult } from './storage.types';

/** Maps FileUsageType values to Cloudinary sub-folders */
const FOLDER_MAP: Record<string, string> = {
  LOGO:              'logos',
  MODEL:             'models',
  REFERENCE_IMAGE:   'references',
  PRODUCT_IMAGE:     'products',
  PERSON_IMAGE:      'persons',
  BRAND_GUIDELINE:   'brand-guidelines',
  GENERATED_POSTER:  'generated-posters',
  ARTISTIC_RESOURCE: 'artistic-resources',
  OTHER:             'others',
};

export class CloudinaryProvider implements StorageProvider {
  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const { buffer, originalName, mimetype, usageType = 'OTHER' } = input;

    const subFolder = FOLDER_MAP[usageType] ?? 'others';
    const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${subFolder}`;

    // Determine resource type from MIME
    const resourceType = mimetype.startsWith('video/')
      ? 'video'
      : mimetype.startsWith('image/')
        ? 'image'
        : 'raw';

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error('Cloudinary upload returned no result'));
          }
          resolve({
            fileUrl:  result.secure_url,
            publicId: result.public_id,
            format:   result.format,
            width:    result.width,
            height:   result.height,
            size:     result.bytes,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  }
}
