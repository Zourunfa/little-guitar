import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="site-header">
      <nav aria-label="主导航" className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <NavLink to="/blues" className="site-brand" aria-label="Little Guitar 首页">
          <span className="site-brand-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 5 5M17 4l-7 7M20 7l-7 7M10 11c-2-2-4-1-4 1-4 0-5 5-2 8s8 2 8-2c2 0 3-2 1-4"/><circle cx="8" cy="16" r="1.5"/></svg></span>
          Little Guitar
        </NavLink>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/blues" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>Blues 练习</NavLink>
          <NavLink to="/tuner" className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}>调音器</NavLink>
        </div>
      </nav>
    </header>
  );
}
