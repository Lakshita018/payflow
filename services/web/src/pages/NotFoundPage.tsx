import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '@/routes/paths';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col items-center justify-center gap-5 text-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4"
      >
        {/* Large 404 glyph */}
        <div className="relative">
          <p className="text-[7rem] font-bold leading-none tracking-tight text-brand-100 select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[2rem] font-bold text-brand-500">404</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
          <p className="text-sm text-text-secondary max-w-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <Link
          to={ROUTES.DASHBOARD}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgb(124_58_237/0.28)] transition-all hover:-translate-y-px hover:bg-brand-700 hover:shadow-[0_12px_28px_rgb(124_58_237/0.32)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
