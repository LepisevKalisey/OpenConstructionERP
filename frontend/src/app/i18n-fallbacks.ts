/**
 * Test-only aggregator. Re-exports every per-locale resource as a single
 * ``fallbackResources`` object so existing tests (notably
 * ``boqResourceTypes.test.ts``) can iterate all 26 locales without
 * duplicating the imports.
 *
 * IMPORTANT: this file is intentionally NOT imported from runtime code.
 * The application boots from ``./locales/en`` and lazy-loads other
 * locales on demand (see ``./i18n.ts``). Static imports here force the
 * test bundle to include every locale; tree-shaking removes the entire
 * file from the production bundle because nothing in the entrypoint
 * chain imports it.
 */
import en from './locales/en';
import ru from './locales/ru';

export const fallbackResources = {
  en,
  ru,
};
