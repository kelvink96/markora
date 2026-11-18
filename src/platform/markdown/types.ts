export interface MarkdownRenderOptions {
  /** Path of the open file, used to resolve relative image links. Null for unsaved documents. */
  documentPath?: string | null;
}

export interface MarkdownAdapter {
  render(markdown: string, options?: MarkdownRenderOptions): Promise<string>;
}
