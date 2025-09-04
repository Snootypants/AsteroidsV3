import React from 'react';

interface FrameCounterProps {
  fps: number;
  frameTime: number;
}

export const FrameCounter: React.FC<FrameCounterProps> = ({
  fps,
  frameTime
}) => {
  return (
    <div className="frame-counter">
      {Math.round(fps)} FPS ({frameTime.toFixed(1)}ms)
    </div>
  );
};