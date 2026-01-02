/**
 * 配列の全順列を生成するジェネレータ関数
 * Heap's algorithm を使用
 *
 * @param items - 順列を生成する配列
 * @yields 配列の各順列
 */
export function* generatePermutations<T>(items: readonly T[]): Generator<T[]> {
  const arr = [...items];
  const n = arr.length;

  if (n === 0) {
    yield [];
    return;
  }

  const c = new Array<number>(n).fill(0);
  yield [...arr];

  let i = 0;
  while (i < n) {
    const ci = c[i];
    if (ci !== undefined && ci < i) {
      if (i % 2 === 0) {
        const temp = arr[0];
        arr[0] = arr[i] as T;
        arr[i] = temp as T;
      } else {
        const temp = arr[ci];
        arr[ci] = arr[i] as T;
        arr[i] = temp as T;
      }
      yield [...arr];
      c[i] = ci + 1;
      i = 0;
    } else {
      c[i] = 0;
      i++;
    }
  }
}
