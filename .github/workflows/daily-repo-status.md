---
description: |
  リポジトリの最近の活動（Issue、Pull Request、コード変更）を収集・分析し、
  日次のステータスレポートを GitHub Issue として自動作成するエージェントワークフロー。

on:
  schedule: daily
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

tools:
  github:
    # public リポジトリでは lockdown:false により、外部ユーザーが作成した
    # Issue / PR / コメントも読めるようになる（private では影響なし）。
    lockdown: false
    # このワークフローはリポジトリ内の任意の Issue / PR を参照・分析するだけで、
    # 外部から取得した内容を書き戻したりはしないため min-integrity を緩める。
    min-integrity: none

safe-outputs:
  mentions: false
  allowed-github-references: []
  create-issue:
    title-prefix: "[repo-status] "
    labels: [report, daily-status]
    close-older-issues: true
---

# Daily Repo Status

このリポジトリの **日次ステータスレポート** を新しい GitHub Issue として作成してください。
過去 24 時間（前回レポートが古い場合はそれ以降）の活動を題材にします。

## 含める内容

- 直近の **Issue** と **Pull Request**（オープン / クローズ / マージ / レビュー状況）
- **コード変更**のハイライト（main へのマージ、目立つ追加・削除、影響範囲）
- 進捗・マイルストーンに対する到達状況、注目すべきトピック
- メンテナー向けの **アクションアイテム**（レビュー待ち、放置されている Issue、衝突しそうな PR など）

## 書き方

- 簡潔に。実際の活動量に応じて分量を調整する（活動が少ない日は短く）。
- ポジティブで励みになるトーン 🌟。絵文字は控えめに。
- 推測ではなく **観測可能な事実** に基づいて書く。数値・リンクは GitHub から取得した実データを使う。
- 本文は **日本語**。

## 手順

1. リポジトリの直近の活動を収集する（Issue / PR / commit / discussion / release）。
2. 各 Issue / PR の状態とコメントを必要に応じて深掘りする。
3. 上記をまとめて、新しい GitHub Issue として投稿する。
   - タイトルは `safe-outputs.create-issue.title-prefix` が自動付与するため、本文に合わせた要約タイトル（例: 日付＋一言サマリ）を設定する。
   - ラベルは自動付与される。
