# TypeScript 迁移检查清单

## 📋 迁移进度跟踪

使用此清单跟踪项目的 TypeScript 迁移进度。

## ✅ 已完成

### 基础设施
- [x] 创建 `tsconfig.json`
- [x] 创建 `tsconfig.node.json`
- [x] 更新 `package.json` 添加 TypeScript 依赖
- [x] 添加类型检查脚本

### 类型定义
- [x] 创建 `src/types/index.ts` (核心类型)
- [x] 创建 `src/types/components.ts` (组件类型)
- [x] 创建 `src/types/utils.ts` (工具类接口)
- [x] 创建 `src/types/global.d.ts` (全局声明)

### 文档
- [x] 创建 `TYPESCRIPT_QUICKSTART.md`
- [x] 创建 `TYPESCRIPT_GUIDE.md`
- [x] 创建 `TYPESCRIPT_SUMMARY.md`
- [x] 创建 `TYPESCRIPT_README.md`
- [x] 创建 `src/types/README.md`
- [x] 创建示例文件

## 🚧 待迁移

### 阶段 1: 工具类 (优先级: 高)

#### drumKit.js → drumKit.ts
- [ ] 重命名文件
- [ ] 添加类型导入
- [ ] 实现 `IDrumKit` 接口
- [ ] 添加方法参数类型
- [ ] 添加返回值类型
- [ ] 运行类型检查
- [ ] 修复类型错误

**迁移步骤:**
```bash
# 1. 重命名文件
mv src/utils/drumKit.js src/utils/drumKit.ts

# 2. 添加类型
# 在文件开头添加:
# import type { IDrumKit } from '../types/utils';
# 
# class DrumKit implements IDrumKit {
#   audioContext: AudioContext | null = null;
#   isInitialized: boolean = false;
#   ...
# }

# 3. 检查
npm run type-check
```

#### accompaniment.js → accompaniment.ts
- [ ] 重命名文件
- [ ] 添加类型导入
- [ ] 实现 `IAccompaniment` 接口
- [ ] 添加方法参数类型
- [ ] 添加返回值类型
- [ ] 运行类型检查
- [ ] 修复类型错误

#### cloudbase.js → cloudbase.ts
- [ ] 重命名文件
- [ ] 添加类型导入
- [ ] 实现 `ICloudBase` 接口
- [ ] 添加方法参数类型
- [ ] 添加返回值类型
- [ ] 运行类型检查
- [ ] 修复类型错误

### 阶段 2: 基础组件 (优先级: 中)

#### Navbar.jsx → Navbar.tsx
- [ ] 重命名文件
- [ ] 添加 React 类型导入
- [ ] 定义组件类型
- [ ] 添加事件处理类型
- [ ] 运行类型检查
- [ ] 修复类型错误

**迁移步骤:**
```bash
mv src/components/Navbar.jsx src/components/Navbar.tsx
```

```typescript
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };
  
  // ...
};
```

#### Footer.jsx → Footer.tsx
- [ ] 重命名文件
- [ ] 添加 React 类型导入
- [ ] 定义组件类型
- [ ] 运行类型检查
- [ ] 修复类型错误

### 阶段 3: 练习组件 (优先级: 中)

#### ScalePractice/index.jsx → index.tsx
- [ ] 重命名文件
- [ ] 导入 `ScalePracticeProps`
- [ ] 添加组件类型注解
- [ ] 添加状态类型
- [ ] 添加事件处理类型
- [ ] 运行类型检查
- [ ] 修复类型错误

**参考示例:**
```typescript
import type { ScalePracticeProps } from '../../types/components';

const ScalePractice: React.FC<ScalePracticeProps> = ({
  selectedKey,
  bluesType,
  scaleNotes,
  fretboardPositions
}) => {
  // 组件实现
};
```

#### ChordPractice/index.jsx → index.tsx
- [ ] 重命名文件
- [ ] 导入 `ChordPracticeProps`
- [ ] 添加组件类型注解
- [ ] 添加状态类型
- [ ] 添加 ref 类型
- [ ] 添加事件处理类型
- [ ] 运行类型检查
- [ ] 修复类型错误

**注意事项:**
- `drumKitRef` 需要类型: `useRef<IDrumKit>(null)`
- `accompanimentRef` 需要类型: `useRef<IAccompaniment>(null)`

#### RhythmPractice/index.jsx → index.tsx
- [ ] 重命名文件
- [ ] 导入 `RhythmPracticeProps`
- [ ] 添加组件类型注解
- [ ] 添加状态类型
- [ ] 运行类型检查
- [ ] 修复类型错误

#### Improvisation/index.jsx → index.tsx
- [ ] 重命名文件
- [ ] 导入 `ImprovisationProps`
- [ ] 添加组件类型注解
- [ ] 添加状态类型
- [ ] 运行类型检查
- [ ] 修复类型错误

