/**
 * 全局类型声明文件
 */

/// <reference types="vite/client" />

/**
 * Window 对象扩展
 */
interface Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * 第三方库类型声明
 */
declare module 'pitchy' {
  export class PitchDetector {
    constructor(sampleRate: number);
    findPitch(buffer: Float32Array, sampleRate: number): [number, number];
  }
}

declare module 'teoria' {
  export function note(name: string): {
    name(): string;
    scientific(): string;
    fq(): number;
    midi(): number;
  };
}

/**
 * CSS Modules
 */
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

/**
 * 图片资源
 */
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
