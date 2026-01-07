// Minimal stub to satisfy host-editor TypeScript when node_modules is inside Docker
// Runtime uses real framer-motion in the container; this file only prevents red squiggles locally.
declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
  export type Variants = any;
  export type Transition = any;
}