### 阶段 4: 页面组件 (优先级: 低)

#### BluesPage.jsx → BluesPage.tsx
- [ ] 重命名文件
- [ ] 导入所需类型
- [ ] 添加组件类型注解
- [ ] 添加状态类型
- [ ] 添加回调函数类型
- [ ] 运行类型检查
- [ ] 修复类型错误

**状态类型示例:**
```typescript
import type { Note, BluesType, ProgressionType, PracticeMode } from '../types';

const [selectedKey, setSelectedKey] = useState<Note>('A');
const [bluesType, setBluesType] = useState<BluesType>('minor');
const [progression, setProgression] = useState<ProgressionType>('12bar');
const [practiceMode, setPracticeMode] = useState<PracticeMode>('improv');
```

#### TunerPage.jsx → TunerPage.tsx
- [ ] 重命名文件
- [ ] 导入所需类型
- [ ] 添加组件类型注解
- [ ] 添加状态类型
- [ ] 运行类型检查
- [ ] 修复类型错误

### 阶段 5: 入口文件 (优先级: 低)

#### App.jsx → App.tsx
- [ ] 重命名文件
- [ ] 添加类型导入
- [ ] 添加组件类型注解
- [ ] 添加状态类型
- [ ] 运行类型检查
- [ ] 修复类型错误

#### main.jsx → main.tsx
- [ ] 重命名文件
- [ ] 添加类型导入(如需要)
- [ ] 运行类型检查
- [ ] 修复类型错误

## 📊 进度统计

### 总体进度
- 基础设施: 4/4 (100%) ✅
- 类型定义: 4/4 (100%) ✅
- 文档: 6/6 (100%) ✅
- 工具类: 0/3 (0%) ⏳
- 基础组件: 0/2 (0%) ⏳
- 练习组件: 0/4 (0%) ⏳
- 页面组件: 0/2 (0%) ⏳
- 入口文件: 0/2 (0%) ⏳

### 文件统计
- 已迁移: 0 个
- 待迁移: 13 个
- 总计: 13 个

## 🎯 每个阶段的验收标准

### 工具类迁移完成标准
- [x] 文件已重命名为 .ts
- [x] 实现了对应的接口
- [x] 所有方法都有类型注解
- [x] `npm run type-check` 无错误
- [x] 功能测试通过

### 组件迁移完成标准
- [x] 文件已重命名为 .tsx
- [x] 使用了正确的 Props 类型
- [x] 状态有明确的类型
- [x] 事件处理有正确的类型
- [x] `npm run type-check` 无错误
- [x] 组件渲染正常

## 🔍 常见问题处理

### 问题 1: 第三方库没有类型定义

**解决方案:**
在 `src/types/global.d.ts` 中添加声明:
```typescript
declare module 'library-name' {
  export function someFunction(): void;
}
```

### 问题 2: any 类型错误

**解决方案:**
1. 尽量使用具体类型
2. 如果确实不知道类型,使用 `unknown`
3. 添加类型断言(谨慎使用)

### 问题 3: ref 类型错误

**解决方案:**
```typescript
// HTML 元素
const audioRef = useRef<HTMLAudioElement>(null);

// 自定义类型
const drumKitRef = useRef<IDrumKit>(null);
```

### 问题 4: 事件类型错误

**解决方案:**
```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...
};
```

## 📝 迁移最佳实践

### 1. 逐步迁移
- 一次迁移一个文件
- 迁移后立即测试
- 确保功能正常后再继续

### 2. 优先级排序
1. 工具类(被多处使用)
2. 基础组件(被多处引用)
3. 业务组件
4. 页面组件
5. 入口文件

### 3. 类型检查
每次迁移后运行:
```bash
npm run type-check
npm run dev  # 确保应用正常运行
```

### 4. 提交策略
- 每完成一个文件的迁移就提交
- 提交信息格式: `chore: migrate [FileName] to TypeScript`

## 🚀 开始迁移

### 推荐迁移顺序

1. **第一步: 工具类** (最重要)
   ```bash
   # 迁移 drumKit
   mv src/utils/drumKit.js src/utils/drumKit.ts
   # 添加类型,运行检查
   npm run type-check
   ```

2. **第二步: 简单组件**
   ```bash
   # 迁移 Navbar
   mv src/components/Navbar.jsx src/components/Navbar.tsx
   npm run type-check
   ```

3. **第三步: 复杂组件**
   - 参考示例文件
   - 逐步添加类型
   - 频繁运行类型检查

## 📞 需要帮助?

- 查看 `TYPESCRIPT_QUICKSTART.md`
- 查看 `TYPESCRIPT_GUIDE.md`
- 查看示例文件: `src/components/ScalePractice/index.tsx.example`
- 参考 TypeScript 官方文档

---

**开始迁移,享受类型安全!** 🎉

_最后更新: 2025-10-17_
