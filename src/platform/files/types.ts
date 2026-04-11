export interface FileAdapter {
  pickOpenPath(): Promise<string | null>;
  pickSavePath(defaultPath: string): Promise<string | null>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
}
