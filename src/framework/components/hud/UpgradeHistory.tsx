import React from 'react';

interface UpgradeHistoryItem {
  id: string;
  name: string;
  icon: string;
  timestamp: number;
}

interface UpgradeHistoryProps {
  history: UpgradeHistoryItem[];
}

export const UpgradeHistory: React.FC<UpgradeHistoryProps> = ({
  history
}) => {
  // Show most recent upgrades (up to 8)
  const recentUpgrades = history.slice(-8).reverse();

  if (recentUpgrades.length === 0) {
    return null;
  }

  return (
    <div className="upgrade-history">
      {recentUpgrades.map((upgrade) => (
        <div key={`${upgrade.id}-${upgrade.timestamp}`} className="upgrade-history-item">
          <div className="upgrade-history-icon">
            <span>{upgrade.icon}</span>
          </div>
          <div className="upgrade-history-text">
            {upgrade.name}
          </div>
        </div>
      ))}
    </div>
  );
};