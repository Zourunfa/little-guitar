import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import { getPreferredLanguage } from '../utils/detectLanguage';

// 初始化 i18n，先使用默认语言
i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': {
        translation: zhCN
      },
      'en-US': {
        translation: enUS
      }
    },
    lng: 'zh-CN', // 临时默认值
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false
    }
  });

// 异步检测并设置语言
getPreferredLanguage().then(language => {
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
});

export default i18n;
