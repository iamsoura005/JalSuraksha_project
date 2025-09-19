'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plasma with no SSR to prevent hydration issues
const Plasma = dynamic(() => import('./Plasma'), { 
  ssr: false,
  loading: () => <div className="plasma-container bg-gradient-to-b from-blue-900/50 to-indigo-900/50" />
});

export default function PlasmaBackground({ 
  color = '#2f3bad',
  speed = 0.6,
  direction = 'downward',
  scale = 1.1,
  opacity = 0.8,
  mouseInteractive = true
}) {
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (hasError || !isClient) {
    // Fallback gradient background if Plasma fails or during SSR
    return <div className="plasma-container bg-gradient-to-b from-blue-900/50 to-indigo-900/50" />;
  }
  
  return (
    <>
      {/* Error boundary wrapper */}
      <ErrorBoundary onError={() => setHasError(true)}>
        <Plasma 
          color={color}
          speed={speed}
          direction={direction}
          scale={scale}
          opacity={opacity}
          mouseInteractive={mouseInteractive}
        />
      </ErrorBoundary>
    </>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('PlasmaBackground failed to render:', error, info);
    if (this.props.onError) this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent will handle fallback
    }
    return this.props.children;
  }
}