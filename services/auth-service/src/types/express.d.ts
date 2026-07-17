// ---------------------------------------------------------------------------
// Express Request augmentation — adds req.user populated by authMiddleware.
//
// The declaration merging approach is the official TypeScript pattern for
// extending third-party types without modifying node_modules.
// ---------------------------------------------------------------------------
import 'express';

declare module 'express' {
  interface Request {
    /**
     * Populated by authMiddleware after a valid Bearer token is verified.
     * Undefined on unauthenticated routes — do not access on public endpoints.
     */
    user?: {
      id: string;
      email: string;
    };
  }
}
