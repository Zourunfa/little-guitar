/**
 * 基于 IP 地址检测用户地区并返回对应语言
 * 中国大陆和台湾返回中文，其他地区返回英文
 */
export async function detectLanguageByIP(): Promise<string> {
  try {
    // 使用免费的 IP 地理位置 API
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    } as any);
    
    if (!response.ok) {
      throw new Error('IP detection failed');
    }
    
    const data = await response.json();
    const countryCode = data.country_code;
    
    // 中国大陆 (CN) 和台湾 (TW) 使用中文
    if (countryCode === 'CN' || countryCode === 'TW') {
      return 'zh-CN';
    }
    
    // 其他地区使用英文
    return 'en-US';
  } catch (error) {
    console.warn('Failed to detect language by IP:', error);
    // 检测失败时返回中文作为默认值
    return 'zh-CN';
  }
}

/**
 * 获取应该使用的语言
 * 优先级：localStorage > IP 检测 > 默认中文
 */
export async function getPreferredLanguage(): Promise<string> {
  // 如果用户已经手动选择过语言，使用保存的语言
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    return savedLanguage;
  }
  
  // 否则通过 IP 自动检测
  const detectedLanguage = await detectLanguageByIP();
  
  // 保存检测到的语言（标记为自动检测，以便用户可以覆盖）
  localStorage.setItem('language', detectedLanguage);
  localStorage.setItem('language-auto-detected', 'true');
  
  return detectedLanguage;
}
