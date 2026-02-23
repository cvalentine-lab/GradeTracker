import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-amber-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-amber-950/10 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20 pointer-events-none" />

      <header className="relative flex justify-between items-center px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display font-semibold text-lg text-slate-800 dark:text-slate-100">Grade Tracker</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold transition-colors shadow-lg shadow-slate-900/10 dark:shadow-slate-100/10"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl leading-[1.1]">
          Streamline your college{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            efficiency
          </span>
        </h1>
        <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12 font-medium">
          Track grades, nail your target GPA, and focus on what actually moves the needle.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            to="/register"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/25 transition-all hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            Get started free
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl">
          {[
            { title: 'Track everything', desc: 'Classes, assignments, weights, and due dates in one place' },
            { title: 'Know your grade', desc: 'Real-time weighted average so you always know where you stand' },
            { title: 'Hit your target', desc: 'See exactly what you need on remaining work to reach your goal' },
            { title: 'Prioritize smarter', desc: 'Focus on assignments that move your grade the most' },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 text-left shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
            >
              <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
