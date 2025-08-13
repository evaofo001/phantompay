import React, { useState } from 'react';
import { RotateCcw, Clock } from 'lucide-react';
import { Transaction } from '../types';

interface RepeatTransactionButtonProps {
  transaction: Transaction;
  onRepeat: (transaction: Transaction) => void;
  className?: string;
}

const RepeatTransactionButton: React.FC<RepeatTransactionButtonProps> = ({
  transaction,
  onRepeat,
  className = ''
}) => {
  const [isRepeating, setIsRepeating] = useState(false);

  const handleRepeat = async () => {
    if (isRepeating) return;
    
    setIsRepeating(true);
    try {
      await onRepeat(transaction);
    } finally {
      setIsRepeating(false);
    }
  };

  // Only show for certain transaction types
  const canRepeat = ['send', 'airtime', 'data'].includes(transaction.type);
  
  if (!canRepeat) return null;

  return (
    <button
      onClick={handleRepeat}
      disabled={isRepeating}
      className={`
        inline-flex items-center px-3 py-1 text-xs font-medium rounded-full
        bg-blue-50 text-blue-700 hover:bg-blue-100 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 hover:scale-105
        ${className}
      `}
      title="Repeat this transaction"
    >
      {isRepeating ? (
        <>
          <Clock className="h-3 w-3 mr-1 animate-spin" />
          Repeating...
        </>
      ) : (
        <>
          <RotateCcw className="h-3 w-3 mr-1" />
          Repeat
        </>
      )}
    </button>
  );
};

export default RepeatTransactionButton;