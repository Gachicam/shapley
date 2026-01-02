/** シャープレイ値計算に関するエラーの基底クラス */
export class ShapleyError extends Error {
  override readonly name: string = "ShapleyError";
}

/** プレイヤーリストが空の場合のエラー */
export class EmptyPlayersError extends ShapleyError {
  override readonly name = "EmptyPlayersError";

  constructor() {
    super("Players array must not be empty");
  }
}

/** プレイヤー名が重複している場合のエラー */
export class DuplicatePlayersError extends ShapleyError {
  override readonly name = "DuplicatePlayersError";

  constructor() {
    super("Players array must not contain duplicates");
  }
}

/** 特性関数の実行中に発生したエラー */
export class CharacteristicFunctionError extends ShapleyError {
  override readonly name = "CharacteristicFunctionError";

  constructor(cause?: unknown) {
    super("Characteristic function failed");
    this.cause = cause;
  }
}
