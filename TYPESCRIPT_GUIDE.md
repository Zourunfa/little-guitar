# TypeScript 使用指南

## 概述

本项目已添加完整的 TypeScript 类型支持,以提高代码质量和可维护性。

## 类型定义文件结构

```
src/types/
├── index.ts          # 核心类型定义
├── components.ts     # 组件 Props 类型
├── utils.ts          # 工具类接口定义
└── global.d.ts       # 全局类型声明
```

## 核心类型

### 基础类型

```typescript
// 音符类型
type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

// Blues 类型
type BluesType = 'minor' | 'major' | 'mixolydian';

// 和弦进行类型
type ProgressionType = '12bar' | 'quick';

// 练习模式
type PracticeMode = 'scale' | 'chord' | 'rhythm' | 'improv';
```

### 接口定义

```typescript
// 指板位置
interface FretboardPosition {
  string: number;   // 弦号 (0-5)
  fret: number;     // 品位 (0-20)
  note: string;     // 音符名称
  isRoot: boolean;  // 是否为根音
}

// 和弦进行段落
interface ChordSection {
  chord: ChordDegree;
  bars: number;
  name: string;
}
```

## 组件类型使用示例

### ScalePractice 组件

```typescript
import type { ScalePracticeProps } from '@/types/components';

const ScalePractice: React.FC<ScalePracticeProps> = ({
  selectedKey,
  bluesType,
  scaleNotes,
  fretboardPositions
}) => {
  // 组件实现
};
```

### ChordPractice 组件

```typescript
import type { ChordPracticeProps } from '@/types/components';

const ChordPractice: React.FC<ChordPracticeProps> = ({
  selectedKey,
  bluesType,
  progression,
  setProgression,
  // ... 其他 props
}) => {
  // 组件实现
};
```

## 工具类类型使用

### DrumKit

```typescript
import type { IDrumKit } from '@/types/utils';

class DrumKit implements IDrumKit {
  audioContext: AudioContext | null = null;
  isInitialized: boolean = false;
  
  init(): void {
    // 实现
  }
  
  playKick(time = 0, volume = 0.8): void {
    // 实现
  }
}
```

### Accompaniment

```typescript
import type { IAccompaniment } from '@/types/utils';

class Accompaniment implements IAccompaniment {
  // 实现
}
```

## 迁移步骤

### 1. 安装 TypeScript 依赖

```bash
npm install -D typescript @types/node
```

### 2. 将 .jsx 文件重命名为 .tsx

```bash
# 组件文件
mv src/App.jsx src/App.tsx
mv src/main.jsx src/main.tsx

# 页面文件
mv src/pages/BluesPage.jsx src/pages/BluesPage.tsx
mv src/pages/TunerPage.jsx src/pages/TunerPage.tsx

# 组件文件
mv src/components/Navbar.jsx src/components/Navbar.tsx
# ... 其他组件
```

### 3. 将 .js 工具类文件重命名为 .ts

```bash
mv src/utils/drumKit.js src/utils/drumKit.ts
mv src/utils/accompaniment.js src/utils/accompaniment.ts
mv src/utils/cloudbase.js src/utils/cloudbase.ts
```

### 4. 添加类型注解

在组件中添加 Props 类型:

```typescript
// 之前
const MyComponent = ({ prop1, prop2 }) => {
  // ...
}

// 之后
import type { MyComponentProps } from '@/types/components';

const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // ...
}
```

### 5. 更新 package.json 构建脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

## 类型检查

运行类型检查:

```bash
npm run type-check
```

## 最佳实践

### 1. 使用严格模式

tsconfig.json 已启用严格模式,确保类型安全:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. 避免使用 any

尽量使用具体类型,避免 `any`:

```typescript
// ❌ 不推荐
const data: any = fetchData();

// ✅ 推荐
const data: FretboardPosition[] = fetchData();
```

### 3. 使用类型推断

TypeScript 可以自动推断类型:

```typescript
// 不需要显式声明
const notes = ['C', 'D', 'E']; // 推断为 string[]
const count = 0; // 推断为 number
```

### 4. 使用联合类型

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';

const [status, setStatus] = useState<Status>('idle');
```

### 5. 使用可选属性

```typescript
interface Config {
  required: string;
  optional?: number;
}
```

## 常见问题

### Q: 如何处理第三方库没有类型定义?

A: 在 `src/types/global.d.ts` 中添加模块声明:

```typescript
declare module 'library-name' {
  export function someFunction(): void;
}
```

### Q: 如何处理事件类型?

A: 使用 React 提供的事件类型:

```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...
};
```

### Q: 如何处理 ref 类型?

A: 使用 React.RefObject:

```typescript
const audioRef = useRef<HTMLAudioElement>(null);
const drumKitRef = useRef<IDrumKit>(null);
```

## 渐进式迁移

不需要一次性迁移所有文件,可以:

1. 先迁移核心类型定义 ✅ (已完成)
2. 逐步迁移工具类 (.js → .ts)
3. 逐步迁移组件 (.jsx → .tsx)
4. 最后迁移页面文件

## 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
