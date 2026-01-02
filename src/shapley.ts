import {
  CharacteristicFunctionError,
  DuplicatePlayersError,
  EmptyPlayersError,
} from "./errors.js";
import type { CharacteristicFunction, ShapleyResult } from "./types.js";
import { generatePermutations } from "./utils.js";

/**
 * 特性関数の戻り値を検証し、有効な数値であることを確認する
 */
function validateValue(value: number, cause?: unknown): number {
  if (!Number.isFinite(value)) {
    throw new CharacteristicFunctionError(cause);
  }
  return value;
}

/**
 * 特性関数を安全に呼び出し、エラーをラップする
 */
function safeCall(
  fn: CharacteristicFunction,
  coalition: readonly string[]
): number {
  try {
    const value = fn(coalition);
    return validateValue(value);
  } catch (error) {
    if (error instanceof CharacteristicFunctionError) {
      throw error;
    }
    throw new CharacteristicFunctionError(error);
  }
}

/**
 * シャープレイ値を計算するメイン関数。
 *
 * @param players - プレイヤー名の配列（空配列不可、重複不可）
 * @param characteristicFunction - 特性関数
 * @returns 各プレイヤーのシャープレイ値の配列
 * @throws EmptyPlayersError - players が空配列の場合
 * @throws DuplicatePlayersError - players に重複がある場合
 * @throws CharacteristicFunctionError - 特性関数が例外を throw した場合、または NaN/Infinity を返した場合
 */
export function calculateShapleyValues(
  players: readonly string[],
  characteristicFunction: CharacteristicFunction
): ShapleyResult[] {
  // バリデーション: 空配列チェック
  if (players.length === 0) {
    throw new EmptyPlayersError();
  }

  // バリデーション: 重複チェック
  const uniquePlayers = new Set(players);
  if (uniquePlayers.size !== players.length) {
    throw new DuplicatePlayersError();
  }

  const n = players.length;

  // 各プレイヤーの限界貢献度の合計を保持
  const contributions = new Map<string, number>();
  for (const player of players) {
    contributions.set(player, 0);
  }

  // 順列の数をカウント
  let permutationCount = 0;

  // 全順列を生成して、各プレイヤーの限界貢献度を計算
  for (const permutation of generatePermutations(players)) {
    permutationCount++;

    // 各プレイヤーの限界貢献度を計算
    for (let i = 0; i < n; i++) {
      const player = permutation[i];
      if (player === undefined) continue;

      // S: プレイヤー i より前に現れるプレイヤーの集合
      const coalitionWithout = permutation.slice(0, i);
      const coalitionWith = permutation.slice(0, i + 1);

      // v(S ∪ {i}) - v(S)
      const valueWithout = safeCall(characteristicFunction, coalitionWithout);
      const valueWith = safeCall(characteristicFunction, coalitionWith);
      const marginalContribution = valueWith - valueWithout;

      // 合計に加算
      const current = contributions.get(player) ?? 0;
      contributions.set(player, current + marginalContribution);
    }
  }

  // 順列数で割って平均を取り、結果を作成
  const results: ShapleyResult[] = [];
  for (const player of players) {
    const total = contributions.get(player) ?? 0;
    results.push({
      player,
      value: total / permutationCount,
    });
  }

  return results;
}
