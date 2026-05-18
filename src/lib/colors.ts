/**
 * frontmatter の color トークン → アクセント Hex。
 * .github/instructions/frontend.instructions.md のパレットに準拠。
 */
export const COLOR_HEX: Record<string, string> = {
  magenta: "#ff2e88",
  cyan: "#00f0ff",
  amber: "#ffb000",
  green: "#9bbc0f",
  phosphor: "#9bbc0f",
};

export const DEFAULT_ACCENT = COLOR_HEX.magenta;

export function accentFor(color: string | undefined): string {
  if (!color) return DEFAULT_ACCENT;
  return COLOR_HEX[color] ?? DEFAULT_ACCENT;
}
