import { describe, expect, test } from "vitest";
import {
  calculateShapleyValues,
  CharacteristicFunctionError,
  DuplicatePlayersError,
  EmptyPlayersError,
  type CharacteristicFunction,
} from "./index.js";

describe("calculateShapleyValues", () => {
  test("3人プレイヤーのシャープレイ値を正しく計算できる", () => {
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

    expect(results).toHaveLength(3);

    const resultMap = new Map(results.map((r) => [r.player, r.value]));
    expect(resultMap.get("A")).toBeCloseTo(140 / 6, 5);
    expect(resultMap.get("B")).toBeCloseTo(200 / 6, 5);
    expect(resultMap.get("C")).toBeCloseTo(260 / 6, 5);
  });

  test("空のプレイヤー配列で EmptyPlayersError を throw する", () => {
    const players: string[] = [];
    const characteristicFunction: CharacteristicFunction = () => 0;

    expect(() =>
      calculateShapleyValues(players, characteristicFunction)
    ).toThrow(EmptyPlayersError);
  });

  test("重複するプレイヤー名で DuplicatePlayersError を throw する", () => {
    const players = ["A", "B", "A"];
    const characteristicFunction: CharacteristicFunction = () => 0;

    expect(() =>
      calculateShapleyValues(players, characteristicFunction)
    ).toThrow(DuplicatePlayersError);
  });

  test("特性関数が例外を throw すると CharacteristicFunctionError になる", () => {
    const players = ["A", "B"];
    const characteristicFunction: CharacteristicFunction = () => {
      throw new Error("テストエラー");
    };

    expect(() =>
      calculateShapleyValues(players, characteristicFunction)
    ).toThrow(CharacteristicFunctionError);
  });

  test("特性関数が NaN を返すと CharacteristicFunctionError になる", () => {
    const players = ["A", "B"];
    const characteristicFunction: CharacteristicFunction = () => NaN;

    expect(() =>
      calculateShapleyValues(players, characteristicFunction)
    ).toThrow(CharacteristicFunctionError);
  });

  test("特性関数が Infinity を返すと CharacteristicFunctionError になる", () => {
    const players = ["A", "B"];
    const characteristicFunction: CharacteristicFunction = () => Infinity;

    expect(() =>
      calculateShapleyValues(players, characteristicFunction)
    ).toThrow(CharacteristicFunctionError);
  });

  test("特性関数が -Infinity を返すと CharacteristicFunctionError になる", () => {
    const players = ["A", "B"];
    const characteristicFunction: CharacteristicFunction = () => -Infinity;

    expect(() =>
      calculateShapleyValues(players, characteristicFunction)
    ).toThrow(CharacteristicFunctionError);
  });

  test("1人プレイヤーの場合、その価値がそのままシャープレイ値になる", () => {
    const players = ["A"];
    const characteristicFunction: CharacteristicFunction = (coalition) => {
      return coalition.length === 0 ? 0 : 42;
    };

    const results = calculateShapleyValues(players, characteristicFunction);

    expect(results).toHaveLength(1);
    const result = results[0];
    expect(result).toBeDefined();
    expect(result?.player).toBe("A");
    expect(result?.value).toBe(42);
  });

  test("特性関数が負の値を返しても正常に計算できる", () => {
    const players = ["A", "B"];
    const characteristicFunction: CharacteristicFunction = (coalition) => {
      if (coalition.length === 0) return 0;
      if (coalition.length === 1) return -10;
      return -5; // 協力すると損失が軽減される
    };

    const results = calculateShapleyValues(players, characteristicFunction);

    expect(results).toHaveLength(2);
    // 合計が v({A,B}) = -5 になることを確認
    const total = results.reduce((sum, r) => sum + r.value, 0);
    expect(total).toBeCloseTo(-5, 5);
  });
});
