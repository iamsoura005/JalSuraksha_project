'use client';

import Plasma from './Plasma';

export default function PlasmaBackground({ 
  color = '#ff6b35',
  speed = 0.6,
  direction = 'forward',
  scale = 1.1,
  opacity = 0.8,
  mouseInteractive = true
}) {
  return (
    <Plasma 
      color={color}
      speed={speed}
      direction={direction}
      scale={scale}
      opacity={opacity}
      mouseInteractive={mouseInteractive}
    />
  );
}