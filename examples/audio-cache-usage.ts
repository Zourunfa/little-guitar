/**
 * 音频缓存优化使用示例
 * 展示如何使用优化后的音频缓存功能
 */

import AudioBackingTrack, { BackingTrackKey } from '../src/utils/audioBackingTrack';

// ============================================
// 示例 1: 基本使用
// ============================================
async function basicUsage() {
  console.log('📝 示例 1: 基本使用');
  
  const audioTrack = new AudioBackingTrack();
  
  // 初始化
  await audioTrack.init();
  
  // 配置音频文件
  audioTrack.updateTrackConfig('A', {
    url: '/blues-mp3/A/A.mp3',
    originalBPM: 120,
    startOffset: 5,
    loopEnd: 60
  });
  
  // 加载并播放
  await audioTrack.loadTrack('A');
  audioTrack.play(120);
  
  // 停止播放
  setTimeout(() => {
    audioTrack.stop();
    audioTrack.dispose();
  }, 5000);
}

// ============================================
// 示例 2: 智能预加载
// ============================================
async function smartPreloadUsage() {
  console.log('📝 示例 2: 智能预加载');
  
  const audioTrack = new AudioBackingTrack();
  await audioTrack.init();
  
  // 设置缓存限制
  audioTrack.setMaxCacheSize(30); // 30MB
  
  // 配置多个音频文件
  const keys: BackingTrackKey[] = ['A', 'E', 'G', 'D', 'C'];
  keys.forEach(key => {
    audioTrack.updateTrackConfig(key, {
      url: `/blues-mp3/${key}/${key}.mp3`,
      originalBPM: 120
    });
  });
  
  // 智能预加载（优先级：A, E, G）
  await audioTrack.preloadAllTracks(
    (progress, currentKey) => {
      console.log(`加载进度: ${progress}%, 当前: ${currentKey}`);
    },
    ['A', 'E', 'G'], // 优先调性
    2 // 并发数
  );
  
  // 查看缓存统计
  audioTrack.logCacheStats();
  
  audioTrack.dispose();
}

// ============================================
// 示例 3: 缓存管理
// ============================================
async function cacheManagementUsage() {
  console.log('📝 示例 3: 缓存管理');
  
  const audioTrack = new AudioBackingTrack();
  await audioTrack.init();
  audioTrack.setMaxCacheSize(20); // 20MB限制
  
  // 配置音频
  audioTrack.updateTrackConfig('A', {
    url: '/blues-mp3/A/A.mp3',
    originalBPM: 120
  });
  
  // 预加载
  await audioTrack.preloadTrack('A');
  
  // 获取缓存统计
  const stats = audioTrack.getCacheStats();
  console.log('缓存统计:', {
    项数: stats.itemCount,
    大小: `${stats.totalSizeMB.toFixed(2)}MB`,
    使用率: `${(stats.usage * 100).toFixed(1)}%`
  });
  
  // 查看详细信息
  stats.items.forEach(item => {
    console.log(`- ${item.key}: ${item.sizeMB.toFixed(2)}MB, 访问${item.accessCount}次`);
  });
  
  // 清空缓存
  audioTrack.clearPreloadCache();
  console.log('缓存已清空');
  
  audioTrack.dispose();
}

// ============================================
// 示例 4: 智能预加载相关调性
// ============================================
async function relatedKeysPreloadUsage() {
  console.log('📝 示例 4: 智能预加载相关调性');
  
  const audioTrack = new AudioBackingTrack();
  await audioTrack.init();
  
  // 配置所有调性
  const allKeys: BackingTrackKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  allKeys.forEach(key => {
    audioTrack.updateTrackConfig(key, {
      url: `/blues-mp3/${key}/${key}.mp3`,
      originalBPM: 120
    });
  });
  
  // 加载 A 调（会自动预加载相关调性）
  await audioTrack.loadTrack('A');
  console.log('✅ A 调已加载');
  
  // 等待智能预加载完成
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 查看预加载的调性
  const preloadedKeys = audioTrack.getPreloadedKeys();
  console.log('已预加载的调性:', preloadedKeys.join(', '));
  // 预期输出: A, E (上五度), D (下五度), B (大二度)
  
  audioTrack.dispose();
}

