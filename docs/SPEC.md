# shapley TypeScript 版 API 仕様書

シャープレイ値計算ライブラリの TypeScript 実装仕様。

## 概要

- Rust 版 (shapley-rs) からの移植
- Next.js Server Actions での使用を想定
- npm パッケージとして公開予定
- プレイヤー数: 最大10人程度（並列処理不要）

## 型定義

### CharacteristicFunction

特性関数の型。連合（プレイヤーの部分集合）を受け取り、その連合の価値を返す。

```typescript
type CharacteristicFunction = (coalition: readonly string[]) => number;
```

- **引数**: `coalition` - プレイヤー名の配列（空配列も有効）
- **戻り値**: 連合の価値（number、負の値も有効）
- **前提**: 空集合の価値 v({}) = 0 を前提とする
- **エラー時**: 例外を throw する

### ShapleyResult

シャープレイ値の計算結果を表す型。

```typescript
interface ShapleyResult {
  /** プレイヤー名 */
  player: string;
  /** シャープレイ値 */
  value: number;
}
```

### エラークラス

```typescript
/** シャープレイ値計算に関するエラーの基底クラス */
class ShapleyError extends Error {
  override name = 'ShapleyError' as const;

  constructor(message: string) {
    super(message);
  }
}

/** プレイヤーリストが空の場合のエラー */
class EmptyPlayersError extends ShapleyError {
  override name = 'EmptyPlayersError' as const;

  constructor() {
    super('Players array must not be empty');
  }
}

/** プレイヤー名が重複している場合のエラー */
class DuplicatePlayersError extends ShapleyError {
  override name = 'DuplicatePlayersError' as const;

  constructor() {
    super('Players array must not contain duplicates');
  }
}

/** 特性関数の実行中に発生したエラー */
class CharacteristicFunctionError extends ShapleyError {
  override name = 'CharacteristicFunctionError' as const;

  constructor(cause?: unknown) {
    super('Characteristic function failed');
    this.cause = cause;
  }
}
// 注: 特性関数が NaN や Infinity を返した場合も CharacteristicFunctionError を throw する
```

## 関数

### calculateShapleyValues

シャープレイ値を計算するメイン関数。

```typescript
function calculateShapleyValues(
  players: readonly string[],
  characteristicFunction: CharacteristicFunction
): ShapleyResult[];
```

- **引数**:
  - `players`: プレイヤー名の配列（空配列不可、重複不可）
  - `characteristicFunction`: 特性関数
- **戻り値**: 各プレイヤーのシャープレイ値の配列（順序は不定、Map での参照を推奨）
- **例外**:
  - `EmptyPlayersError`: players が空配列の場合
  - `DuplicatePlayersError`: players に重複がある場合
  - `CharacteristicFunctionError`: 特性関数が例外を throw した場合、または NaN/Infinity を返した場合

## モジュール構成

```text
src/
├── index.ts          # エントリポイント（全エクスポート）
├── types.ts          # 型定義
├── errors.ts         # エラークラス
├── shapley.ts        # メインロジック
└── utils.ts          # ユーティリティ（順列生成など）
```

### ユーティリティ関数

```typescript
// utils.ts

/**
 * 配列の全順列を生成するジェネレータ関数
 * @param items - 順列を生成する配列
 * @yields 配列の各順列
 */
function* generatePermutations<T>(items: readonly T[]): Generator<T[]>;
```

### エクスポート

```typescript
// index.ts
export type { CharacteristicFunction, ShapleyResult } from './types';
export { ShapleyError, EmptyPlayersError, DuplicatePlayersError, CharacteristicFunctionError } from './errors';
export { calculateShapleyValues } from './shapley';
```

## 使用例

### 基本的な使用法

```typescript
import { calculateShapleyValues, type CharacteristicFunction } from 'shapley';

// プレイヤーを定義
const players = ['A', 'B', 'C'];

// 特性関数を定義
const characteristicFunction: CharacteristicFunction = (coalition) => {
  const sorted = [...coalition].sort().join(',');

  const values: Record<string, number> = {
    '': 0,
    'A': 10,
    'B': 20,
    'C': 30,
    'A,B': 40,
    'A,C': 50,
    'B,C': 60,
    'A,B,C': 100,
  };

  return values[sorted] ?? 0;
};

// シャープレイ値を計算
const results = calculateShapleyValues(players, characteristicFunction);

// 結果を表示
for (const { player, value } of results) {
  console.log(`${player}: ${value.toFixed(2)}`);
}
// 出力:
// A: 23.33  (140/6)
// B: 33.33  (200/6)
// C: 43.33  (260/6)
```

### エラーハンドリング

```typescript
import {
  calculateShapleyValues,
  EmptyPlayersError,
  DuplicatePlayersError,
  CharacteristicFunctionError
} from 'shapley';

try {
  const results = calculateShapleyValues(players, characteristicFunction);
} catch (error) {
  if (error instanceof EmptyPlayersError) {
    console.error('プレイヤーリストが空です');
  } else if (error instanceof DuplicatePlayersError) {
    console.error('プレイヤー名が重複しています');
  } else if (error instanceof CharacteristicFunctionError) {
    console.error('特性関数でエラーが発生しました:', error.cause);
  } else {
    throw error;
  }
}
```

## アルゴリズム

