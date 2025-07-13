import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const features = [
    {
      title: '精准调音',
      description: '实时音频分析，支持标准调音和多种调音模式',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      )
    },
    {
      title: '和弦库',
      description: '包含100+常用和弦指法图解',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: '学习模式',
      description: '逐步引导学习常用和弦进行',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: '收藏功能',
      description: '保存您喜爱的和弦和练习进度',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Little Guitar
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-80">
          您的口袋吉他助手 - 随时随地调音和查找和弦
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1"
        >
          <div className="card bg-base-200 shadow-xl h-full">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">🎸 使用指南</h2>
              <div className="space-y-4 text-left">
                <div className="p-4 bg-base-300 rounded-lg">
                  <p className="font-mono text-sm">1. 吉他调音</p>
                  <p className="mt-2 p-2 bg-base-100 rounded text-sm">
                    点击"开始调音"，允许麦克风访问权限，然后弹奏吉他弦，应用将自动检测音高并指示如何调整。
                  </p>
                </div>
                <div className="p-4 bg-base-300 rounded-lg">
                  <p className="font-mono text-sm">2. 和弦查找</p>
                  <p className="mt-2 p-2 bg-base-100 rounded text-sm">
                    在和弦查找器中，选择根音和和弦类型，即可查看详细的指法图解和按弦位置。
                  </p>
                </div>
                <div className="p-4 bg-base-300 rounded-lg">
                  <p className="font-mono text-sm">3. 保存收藏</p>
                  <p className="mt-2 p-2 bg-base-100 rounded text-sm">
                    登录后可以保存您喜爱的和弦，创建自定义和弦进行，方便随时查看和练习。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex-1"
        >
          <div className="card bg-base-200 shadow-xl h-full">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">✨ 核心特性</h2>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="text-primary">{feature.icon}</div>
                    <div>
                      <h3 className="font-bold text-lg">{feature.title}</h3>
                      <p className="opacity-80">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold text-center mb-8">🎸 音乐工具</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="card bg-base-200 shadow-xl"
          >
            <div className="card-body">
              <h3 className="card-title text-xl">吉他调音器</h3>
              <p>使用麦克风实时检测音高，帮助您准确调节吉他弦的音准。支持标准调音(E A D G B E)。</p>
              <div className="card-actions justify-end mt-4">
                <Link to="/tuner" className="btn btn-primary">
                  开始调音
                </Link>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="card bg-base-200 shadow-xl"
          >
            <div className="card-body">
              <h3 className="card-title text-xl">和弦查找器</h3>
              <p>查找常用吉他和弦的指法图解，包括大三和弦、小三和弦、七和弦等多种和弦类型。</p>
              <div className="card-actions justify-end mt-4">
                <Link to="/chord-finder" className="btn btn-primary">
                  查找和弦
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="flex justify-center gap-4 mt-8"
      >
        <a
          href="https://docs.cloudbase.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          查看文档
        </a>
        <a
          href="https://github.com/TencentCloudBase/cloudbase-templates"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          更多模板
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-16 p-4 bg-base-200 rounded-lg text-center"
      >
        <p className="opacity-60 text-sm">
          当前环境 ID: {import.meta.env.VITE_APP_ENV_ID || '未设置'} | 
          <a 
            href="https://console.cloud.tencent.com/tcb" 
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 underline"
          >
            管理控制台
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default HomePage; 