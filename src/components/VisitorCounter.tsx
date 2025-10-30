/**
 * 访问量显示组件
 * 展示网站的总访问量和今日访问量
 */

import { useState, useEffect } from 'react';
import { getAnalytics } from '../utils/cloudbaseAnalytics';

interface AnalyticsData {
  totalViews: number;
  todayViews: number;
}

export default function VisitorCounter() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    todayViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('加载访问量数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="loading loading-spinner loading-xs"></span>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* 总访问量 */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-lg border border-blue-200">
        <svg 
          className="w-4 h-4 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
          />
        </svg>
        <span className="text-gray-700 font-medium">
          总访问: <span className="text-blue-600 font-bold">{analytics.totalViews.toLocaleString()}</span>
        </span>
      </div>

      {/* 今日访问量 */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-lg border border-green-200">
        <svg 
          className="w-4 h-4 text-green-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <span className="text-gray-700 font-medium">
          今日: <span className="text-green-600 font-bold">{analytics.todayViews.toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
}