1. 全プレイヤーの全順列を生成
2. 各プレイヤーについて:
   - 各順列で限界貢献度を計算
     - 限界貢献度 = v(S ∪ {i}) - v(S)
     - S: 順列においてプレイヤー i より前に現れるプレイヤーの集合
   - 全順列での限界貢献度を合計
3. 合計を順列数（n!）で割って平均を取る

**計算量**: O(n! × n)

## エッジケース

| ケース                           | 挙動                                                |
| -------------------------------- | --------------------------------------------------- |
| 空のプレイヤー配列               | `EmptyPlayersError` を throw                        |
| 重複するプレイヤー名             | `DuplicatePlayersError` を throw                    |
| 1人のプレイヤー                  | そのプレイヤーの価値がそのままシャープレイ値        |
| 特性関数が例外を throw           | `CharacteristicFunctionError` でラップして re-throw |
| 特性関数が NaN/Infinity を返す   | `CharacteristicFunctionError` を throw              |
| 特性関数が負の値を返す           | 正常（ゲーム理論では負の価値も有効）                |
| 特性関数が空配列で呼ばれる       | 正常（v({}) = 0 を返すこと）                        |

## テストケース

Rust 版から移植するテストケース:

### 1. 基本的なシャープレイ値計算

```typescript
test('3人プレイヤーのシャープレイ値を正しく計算できる', () => {
  const players = ['A', 'B', 'C'];
  const characteristicFunction: CharacteristicFunction = (coalition) => {
    const sorted = [...coalition].sort().join(',');
    const values: Record<string, number> = {
      '': 0, 'A': 10, 'B': 20, 'C': 30,
      'A,B': 40, 'A,C': 50, 'B,C': 60,
      'A,B,C': 100,
    };
    return values[sorted] ?? 0;
  };

  const results = calculateShapleyValues(players, characteristicFunction);

  expect(results).toHaveLength(3);

  const resultMap = new Map(results.map(r => [r.player, r.value]));
  expect(resultMap.get('A')).toBeCloseTo(140 / 6, 5);
  expect(resultMap.get('B')).toBeCloseTo(200 / 6, 5);
  expect(resultMap.get('C')).toBeCloseTo(260 / 6, 5);
});
```

### 2. 空プレイヤー配列

```typescript
test('空のプレイヤー配列で EmptyPlayersError を throw する', () => {
  const players: string[] = [];
  const characteristicFunction: CharacteristicFunction = () => 0;

  expect(() => calculateShapleyValues(players, characteristicFunction))
    .toThrow(EmptyPlayersError);
});
```

### 3. 重複プレイヤー配列

```typescript
test('重複するプレイヤー名で DuplicatePlayersError を throw する', () => {
  const players = ['A', 'B', 'A'];
  const characteristicFunction: CharacteristicFunction = () => 0;

  expect(() => calculateShapleyValues(players, characteristicFunction))
    .toThrow(DuplicatePlayersError);
});
```

### 4. 特性関数エラー

```typescript
test('特性関数が例外を throw すると CharacteristicFunctionError になる', () => {
  const players = ['A', 'B'];
  const characteristicFunction: CharacteristicFunction = () => {
    throw new Error('テストエラー');
  };

  expect(() => calculateShapleyValues(players, characteristicFunction))
    .toThrow(CharacteristicFunctionError);
});
```

### 5. 特性関数が NaN を返す

```typescript
test('特性関数が NaN を返すと CharacteristicFunctionError になる', () => {
  const players = ['A', 'B'];
  const characteristicFunction: CharacteristicFunction = () => NaN;

  expect(() => calculateShapleyValues(players, characteristicFunction))
    .toThrow(CharacteristicFunctionError);
});
```

### 6. 特性関数が Infinity を返す

```typescript
test('特性関数が Infinity を返すと CharacteristicFunctionError になる', () => {
  const players = ['A', 'B'];
  const characteristicFunction: CharacteristicFunction = () => Infinity;

  expect(() => calculateShapleyValues(players, characteristicFunction))
    .toThrow(CharacteristicFunctionError);
});

test('特性関数が -Infinity を返すと CharacteristicFunctionError になる', () => {
  const players = ['A', 'B'];
  const characteristicFunction: CharacteristicFunction = () => -Infinity;

  expect(() => calculateShapleyValues(players, characteristicFunction))
    .toThrow(CharacteristicFunctionError);
});
```

### 7. 1人プレイヤー

```typescript
test('1人プレイヤーの場合、その価値がそのままシャープレイ値になる', () => {
  const players = ['A'];
  const characteristicFunction: CharacteristicFunction = (coalition) => {
    return coalition.length === 0 ? 0 : 42;
  };

  const results = calculateShapleyValues(players, characteristicFunction);

  expect(results).toHaveLength(1);
  expect(results[0].player).toBe('A');
  expect(results[0].value).toBe(42);
});
```

## Rust 版との差異

| 項目               | Rust 版               | TypeScript 版    |
| ------------------ | --------------------- | ---------------- |
| エラーハンドリング | Result 型             | 例外 throw       |
| 特性関数の戻り値   | `Result<i64, String>` | `number`         |
| 並列処理           | rayon による並列化    | シングルスレッド |
| プレイヤー型       | `&str`                | `string`         |

## 将来の拡張（スコープ外）

- 非同期特性関数のサポート
- 近似計算アルゴリズム（サンプリングベース）
