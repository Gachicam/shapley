# shapley

シャープレイ値計算ライブラリの TypeScript 実装。

## インストール

```bash
npm install shapley
```

## 使用例

```typescript
import { calculateShapleyValues, type CharacteristicFunction } from "shapley";

const players = ["A", "B", "C"];

const characteristicFunction: CharacteristicFunction = (coalition) => {
  const sorted = [...coalition].sort().join(",");
  const values: Record<string, number> = {
    "": 0,
    A: 10,
    B: 20,
    C: 30,
    "A,B": 40,
    "A,C": 50,
    "B,C": 60,
    "A,B,C": 100,
  };
  return values[sorted] ?? 0;
};

const results = calculateShapleyValues(players, characteristicFunction);

for (const { player, value } of results) {
  console.log(`${player}: ${value.toFixed(2)}`);
}
// A: 23.33
// B: 33.33
// C: 43.33
```

## API

### `calculateShapleyValues(players, characteristicFunction)`

シャープレイ値を計算します。

- `players`: プレイヤー名の配列（空配列不可、重複不可）
- `characteristicFunction`: 連合の価値を返す関数

戻り値: `{ player: string, value: number }[]`

### エラー

| クラス | 説明 |
|--------|------|
| `EmptyPlayersError` | プレイヤー配列が空 |
| `DuplicatePlayersError` | プレイヤー名が重複 |
| `CharacteristicFunctionError` | 特性関数がエラー、NaN、Infinity を返した |

## 制約

- プレイヤー数: 最大10人程度（計算量 O(n! × n)）
- 特性関数: 同期関数のみ
- 空集合の価値: v({}) = 0 を前提

## ライセンス

MIT
