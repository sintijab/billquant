import { RootState } from '@/store';

// Helper to extract results array from price response
function extractResults(priceObj: any): any[] {
  if (!priceObj) return [];
  if (Array.isArray(priceObj.results)) return priceObj.results;
  if (Array.isArray(priceObj.Results)) return priceObj.Results;
  if (Array.isArray(priceObj)) return priceObj;
  if (priceObj.results && Array.isArray(priceObj.results)) return priceObj.results;
  if (priceObj.Results && Array.isArray(priceObj.Results)) return priceObj.Results;
  return [];
}

// Selector to get all prices for a given activity and source (dei, pat, piemonte)
// Selector to get all price items for a given activity and source (dei, pat, piemonte)
export const selectActivityPrices = (activity: string, source: 'dei' | 'pat' | 'piemonte') => (state: RootState) => {
  const entry = state.boq.categories[activity];
  if (!entry) return [];
  if (source === 'dei') return Array.isArray(entry.deiItems) ? entry.deiItems : [];
  if (source === 'pat') return Array.isArray(entry.patItems) ? entry.patItems : [];
  if (source === 'piemonte') return Array.isArray(entry.piemonteItems) ? entry.piemonteItems : [];
  return [];
};

// Selector to get all price items for an activity, merged from all sources
export const selectAllActivityPrices = (activity: string) => (state: RootState) => {
  const entry = state.boq.categories[activity];
  if (!entry) return [];
  const dei = Array.isArray(entry.deiItems) ? entry.deiItems : [];
  const pat = Array.isArray(entry.patItems) ? entry.patItems : [];
  const piemonte = Array.isArray(entry.piemonteItems) ? entry.piemonteItems : [];
  return [...dei, ...pat, ...piemonte];
};

// Selector to get all price items for all activities, merged for unified table
export const selectAllTableItems = (state: RootState) => {
  const all: any[] = [];
  for (const activity in state.boq.categories) {
    const entry = state.boq.categories[activity];
    if (!entry) continue;
    const dei = Array.isArray(entry.deiItems) ? entry.deiItems : [];
    const pat = Array.isArray(entry.patItems) ? entry.patItems : [];
    const piemonte = Array.isArray(entry.piemonteItems) ? entry.piemonteItems : [];
    all.push(...[...dei, ...pat, ...piemonte].map(item => ({ ...item, activityName: activity })));
  }
  return all;
};
