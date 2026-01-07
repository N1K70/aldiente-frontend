declare module 'liquid-glass-react' {
  import React from 'react';

  interface LiquidGlassProps {
    displacementScale?: number;
    blurAmount?: number;
    saturation?: number;
    aberrationIntensity?: number;
    elasticity?: number;
    cornerRadius?: number;
    children?: React.ReactNode;
  }

  const LiquidGlass: React.FC<LiquidGlassProps>;
  export default LiquidGlass;
}