// ============================================
// 示例 5: 取消预加载
// ============================================
async function cancelPreloadUsage() {
  console.log('📝 示例 5: 取消预加载');
  
  const audioTrack = new AudioBackingTrack();
  await audioTrack.init();
  
  // 配置多个音频
  const keys: BackingTrackKey[] = ['A', 'E', 'G', 'D', 'C', 'F'];
  keys.forEach(key => {
    audioTrack.updateTrackConfig(key, {
      url: `/blues-mp3/${key}/${key}.mp3`,
      originalBPM: 120
    });
  });
  
  // 开始预加载
  const preloadPromise = audioTrack.preloadAllTracks((progress, key) => {
    console.log(`加载: ${key} - ${progress}%`);
  });
  
  // 2秒后取消
  setTimeout(() => {
    console.log('🛑 取消预加载');
    audioTrack.cancelPreload();
  }, 2000);
  
  // 等待预加载完成或取消
  await preloadPromise;
  
  console.log('预加载已停止');
  audioTrack.dispose();
}

// ============================================
// 示例 6: 缓存预热
// ============================================
async function warmupCacheUsage() {
  console.log('📝 示例 6: 缓存预热');
  
  const audioTrack = new AudioBackingTrack();
  await audioTrack.init();
  
  // 配置常用调性
  const commonKeys: BackingTrackKey[] = ['A', 'E', 'G'];
  commonKeys.forEach(key => {
    audioTrack.updateTrackConfig(key, {
      url: `/blues-mp3/${key}/${key}.mp3`,
      originalBPM: 120
    });
  });
  
  // 预热缓存
  await audioTrack.warmupCache(commonKeys);
  console.log('✅ 缓存预热完成');
  
  // 查看统计
  audioTrack.logCacheStats();
  
  audioTrack.dispose();
}

// ============================================
// 示例 7: 监控缓存使用
// ============================================
async function monitorCacheUsage() {
  console.log('📝 示例 7: 监控缓存使用');
  
  const audioTrack = new AudioBackingTrack();
  await audioTrack.init();
  audioTrack.setMaxCacheSize(10); // 设置较小的限制以演示清理
  
  // 配置多个音频
  const keys: BackingTrackKey[] = ['A', 'E', 'G', 'D', 'C'];
  keys.forEach(key => {
    audioTrack.updateTrackConfig(key, {
      url: `/blues-mp3/${key}/${key}.mp3`,
      originalBPM: 120
    });
  });
  
  // 逐个加载并监控
  for (const key of keys) {
    await audioTrack.preloadTrack(key);
    
    const stats = audioTrack.getCacheStats();
    console.log(`加载 ${key} 后:`);
    console.log(`  - 缓存项: ${stats.itemCount}`);
    console.log(`  - 大小: ${stats.totalSizeMB.toFixed(2)}MB`);
    console.log(`  - 使用率: ${(stats.usage * 100).toFixed(1)}%`);
    
    if (stats.usage > 0.8) {
      console.log('  ⚠️ 缓存接近限制，可能触发自动清理');
    }
  }
  
  audioTrack.dispose();
}

// ============================================
// 示例 8: 错误处理
// ============================================
async function errorHandlingUsage() {
  console.log('📝 示例 8: 错误处理');
  
  const audioTrack = new AudioBackingTrack();
  await audioTrack.init();
  
  // 配置不存在的音频文件
  audioTrack.updateTrackConfig('A', {
    url: '/non-existent-file.mp3',
    originalBPM: 120
  });
  
  try {
    await audioTrack.loadTrack('A');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('不存在')) {
        console.error('❌ 文件不存在');
      } else if (error.message.includes('网络')) {
        console.error('❌ 网络错误');
      } else if (error.message.includes('格式')) {
        console.error('❌ 文件格式错误');
      } else {
        console.error('❌ 未知错误:', error.message);
      }
    }
  }
  
  audioTrack.dispose();
}

// ============================================
// 运行所有示例
// ============================================
async function runAllExamples() {
  console.log('🚀 开始运行音频缓存优化示例\n');
  
  try {
    await basicUsage();
    console.log('\n---\n');
    
    await smartPreloadUsage();
    console.log('\n---\n');
    
    await cacheManagementUsage();
    console.log('\n---\n');
    
    await relatedKeysPreloadUsage();
    console.log('\n---\n');
    
    await cancelPreloadUsage();
    console.log('\n---\n');
    
    await warmupCacheUsage();
    console.log('\n---\n');
    
    await monitorCacheUsage();
    console.log('\n---\n');
    
    await errorHandlingUsage();
    
    console.log('\n✅ 所有示例运行完成');
  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 导出示例函数
export {
  basicUsage,
  smartPreloadUsage,
  cacheManagementUsage,
  relatedKeysPreloadUsage,
  cancelPreloadUsage,
  warmupCacheUsage,
  monitorCacheUsage,
  errorHandlingUsage,
  runAllExamples
};

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  console.log('💡 在浏览器控制台中运行示例:');
  console.log('  - basicUsage()');
  console.log('  - smartPreloadUsage()');
  console.log('  - cacheManagementUsage()');
  console.log('  - 或运行 runAllExamples() 查看所有示例');
}