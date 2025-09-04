import React from 'react';

interface CurrencyDisplayProps {
  currencies: {
    salvage: number;
    gold: number;
    platinum: number;
    adamantium: number;
  };
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  currencies
}) => {
  return (
    <div className="currency-display">
      <div className="currency-item salvage">
        <span>⚙</span> {currencies.salvage}
      </div>
      <div className="currency-item gold">
        <span>🟡</span> {currencies.gold}
      </div>
      <div className="currency-item platinum">
        <span>💎</span> {currencies.platinum}
      </div>
      <div className="currency-item adamantium">
        <span>🔶</span> {currencies.adamantium}
      </div>
    </div>
  );
};