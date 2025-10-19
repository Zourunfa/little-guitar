# Types 目录说明

本目录包含项目的所有 TypeScript 类型定义。

## 📁 文件结构

```
types/
├── index.ts          # 核心类型定义
├── components.ts     # 组件 Props 类型
├── utils.ts          # 工具类接口定义
├── global.d.ts       # 全局类型声明
└── README.md         # 本文件
```

## 📖 文件说明

### index.ts - 核心类型定义

包含项目的核心业务类型:

#### 基础类型
- `Note` - 音符类型
- `BluesType` - Blues 类型
- `ProgressionType` - 和弦进行类型
- `PracticeMode` - 练习模式
- `ChordDegree` - 和弦级数
- `DrumPattern` - 鼓声节奏型

#### 接口定义
- `ChordSection` - 和弦进行段落
- `ExpandedChord` - 展开的和弦信息
- `FretboardPosition` - 指板位置
- `RhythmPattern` - 节奏模式
- `ChordProgressions` - 和弦进行配置
- `BluesScales` - Blues 音阶配置
- `AudioConfig` - 音频配置

### components.ts - 组件类型

包含所有 React 组件的 Props 类型定义:

- `ScalePracticeProps` - 音阶练习组件
- `ChordPracticeProps` - 和弦练习组件
- `RhythmPracticeProps` - 节奏练习组件
- `ImprovisationProps` - 即兴创作组件

### utils.ts - 工具类接口

包含工具类的接口定义:

- `IDrumKit` - 鼓组工具类接口
- `IAccompaniment` - 伴奏工具类接口
- `ICloudBase` - 云开发配置接口

### global.d.ts - 全局声明

包含全局类型声明:

- Window 对象扩展
- 第三方库类型声明
- CSS Modules 类型
- 图片资源类型

## 🔍 快速查找

### 查找音符相关类型
→ `index.ts` - `Note`, `ChordDegree`

### 查找 Blues 相关类型
→ `index.ts` - `BluesType`, `BluesScales`

### 查找指板相关类型
→ `index.ts` - `FretboardPosition`

### 查找组件 Props
→ `components.ts` - 所有组件的 Props 类型

### 查找工具类接口
→ `utils.ts` - 工具类接口定义

## 💡 使用示例

### 导入核心类型

```typescript
import type { Note, BluesType, FretboardPosition } from '@/types';
```

### 导入组件类型

```typescript
import type { ScalePracticeProps } from '@/types/components';
```

### 导入工具类接口

```typescript
import type { IDrumKit } from '@/types/utils';
```

## 📝 类型命名规范

### 类型别名 (Type Alias)
- 使用 PascalCase
- 简单类型使用 type
- 例如: `Note`, `BluesType`

### 接口 (Interface)
- 使用 PascalCase
- 对象类型使用 interface
- 例如: `FretboardPosition`, `ChordSection`

### 接口前缀
- 工具类接口使用 `I` 前缀
- 例如: `IDrumKit`, `IAccompaniment`

### Props 类型
- 组件 Props 使用 `ComponentNameProps` 格式
- 例如: `ScalePracticeProps`

## 🔧 维护指南

### 添加新类型

1. **确定类型归属**
   - 核心业务类型 → `index.ts`
   - 组件 Props → `components.ts`
   - 工具类接口 → `utils.ts`
   - 全局声明 → `global.d.ts`

2. **编写类型定义**
   ```typescript
   // 添加 JSDoc 注释
   /**
    * 新类型的说明
    */
   export type NewType = 'value1' | 'value2';
   ```

3. **导出类型**
   ```typescript
   export type { NewType };
   ```

### 修改现有类型

1. 检查类型的使用位置
2. 评估修改影响范围
3. 更新类型定义
4. 运行类型检查: `npm run type-check`
5. 修复所有类型错误

### 删除类型

1. 确认类型未被使用
2. 删除类型定义
3. 运行类型检查确认

## ⚠️ 注意事项

### 1. 保持类型简洁
- 避免过度复杂的类型定义
- 优先使用简单的联合类型和接口

### 2. 使用语义化命名
- 类型名称应该清晰表达其用途
- 避免使用缩写

### 3. 添加注释
- 为复杂类型添加 JSDoc 注释
- 说明类型的用途和约束

### 4. 避免循环依赖
- 合理组织类型文件
- 避免文件之间的循环引用

## 📚 相关文档

- [TypeScript 快速开始](../../../TYPESCRIPT_QUICKSTART.md)
- [TypeScript 使用指南](../../../TYPESCRIPT_GUIDE.md)
- [TypeScript 完整总结](../../../TYPESCRIPT_SUMMARY.md)

## 🎯 类型覆盖清单

### 核心类型 ✅
- [x] 音符系统
- [x] Blues 音阶系统
- [x] 和弦进行系统
- [x] 指板系统
- [x] 练习模式
- [x] 音频系统

### 组件类型 ✅
- [x] ScalePractice
- [x] ChordPractice
- [x] RhythmPractice
- [x] Improvisation

### 工具类型 ✅
- [x] DrumKit
- [x] Accompaniment
- [x] CloudBase

---

**保持类型定义的更新和准确性是项目质量的重要保证!** 🎯
