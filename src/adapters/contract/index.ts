import type { ContractProvider } from '@/core/ports/contract-provider';
import { createModusignProvider } from './modusign';
import { createDummyContractProvider } from './dummy';

let _cachedProvider: ContractProvider | null = null;

export function getContractProvider(): ContractProvider {
  if (_cachedProvider) return _cachedProvider;

  const apiKey = process.env.MODUSIGN_API_KEY;

  if (apiKey) {
    _cachedProvider = createModusignProvider(apiKey);
  } else {
    console.warn('[Contract] MODUSIGN_API_KEY not set — using dummy contract provider');
    _cachedProvider = createDummyContractProvider();
  }

  return _cachedProvider;
}
