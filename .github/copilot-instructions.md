# Copilot Instructions

## ドキュメント参照（必ず守る）

外部ライブラリ・フレームワーク・言語のコードを書く前に、**必ず Context7 MCP の以下のツールを呼び出してから実装する**：

1. `resolve-library-id` でライブラリ ID を解決する。
2. `get-library-docs` で最新ドキュメントを取得する。
3. 取得したドキュメントに基づいて実装する。

対象例: Astro（content collections, integrations, routing）、Tailwind CSS、Mermaid、Playwright、pnpm など。

**禁止事項**：
- 学習時点の記憶だけでコードを書かない。
- 「知っているはず」と判断して Context7 をスキップしない。馴染みのある技術であっても毎回ドキュメントを確認する。
- ライブラリの API・設定ファイル形式・CLI フラグは古くなっている可能性が高い。憶測ではなく Context7 で裏を取る。

## 言語

- すべての応答・コメント・コミットメッセージ・PR 説明は **日本語** で書く。

## Stack

- **Astro** のみ。Next.js・React Router・SvelteKit は使わない。
- ページ・レイアウトは Astro コンポーネント (.astro) を使う。
- マークダウンコンテンツは Astro の **content collections** (src/content/) を使う。
- スタイルは Tailwind CSS。必要に応じてスコープ付き <style> ブロック。
- TypeScript をすべての場所で使う (.ts, .astro frontmatter)。

## 規約

- ページは src/pages/。
- 再利用 UI は src/components/。
- マークダウンは src/content/<collection>/*.md。スキーマは src/content.config.ts。
- パッケージマネージャは **pnpm**。

## コードレビュー

- 変更を提出する前に **セルフレビュー** を行い、既存ファイルの規約・命名・テンプレートに揃える。
- PR 説明には **何を / なぜ / どう確認するか** の 3 点を必ず含める。
- 破壊的変更（frontmatter スキーマ、ルーティング、ビルド設定）は理由と影響範囲を明記する。
- 大きな変更は小さく分割し、レビュー負荷を下げる。
