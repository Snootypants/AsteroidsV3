import React, { useRef, useState } from 'react';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  effects: {
    label: string;
    value: string | number;
    isPositive?: boolean;
  }[];
  tags?: string[];
}

interface UpgradeCardProps {
  upgrade: UpgradeDefinition;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const UpgradeCard: React.FC<UpgradeCardProps> = ({
  upgrade,
  selected = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = ((y - centerY) / centerY) * -10; // Invert Y for natural tilt
    const tiltY = ((x - centerX) / centerX) * 10;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const cardClasses = [
    'card',
    selected && 'selected',
    disabled && 'disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={cardRef}
      className={cardClasses}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
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
        </div>
      </div>
    </div>
  );
};