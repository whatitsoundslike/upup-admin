import { CommunityScraper } from './types';
import { DCInsideScraper } from './dcinside';
import { ClienScraper } from './clien';

export * from './types';
export * from './utils';

export function getScraper(source: string): CommunityScraper | null {
  switch (source.toLowerCase()) {
    case 'dcinside':
      return new DCInsideScraper();
    case 'clien':
      return new ClienScraper();
    default:
      return null;
  }
}
