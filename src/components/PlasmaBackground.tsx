'use client';

import { useState, useEffect } from 'react';
import React from 'react';

// Simple fallback background component
const FallbackBackground = () => (
  <div className="plasma-container bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-indigo-900/30 animate-pulse" />
);

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
  const [PlasmaComponent, setPlasmaComponent] = useState<React.ComponentType<{
    color?: string;
    speed?: number;
    direction?: string;
    scale?: number;
    opacity?: number;
    mouseInteractive?: boolean;
  }> | null>(null);
  
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import Plasma only in browser environment
    if (typeof window !== 'undefined') {
      // Check for WebGL support before loading Plasma
      try {
        const canvas = document.createElement('canvas');
        const hasWebGL = !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        
        if (hasWebGL) {
          import('./Plasma')
            .then((module) => {
              setPlasmaComponent(() => module.default);
            })
            .catch((error) => {
              console.warn('Failed to load Plasma component:', error);
              setHasError(true);
            });
        } else {
          console.warn('WebGL not supported, using fallback background');
          setHasError(true);
        }
      } catch (error) {
        console.warn('Error checking WebGL support:', error);
        setHasError(true);
      }
    }
  }, []);
  
  // Show fallback during SSR or if there's an error
  if (!isClient || hasError || !PlasmaComponent) {
    return <FallbackBackground />;
  }
  
  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <PlasmaComponent 
        color={color}
        speed={speed}
        direction={direction}
        scale={scale}
        opacity={opacity}
        mouseInteractive={mouseInteractive}
      />
    </ErrorBoundary>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError?: () => void;
}, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('PlasmaBackground failed to render:', error, info);
    if (this.props.onError) this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return <FallbackBackground />;
    }
    return this.props.children;
  }
}