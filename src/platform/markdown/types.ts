export interface MarkdownAdapter {
  render(markdown: string): Promise<string>;
}
