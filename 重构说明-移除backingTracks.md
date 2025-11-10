# 重构说明：移除 backingTracks 静态配置

## 📋 重构目标

将音频配置从 `AudioBackingTrack` 类的静态配置移到 `ChordPractice` 组件的 `getAvailableAudioFiles()` 函数中，实现更灵活的配置管理。

## ✅ 完成的修改

### 1. **AudioBackingTrack 类重构** (`src/utils/audioBackingTrack.ts`)

#### 移除内容
- ❌ 删除了 `backingTracks` 静态配置对象（12个调的硬编码配置）

#### 新增内容
- ✅ 添加了 `trackConfigs: Map<BackingTrackKey, BackingTrackConfig>` 动态配置存储
- ✅ 所有配置通过 `updateTrackConfig()` 方法动态设置

#### 修改的方法

**`preloadTrack(key, url?)`**
```typescript
// 之前：从 backingTracks[key] 读取 URL
const trackConfig = this.backingTracks[key];

// 现在：从 trackConfigs Map 读取，或使用传入的 URL
const trackConfig = this.trackConfigs.get(key);
const audioUrl = url || trackConfig?.url;
```

**`play(targetBPM)`**
```typescript
// 之前：从 backingTracks 读取 originalBPM
const trackConfig = this.backingTracks[this.currentKey];
const playbackRate = targetBPM / trackConfig.originalBPM;

// 现在：从 trackConfigs Map 读取，提供默认值
const trackConfig = this.trackConfigs.get(this.currentKey);
const originalBPM = trackConfig?.originalBPM || 120;
const playbackRate = targetBPM / originalBPM;
```

**`updateTrackConfig(key, config)`**
```typescript
// 之前：更新静态对象
this.backingTracks[key] = { ...this.backingTracks[key], ...config };

// 现在：更新 Map
const existingConfig = this.trackConfigs.get(key) || { key, url: '', originalBPM: 120 };
this.trackConfigs.set(key, { ...existingConfig, ...config, key });
```

**`isTrackAvailable(key)`**
```typescript
// 之前：检查静态配置
return !!this.backingTracks[key].url;

// 现在：检查 Map
const config = this.trackConfigs.get(key);
return !!config?.url;
```

**`getAvailableKeys()`**
```typescript
// 之前：过滤静态对象
return Object.keys(this.backingTracks).filter(key =>
  this.backingTracks[key as BackingTrackKey].url
) as BackingTrackKey[];

// 现在：遍历 Map
const keys: BackingTrackKey[] = [];
this.trackConfigs.forEach((config, key) => {
  if (config.url) keys.push(key);
});
return keys;
```

### 2. **ChordPractice 组件增强** (`src/components/ChordPractice/index.tsx`)

#### 扩展音频配置类型
```typescript
const audioFilesByKey: Record<BackingTrackKey, Array<{ 
  name: string; 
  url: string; 
  bpm: number; 
  description?: string;
  startOffset?: number; // 🆕 音频起始偏移时间（秒）
  loopStart?: number;   // 🆕 循环起始点（秒）
  loopEnd?: number;     // 🆕 循环结束点（秒）
}>>
```

#### 更新 `handleSelectAudioFromUrl` 函数
```typescript
// 之前：只传递 URL 和 BPM
const handleSelectAudioFromUrl = async (key, url, bpm?) => {
  audioBackingTrackRef.current.updateTrackConfig(key, {
    url: url,
    originalBPM: bpm || 120,
  });
}

// 现在：传递完整配置
const handleSelectAudioFromUrl = async (
  key, url, bpm?, startOffset?, loopStart?, loopEnd?
) => {
  audioBackingTrackRef.current.updateTrackConfig(key, {
    url: url,
    originalBPM: bpm || 120,
    startOffset: startOffset,
    loopStart: loopStart,
    loopEnd: loopEnd,
  });
}
```

#### 更新所有调用点
```typescript
// 自动加载第一个音频
handleSelectAudioFromUrl(
  selectedKeyForDrawer, 
  firstAudio.url, 
  firstAudio.bpm,
  firstAudio.startOffset,
  firstAudio.loopStart,
  firstAudio.loopEnd
);

// 用户点击选择音频
onClick={() => handleSelectAudioFromUrl(
  selectedKeyForDrawer, 
  audio.url, 
  audio.bpm,
  audio.startOffset,
  audio.loopStart,
  audio.loopEnd
)}
```

## 🎯 优势

### 1. **配置集中化**
- ✅ 所有音频文件配置在 `getAvailableAudioFiles()` 中统一管理
- ✅ 不需要在两个地方（`audioBackingTrack.ts` 和 `ChordPractice/index.tsx`）维护配置

### 2. **支持多文件**
- ✅ 同一个调可以有多个音频文件（如 A.mp3 和 A2.mp4）
- ✅ 每个文件可以有不同的 BPM、startOffset 等参数

### 3. **更灵活**
- ✅ 可以轻松添加/删除音频文件，只需修改 `getAvailableAudioFiles()`
- ✅ 支持运行时动态配置，无需重启应用

### 4. **类型安全**
- ✅ TypeScript 编译通过，无类型错误
- ✅ 所有参数都有明确的类型定义

## 📝 使用示例

### 添加新的音频文件

```typescript
const audioFilesByKey = {
  'A': [
    { 
      name: 'A 调 Blues 伴奏 2', 
      url: `/blues-mp3/A/A2.mp4`, 
      bpm: 105, 
      description: 'Blues 风格变奏' 
    },
    { 
      name: 'A 调 Blues 伴奏', 
      url: `/blues-mp3/A/A.mp3`, 
      bpm: 125, 
      description: '经典 12 小节 Blues',
      startOffset: 5,  // 跳过前5秒
      loopStart: 5,    // 从第5秒开始循环
      loopEnd: 65      // 到第65秒结束循环
    },
  ],
  // ... 其他调
};
```

### 数据流

```
用户点击 A 调 → 抽屉显示 2 个音频文件
  ↓
用户选择 A2.mp4
  ↓
handleSelectAudioFromUrl(A, '/blues-mp3/A/A2.mp4', 105)
  ↓
updateTrackConfig(A, { url: '...', originalBPM: 105 })
  ↓
trackConfigs.set(A, { key: A, url: '...', originalBPM: 105 })
  ↓
preloadTrack(A) 使用新配置加载音频
  ↓
play(bpm) 使用 trackConfigs.get(A).originalBPM 计算播放速率
```

## 🔧 技术细节

### Map vs Object
- 使用 `Map` 而不是 `Record` 的原因：
  - ✅ 更好的性能（特别是频繁增删改）
  - ✅ 支持任意类型的 key
  - ✅ 有内置的 `forEach`、`has`、`get`、`set` 方法
  - ✅ 可以轻松获取大小（`size` 属性）

### 默认值处理
```typescript
// 所有地方都提供了安全的默认值
const originalBPM = trackConfig?.originalBPM || 120;
const startOffset = trackConfig?.startOffset || 0;
```

## ✅ 验证

- ✅ TypeScript 编译通过（`npx tsc --noEmit`）
- ✅ 所有类型错误已修复
- ✅ 代码逻辑完整，无遗漏

## 📂 当前音频文件

```
public/blues-mp3/
├── A/
│   ├── A.mp3   (125 BPM)
│   └── A2.mp4  (105 BPM)
└── E/
    └── E1.mp4  (120 BPM)
```

---

**更新时间**: 2025-01-10  
**版本**: v4.0.0  
**重构类型**: 架构优化
