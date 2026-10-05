import { CTSError } from '../model/Errors';

/**
 * Search a bounded CTF listing without treating one page as the complete registry.
 */
export async function findCtfListingItem<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; next_cursor: string | null }>,
  matches: (item: T) => boolean,
): Promise<T | undefined> {
  const cursors = new Set<string>();
  let cursor: string | undefined;
  let count = 0;
  for (let pageNumber = 0; pageNumber < 100; pageNumber += 1) {
    const page = await fetchPage(cursor);
    count += page.items.length;
    if (page.items.length > 100 || count > 10_000) {
      throw new CTSError('Mint exceeded the CTF listing bound');
    }
    if (page.next_cursor !== null) {
      if (cursors.has(page.next_cursor)) {
        throw new CTSError('Mint CTF pagination did not advance');
      }
      cursors.add(page.next_cursor);
    }
    const item = page.items.find(matches);
    if (item !== undefined) return item;
    if (page.next_cursor === null) return undefined;
    cursor = page.next_cursor;
  }
  throw new CTSError('Mint exceeded the CTF pagination bound');
}
