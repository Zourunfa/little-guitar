import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    // 清除自动检测标记，表示用户手动选择了语言
    localStorage.removeItem('language-auto-detected');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="btn btn-ghost btn-circle"
      title={i18n.language === 'zh-CN' ? 'Switch to English' : '切换到中文'}
    >
      <div className="text-lg font-bold">
        {i18n.language === 'zh-CN' ? '🇨🇳' : '🇺🇸'}
      </div>
    </motion.button>
  );
};

export default LanguageSwitcher;
