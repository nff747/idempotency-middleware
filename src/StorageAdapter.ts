export interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, data: any, expiresIn: number): Promise<void>;
  delete(key: string): Promise<void>;
}
