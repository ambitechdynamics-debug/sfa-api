import { CloudinaryProvider } from './cloudinary.provider';
import type { StorageProvider } from './storage.types';

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = new CloudinaryProvider();
  }
  return instance;
}
