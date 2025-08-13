import { useState, useEffect } from 'react';

interface OfflineTransaction {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  synced: boolean;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingTransactions, setPendingTransactions] = useState<OfflineTransaction[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending transactions from localStorage
    loadPendingTransactions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingTransactions = () => {
    const stored = localStorage.getItem('offline_transactions');
    if (stored) {
      const transactions = JSON.parse(stored).map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp)
      }));
      setPendingTransactions(transactions);
    }
  };

  const addOfflineTransaction = (type: string, data: any) => {
    const transaction: OfflineTransaction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      synced: false
    };

    const updated = [...pendingTransactions, transaction];
    setPendingTransactions(updated);
    localStorage.setItem('offline_transactions', JSON.stringify(updated));

    return transaction.id;
  };

  const syncPendingTransactions = async () => {
    if (!isOnline || pendingTransactions.length === 0) return;

    const unsynced = pendingTransactions.filter(t => !t.synced);
    
    for (const transaction of unsynced) {
      try {
        // Simulate API call to sync transaction
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark as synced
        transaction.synced = true;
        console.log(`Synced offline transaction: ${transaction.type}`);
      } catch (error) {
        console.error(`Failed to sync transaction ${transaction.id}:`, error);
      }
    }

    // Update state and localStorage
    const updated = pendingTransactions.map(t => 
      unsynced.find(u => u.id === t.id) ? { ...t, synced: true } : t
    );
    
    setPendingTransactions(updated);
    localStorage.setItem('offline_transactions', JSON.stringify(updated));

    // Remove synced transactions older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = updated.filter(t => !t.synced || t.timestamp > oneDayAgo);
    
    if (filtered.length !== updated.length) {
      setPendingTransactions(filtered);
      localStorage.setItem('offline_transactions', JSON.stringify(filtered));
    }
  };

  return {
    isOnline,
    pendingTransactions: pendingTransactions.filter(t => !t.synced),
    addOfflineTransaction,
    syncPendingTransactions
  };
};