# TypeScript 快速开始指南

## 🚀 立即开始使用 TypeScript

### 第一步: 安装依赖

```bash
npm install
```

这会自动安装 TypeScript 和所有必要的类型定义。

### 第二步: 验证安装

```bash
npm run type-check
```

如果看到 "Found 0 errors",说明 TypeScript 配置成功!

## 📝 快速示例

### 示例 1: 使用现有类型定义

```typescript
import type { Note, BluesType } from './types';

// ✅ 正确 - 使用预定义的类型
const selectedKey: Note = 'A';
const bluesType: BluesType = 'minor';

// ❌ 错误 - TypeScript 会立即提示
const invalidNote: Note = 'H'; // Error!
const invalidType: BluesType = 'jazz'; // Error!
```

### 示例 2: 组件 Props 类型

```typescript
import type { ScalePracticeProps } from './types/components';

const ScalePractice: React.FC<ScalePracticeProps> = (props) => {
  // props 会有完整的类型提示和检查
  const { selectedKey, bluesType, scaleNotes, fretboardPositions } = props;
  
  return (
    <div>
      {/* 组件实现 */}
    </div>
  );
};
```

### 示例 3: 状态管理

```typescript
import { useState } from 'react';
import type { Note, ProgressionType } from './types';

function MyComponent() {
  // TypeScript 会自动推断类型
  const [bpm, setBpm] = useState(90); // number
  
  // 显式指定类型
  const [selectedKey, setSelectedKey] = useState<Note>('A');
  const [progression, setProgression] = useState<ProgressionType>('12bar');
  
  return <div>...</div>;
}
```

## 🎯 常见使用场景

### 场景 1: 定义和弦进行

```typescript
import type { ChordSection, ChordProgressions } from './types';

const chordProgressions: ChordProgressions = {
  '12bar': [
    { chord: 'I7', bars: 4, name: '主和弦' },
    { chord: 'IV7', bars: 2, name: '下属和弦' },
    { chord: 'I7', bars: 2, name: '主和弦' },
    // ...
  ]
};
```

### 场景 2: 处理指板位置

```typescript
import type { FretboardPosition } from './types';

const positions: FretboardPosition[] = [
  { string: 0, fret: 0, note: 'E', isRoot: true },
  { string: 0, fret: 3, note: 'G', isRoot: false },
  // ...
];

// TypeScript 会检查每个属性
positions.forEach((pos) => {
  console.log(`弦: ${pos.string}, 品: ${pos.fret}, 音符: ${pos.note}`);
});
```

### 场景 3: 事件处理

```typescript
import React from 'react';

function MyComponent() {
  // 按钮点击事件
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('点击位置:', e.clientX, e.clientY);
  };
  
  // 输入框变化事件
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('输入值:', e.target.value);
  };
  
  return (
    <div>
      <button onClick={handleClick}>点击</button>
      <input onChange={handleChange} />
    </div>
  );
}
```

## 🔧 实用技巧

### 技巧 1: 使用类型推断

```typescript
// ❌ 不必要的类型注解
const notes: string[] = ['C', 'D', 'E'];

// ✅ 让 TypeScript 自动推断
const notes = ['C', 'D', 'E']; // 推断为 string[]
```

### 技巧 2: 联合类型

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';

const [status, setStatus] = useState<Status>('idle');

// TypeScript 会检查值是否有效
setStatus('loading'); // ✅
setStatus('pending'); // ❌ Error!
```

### 技巧 3: 可选属性

```typescript
interface Config {
  required: string;
  optional?: number; // 可选
}

const config1: Config = { required: 'value' }; // ✅
const config2: Config = { required: 'value', optional: 42 }; // ✅
```

### 技巧 4: 数组类型

```typescript
import type { Note } from './types';

// 方式 1
const notes1: Note[] = ['C', 'D', 'E'];

// 方式 2
const notes2: Array<Note> = ['C', 'D', 'E'];
```

## 📚 查看完整文档

- **详细指南**: 查看 `TYPESCRIPT_GUIDE.md`
- **完整总结**: 查看 `TYPESCRIPT_SUMMARY.md`
- **示例代码**: 查看 `src/components/ScalePractice/index.tsx.example`

## ⚡ 开发工作流

### 1. 开发模式

```bash
npm run dev
```

在开发过程中,IDE 会实时显示类型错误。

### 2. 类型检查

```bash
npm run type-check
```

在提交代码前运行,确保没有类型错误。

### 3. 构建

```bash
npm run build
```

构建会自动进行类型检查。

## 🐛 常见问题

### Q1: 如何处理 "any" 类型?

```typescript
// ❌ 避免使用 any
const data: any = fetchData();

// ✅ 使用具体类型
const data: FretboardPosition[] = fetchData();

// ✅ 或使用 unknown 并进行类型检查
const data: unknown = fetchData();
if (Array.isArray(data)) {
  // 现在可以安全使用
}
```

### Q2: 如何处理第三方库没有类型?

在 `src/types/global.d.ts` 中添加:

```typescript
declare module 'library-name' {
  export function someFunction(): void;
}
```

### Q3: 如何处理 ref?

```typescript
import { useRef } from 'react';

// HTML 元素
const audioRef = useRef<HTMLAudioElement>(null);

// 自定义类型
const drumKitRef = useRef<IDrumKit>(null);
```

## 🎓 学习路径

### 初学者
1. ✅ 阅读本快速开始指南
2. ✅ 查看示例代码
3. ✅ 尝试添加类型到简单组件

### 进阶
1. 📖 阅读 `TYPESCRIPT_GUIDE.md`
2. 🔧 迁移工具类到 TypeScript
3. 🎯 迁移复杂组件

### 高级
1. 📚 学习高级类型 (泛型、条件类型等)
2. 🏗️ 设计复杂的类型系统
3. 🔍 优化类型性能

## 💡 最佳实践

### ✅ 推荐做法

```typescript
// 1. 使用类型推断
const count = 0; // 自动推断为 number

// 2. 使用联合类型
type Mode = 'scale' | 'chord' | 'rhythm';

// 3. 使用接口定义对象
interface User {
  name: string;
  age: number;
}

// 4. 使用类型别名定义复杂类型
type Callback = (value: string) => void;
```

### ❌ 避免做法

```typescript
// 1. 避免使用 any
const data: any = getData(); // ❌

// 2. 避免过度注解
const name: string = 'John'; // ❌ 不必要
const name = 'John'; // ✅ 自动推断

// 3. 避免类型断言滥用
const value = data as string; // ❌ 除非确实需要
```

## 🚀 下一步

1. **立即尝试**: 打开 IDE,开始添加类型注解
2. **查看示例**: 参考 `index.tsx.example` 文件
3. **逐步迁移**: 从简单文件开始,逐步迁移到 TypeScript

## 📞 获取帮助

- 查看 TypeScript 官方文档
- 查看项目中的 `TYPESCRIPT_GUIDE.md`
- 使用 IDE 的类型提示功能

---

**开始享受 TypeScript 带来的类型安全吧!** 🎉
