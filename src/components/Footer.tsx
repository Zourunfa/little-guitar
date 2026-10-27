import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 px-4 py-7 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
        <p><span className="font-semibold text-slate-700">Little Guitar</span><span className="mx-3 text-slate-300">/</span>每天一点，弹得更好。</p>
        <div className="flex gap-5"><Link to="/blues" className="hover:text-emerald-700">Blues 练习</Link><Link to="/tuner" className="hover:text-emerald-700">吉他调音器</Link></div>
      </div>
    </footer>
  );
}
