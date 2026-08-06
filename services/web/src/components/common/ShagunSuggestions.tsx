// ---------------------------------------------------------------------------
// ShagunSuggestions — contextual wish-chip row shown when a shagun amount
// is detected.
//
// Behaviour
// ---------
//   • Rendered between the amount row and the note/message input.
//   • Appears (with a slide-down animation) when `wishes` is non-empty.
//   • While the user has not typed anything the chips are shown at full
//     opacity with a "💡 Suggested wishes" label.
//   • Once the user starts typing their own message the label changes to
//     "✨ Suggestions" and the row shrinks to a compact mini-strip so it
//     stays available without dominating the UI.
//   • Tapping a chip calls `onSelect(wish.message)` — the caller decides
//     what to do with the text (fill the textarea, replace it, etc.).
//   • No chip is ever auto-inserted; the user is always in control.
// ---------------------------------------------------------------------------
import { AnimatePresence, motion } from 'framer-motion';
import type { ShagunWish } from '@/utils/shagun';

interface ShagunSuggestionsProps {
  /** List of wishes to display. Pass an empty array to hide the component. */
  wishes: ShagunWish[];
  /** Whether the user has already started typing their own message. */
  hasUserText: boolean;
  /** Called when the user taps a chip. Receives the full message string. */
  onSelect: (message: string) => void;
}

export function ShagunSuggestions({ wishes, hasUserText, onSelect }: ShagunSuggestionsProps) {
  if (wishes.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="shagun-suggestions"
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        {/* Header row */}
        <motion.div
          animate={{ opacity: hasUserText ? 0.6 : 1 }}
          transition={{ duration: 0.2 }}
          className="mb-2 flex items-center gap-1.5"
        >
          <span className="text-xs">{hasUserText ? '✨' : '💡'}</span>
          <span className="text-xs font-medium text-text-muted">
            {hasUserText ? 'Suggestions' : 'Suggested wishes'}
          </span>
        </motion.div>

        {/* Chip row */}
        <div className="flex flex-wrap gap-2">
          {wishes.map((wish) => (
            <motion.button
              key={wish.label}
              type="button"
              onClick={() => onSelect(wish.message)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              animate={{ opacity: hasUserText ? 0.65 : 1 }}
              transition={{ duration: 0.18 }}
              className={[
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                'transition-colors duration-150',
                hasUserText
                  ? 'border-border bg-surface text-text-muted hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 hover:opacity-100'
                  : 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400 hover:bg-brand-100',
                'dark:border-brand-800/60 dark:bg-brand-950/30 dark:text-brand-400',
                'dark:hover:border-brand-600 dark:hover:bg-brand-900/40',
              ].join(' ')}
            >
              {wish.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
