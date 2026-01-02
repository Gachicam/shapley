# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

シャープレイ値計算ライブラリの TypeScript 実装。Rust版 (shapley-rs) からの移植で、Next.js Server Actions での使用を想定した npm パッケージ。

## アーキテクチャ

```
src/
├── index.ts      # エントリポイント（全エクスポート）
├── types.ts      # CharacteristicFunction, ShapleyResult 型
├── errors.ts     # ShapleyError 継承クラス群
├── shapley.ts    # calculateShapleyValues メインロジック
└── utils.ts      # generatePermutations など内部ユーティリティ
```

## 設計上の重要な制約

- プレイヤー数: 最大10人程度（O(n! × n) のため並列処理不要）
- 特性関数は同期関数のみ対応
- 空集合の価値 v({}) = 0 を前提とする
- NaN/Infinity は CharacteristicFunctionError として扱う
- 負の値は正常値として計算する

## 仕様書

詳細な API 仕様・テストケースは [docs/SPEC.md](docs/SPEC.md) を参照。
