import { useState, useEffect } from 'react';
import { decryptData } from '../utils/crypto';
import { analyzeVaultHealth } from '../utils/vaultHealth';
import { API_BASE_URL } from '../api';

export function useVaultHealth(token, masterKey) {
  const [healthReport, setHealthReport] = useState(null);
  const [threatIntel, setThreatIntel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !masterKey) return;

    let isMounted = true;

    const syncVaultHealthMetrics = async () => {
      setLoading(true);
      try {
        const vaultRes = await fetch(`${API_BASE_URL}/api/vault`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (vaultRes.ok) {
          const vaultPayload = await vaultRes.json();
          const decryptedList = [];

          for (const entry of vaultPayload.items ?? []) {
            try {
              const decryptedPayload = await decryptData(
                entry.encryptedData,
                entry.iv,
                masterKey
              );
              decryptedList.push({
                id: entry._id,
                title: decryptedPayload.title || decryptedPayload.url || 'Untitled',
                url: decryptedPayload.url || '',
                username: decryptedPayload.username || '',
                password: decryptedPayload.password || '',
              });
            } catch (err) {
              console.error('[useVaultHealth] Item decryption failed:', entry._id);
            }
          }

          const report = await analyzeVaultHealth(decryptedList);
          if (isMounted) setHealthReport(report);
        }

        const threatRes = await fetch(`${API_BASE_URL}/api/auth/threat-intel`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (threatRes.ok && isMounted) {
          const intelPayload = await threatRes.json();
          setThreatIntel(intelPayload);
        }
      } catch (err) {
        console.error('[useVaultHealth] Health sync error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncVaultHealthMetrics();

    return () => {
      isMounted = false;
    };
  }, [token, masterKey]);

  return { healthReport, threatIntel, loading };
}
