# Little Guitar

Little Guitar是一款为吉他爱好者设计的Web应用，提供实用的吉他工具，包括调音器和和弦查找器。

[![Powered by CloudBase](https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/powered-by-cloudbase-badge.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)  

> 本项目基于 [**CloudBase AI ToolKit**](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit) 开发，通过AI提示词和 MCP 协议+云开发，让开发更智能、更高效。

## 功能特点

### 吉他调音器

- 使用Web Audio API实现实时音频分析
- 支持标准吉他调音(E A D G B E)
- 提供视觉反馈，帮助用户准确调节音高
- 显示当前检测到的音符和频率
- 自动识别最接近的音符并指示是否需要调高或调低

### 和弦查找器

- 提供常用吉他和弦的指法图解
- 包括大三和弦、小三和弦、七和弦等多种和弦类型
- 交互式和弦指板显示
- 可按和弦类型和根音进行筛选
- 支持常见的替代指法

## 技术栈

- **前端框架**：React 18
- **构建工具**：Vite
- **路由**：React Router 6（使用 HashRouter）
- **样式**：Tailwind CSS + DaisyUI
- **动画**：Framer Motion
- **后端服务**：腾讯云开发（CloudBase）

## 开始使用

### 前提条件

- 安装 Node.js (版本 14 或更高)
- 腾讯云开发账号 (可在[腾讯云开发官网](https://tcb.cloud.tencent.com/)注册)

### 安装依赖

```bash
npm install
```

### 配置云开发环境

1. 打开 `src/utils/cloudbase.js` 文件
2. 将 `ENV_ID` 变量的值修改为您的云开发环境 ID

### 本地开发

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 部署指南

### 部署到云开发静态网站托管

1. 构建项目：`npm run build`
2. 登录腾讯云开发控制台
3. 进入您的环境 -> 静态网站托管
4. 上传 `dist` 目录中的文件

## 目录结构

```
├── public/               # 静态资源
├── src/
│   ├── components/       # 可复用组件
│   ├── pages/            # 页面组件
│   │   ├── TunerPage.jsx # 调音器页面
│   │   └── ChordFinderPage.jsx # 和弦查找器页面
│   ├── utils/            # 工具函数和云开发初始化
│   ├── App.jsx           # 应用入口
│   ├── main.jsx          # 渲染入口
│   └── index.css         # 全局样式
├── index.html            # HTML 模板
├── tailwind.config.js    # Tailwind 配置
├── postcss.config.js     # PostCSS 配置
├── vite.config.js        # Vite 配置
└── package.json          # 项目依赖
```

## 使用说明

### 调音器

1. 访问调音器页面
2. 允许浏览器访问麦克风
3. 弹奏吉他弦，应用将自动检测音高
4. 根据视觉指示调整弦的松紧度，直到指示器显示正确的音高

### 和弦查找器

1. 访问和弦查找器页面
2. 从根音选择器中选择所需的根音（如C、G、D等）
3. 从和弦类型选择器中选择所需的和弦类型（如大三和弦、小三和弦等）
4. 查看和弦指法图和组成音信息
5. 如果有替代指法，可以查看不同的指法选项

## 贡献指南

欢迎贡献代码、报告问题或提出改进建议！

## 许可证

MIT