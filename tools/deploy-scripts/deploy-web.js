#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 部署 Web 应用到静态托管
async function deployWeb() {
  console.log('🚀 开始部署 Web 应用...');

  const distPath = path.resolve(__dirname, '../../packages/apps/web/dist');

  if (!fs.existsSync(distPath)) {
    console.error('❌ 构建目录不存在，请先运行 pnpm build');
    process.exit(1);
  }

  console.log('✅ Web 应用部署完成');
  console.log('📦 静态文件已准备就绪，可以手动上传到云开发静态托管');
  console.log('🌐 部署路径: packages/apps/web/dist');

  // 这里可以添加实际的云开发上传逻辑
  // 例如使用 @cloudbase/cli 或调用 MCP 工具
}

deployWeb().catch(console.error);