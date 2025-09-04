import React, { useState } from 'react';
import { GameState } from '../../hooks/useGameState';

interface StatusConsoleProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
}

export const StatusConsole: React.FC<StatusConsoleProps> = ({
  gameState,
  onUpdateGameState
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleLog = () => {
    onUpdateGameState({
      debug: {
        ...gameState.debug,
        showStatusConsole: !gameState.debug.showStatusConsole
      }
    });
  };

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleCopyLog = async () => {
    try {
      const logText = gameState.debug.logs.join('\n');
      await navigator.clipboard.writeText(logText);
      console.log('Log copied to clipboard');
    } catch (err) {
      console.error('Failed to copy log:', err);
    }
  };

  if (!gameState.debug.showStatusConsole) {
    return (
      <button className="log-toggle" onClick={handleToggleLog}>
        Show Log
      </button>
    );
  }

  return (
    <>
      <button className="log-toggle" onClick={handleToggleLog}>
        Hide Log
      </button>
      
      <div className={`status-console show ${collapsed ? 'collapsed' : ''}`}>
        <button className="status-collapse" onClick={handleCollapse} title="Collapse">
          {collapsed ? '+' : '−'}
        </button>
        
        <button className="status-copy" onClick={handleCopyLog} title="Copy log">
          📋
        </button>
        
        <div className="status-line">
          System Status: {gameState.debug.logs.length} log entries
        </div>
        
        {!collapsed && (
          <pre className="status-log">
            {gameState.debug.logs.slice(-50).map((log, index) => {
              if (log.includes('ERROR') || log.includes('Error')) {
                return (
                  <div key={index} className="error-block">
                    {log}
                  </div>
                );
              } else if (log.includes('HINT') || log.includes('TIP')) {
                return (
                  <div key={index} className="hint-block">
                    {log}
                  </div>
                );
              }
              return log + '\n';
            }).join('')}
          </pre>
        )}
      </div>
    </>
  );
};