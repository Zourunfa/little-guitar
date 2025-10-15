import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [theme, setTheme] = useState('cyberpunk');
  const location = useLocation();
  
  // 检测是否是活跃路由
  const isActive = (path) => location.pathname === path;

  // 切换主题
  const toggleTheme = () => {
    const themes = ['light', 'dark', 'cupcake', 'synthwave', 'retro', 'cyberpunk'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    setTheme(newTheme);
  };

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/tuner" className={isActive('/tuner') ? 'active' : ''}>🎸 调音器</Link></li>
            <li><Link to="/blues" className={isActive('/blues') ? 'active' : ''}>🎵 Blues 即兴</Link></li>
          </ul>
        </div>
        <Link to="/tuner" className="btn btn-ghost text-xl normal-case">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 512 512">
            <path fill="#A0522D" d="M180 100h152v180H180z"/>
            <ellipse fill="#D2691E" cx="256" cy="360" rx="140" ry="120"/>
            <circle fill="#000" cx="256" cy="320" r="40"/>
            <circle fill="#FFF" cx="256" cy="320" r="35"/>
          </svg>
          <span className="text-primary">Little</span>
          <span className="text-secondary">Guitar</span>
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/tuner" className={isActive('/tuner') ? 'active' : ''}>🎸 调音器</Link></li>
          <li><Link to="/blues" className={isActive('/blues') ? 'active' : ''}>🎵 Blues 即兴</Link></li>
        </ul>
      </div>
      <div className="navbar-end">
        <button onClick={toggleTheme} className="btn btn-ghost btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
              </div>
            </div>
          );
        };

export default Navbar;