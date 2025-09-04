import React, { useRef, useState } from 'react';
import { UpgradeDefinition } from './UpgradeCard';

interface ShopCardProps {
  upgrade: UpgradeDefinition & {
    cost: {
      salvage?: number;
      gold?: number;
      platinum?: number;
      adamantium?: number;
    };
    purchased?: boolean;
    banished?: boolean;
  };
  canAfford: boolean;
  onPurchase?: () => void;
  onBanish?: () => void;
  className?: string;
}

export const ShopCard: React.FC<ShopCardProps> = ({
  upgrade,
  canAfford,
  onPurchase,
  onBanish,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (upgrade.purchased || upgrade.banished) return;
    
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleClick = () => {
    if (!upgrade.purchased && !upgrade.banished && canAfford && onPurchase) {
      onPurchase();
    }
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!upgrade.purchased && !upgrade.banished && onBanish) {
      onBanish();
    }
  };

  const cardClasses = [
    'card',
    upgrade.purchased && 'purchased',
    upgrade.banished && 'banished',
    !canAfford && !upgrade.purchased && !upgrade.banished && 'cannot-afford',
    className
  ].filter(Boolean).join(' ');

  const costEntries = Object.entries(upgrade.cost).filter(([, amount]) => amount > 0);

  return (
    <div 
      ref={cardRef}
      className={cardClasses}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      title={
        upgrade.purchased ? 'Already purchased' :
        upgrade.banished ? 'Banished from shop' :
        !canAfford ? 'Cannot afford this upgrade' :
        'Click to purchase • Right-click to banish'
      }
    >
      <div 
        className="card-inner"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
        }}
      >
        <div className={`card-face ${upgrade.rarity}`}>
          {/* Card Header */}
          <div className="card-header">
            <h3 className="card-title">{upgrade.name}</h3>
            <p className={`card-rarity ${upgrade.rarity}`}>
              {upgrade.rarity}
            </p>
          </div>

          {/* Card Icon */}
          <div className="card-icon">
            <div 
              className="card-icon-image"
              style={{ 
                fontSize: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              {upgrade.icon}
            </div>
          </div>

          {/* Card Description */}
          <div className="card-description">
            <p className="card-text">
              {upgrade.description}
            </p>

            {/* Card Effects/Stats */}
            {upgrade.effects.length > 0 && (
              <div className="card-stats">
                {upgrade.effects.map((effect, index) => (
                  <div key={index} className="card-stat">
                    <span className="card-stat-label">{effect.label}:</span>
                    <span 
                      className={`card-stat-value ${
                        effect.isPositive === true ? 'positive' : 
                        effect.isPositive === false ? 'negative' : ''
                      }`}
                    >
                      {typeof effect.value === 'number' 
                        ? effect.value.toFixed(effect.value % 1 === 0 ? 0 : 2)
                        : effect.value
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Card Tags */}
            {upgrade.tags && upgrade.tags.length > 0 && (
              <div style={{ 
                marginTop: '12px', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '4px' 
              }}>
                {upgrade.tags.map((tag, index) => (
                  <span 
                    key={index}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'rgba(120, 150, 255, 0.2)',
                      borderRadius: '3px',
                      opacity: 0.8
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card Footer - Cost */}
          {costEntries.length > 0 && (
            <div className="card-footer">
              <div className="card-cost">
                {costEntries.map(([currency, amount]) => (
                  <div key={currency} className={`card-cost-item ${currency}`}>
                    <span className="card-cost-icon">
                      {currency === 'salvage' && '⚙'}
                      {currency === 'gold' && '🟡'}
                      {currency === 'platinum' && '💎'}
                      {currency === 'adamantium' && '🔶'}
                    </span>
                    {amount}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase/Banish Status Overlay */}
          {upgrade.purchased && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#90ff90',
              fontSize: '24px',
              fontWeight: 'bold',
              backdropFilter: 'blur(2px)'
            }}>
              PURCHASED
            </div>
          )}

          {upgrade.banished && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ff9090',
              fontSize: '24px',
              fontWeight: 'bold',
              backdropFilter: 'blur(2px)'
            }}>
              BANISHED
            </div>
          )}
        </div>
      </div>
    </div>
  );
};