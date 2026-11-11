// AsyncStorage en memoria para pruebas.
const data = new Map<string, string>();

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return data.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    data.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    data.delete(key);
  },
  async multiSet(pairs: readonly (readonly [string, string])[]): Promise<void> {
    for (const [key, value] of pairs) data.set(key, value);
  },
  async multiRemove(keys: readonly string[]): Promise<void> {
    for (const key of keys) data.delete(key);
  },
  async getAllKeys(): Promise<string[]> {
    return [...data.keys()];
  },
  async clear(): Promise<void> {
    data.clear();
  },
};

export default AsyncStorage;
