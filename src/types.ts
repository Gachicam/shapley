/**
 * 特性関数の型。連合（プレイヤーの部分集合）を受け取り、その連合の価値を返す。
 *
 * @param coalition - プレイヤー名の配列（空配列も有効）
 * @returns 連合の価値（負の値も有効）
 * @throws 例外を throw してエラーを通知
 */
export type CharacteristicFunction = (coalition: readonly string[]) => number;

/**
 * シャープレイ値の計算結果を表す型。
 */
export interface ShapleyResult {
  /** プレイヤー名 */
  player: string;
  /** シャープレイ値 */
  value: number;
}
