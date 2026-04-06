function randomInt(maxExclusive: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % maxExclusive;
}

export function fairShuffle<T>(items: T[]) {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}
