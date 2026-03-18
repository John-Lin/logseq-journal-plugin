type BlockLike = {
  content?: string;
  children?: unknown[];
} | null;

export function shouldRemoveSourceBlock(block: BlockLike): boolean {
  if (!block) {
    return false;
  }

  const content = typeof block.content === "string" ? block.content.trim() : "";
  const hasChildren = Array.isArray(block.children) && block.children.length > 0;
  return content.length === 0 && !hasChildren;
}
