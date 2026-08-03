// ---------------------------------------------------------------------------
// AuthController — HTTP layer for authentication endpoints.
//
// Layer contract
// --------------
// • Reads from req.body / req.params — no business logic.
// • Calls AuthService for all decisions.
// • Writes the HTTP response (status + JSON body).
// • Forwards every thrown error to next(error) so the global error middleware
//   (app.ts) can map AppError subclasses → correct status codes.
//
// Dependency injection
// --------------------
// AuthController is instantiated once at startup with an AuthService instance.
// Handlers are bound in the constructor so they can be passed as callbacks to
// express Router without losing the `this` context.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';

export class AuthController {
  constructor(private readonly authService: AuthService) {
    // Bind handlers so they retain `this` when passed directly to Router:
    //   router.post('/register', authController.register)
    this.register          = this.register.bind(this);
    this.login             = this.login.bind(this);
    this.refreshToken      = this.refreshToken.bind(this);
    this.logout            = this.logout.bind(this);
    this.me                = this.me.bind(this);
    this.forgotPassword    = this.forgotPassword.bind(this);
    this.resetPassword     = this.resetPassword.bind(this);
    this.updateProfile     = this.updateProfile.bind(this);
    this.changePassword    = this.changePassword.bind(this);
    this.logoutAll         = this.logoutAll.bind(this);
    this.updatePreferences = this.updatePreferences.bind(this);
  }

  // ── POST /auth/register ────────────────────────────────────────────────────
  // Body: { email, password }
  // 201 Created  → { id, email, createdAt }
  // 400          → validation failure (ZodError via error middleware)
  // 409          → email already registered (ConflictError)
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.authService.register({
        email: req.body.email as string,
        password: req.body.password as string,
      });
      res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/login ───────────────────────────────────────────────────────
  // Body: { email, password }
  // 200 OK       → { accessToken, refreshToken }
  // 400          → validation failure
  // 401          → invalid credentials
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.authService.login({
        email: req.body.email as string,
        password: req.body.password as string,
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/refresh ─────────────────────────────────────────────────────
  // Body: { refreshToken }
  // 200 OK       → { accessToken, refreshToken }
  // 401          → invalid / expired refresh token
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.authService.refreshToken({
        refreshToken: req.body.refreshToken as string,
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/logout ──────────────────────────────────────────────────────
  // Requires an authenticated request — userId is read from req.user (set by
  // the JWT auth middleware, added in a later phase). For now the controller
  // reads userId from req.body so it is testable without middleware.
  // Body: { userId }
  // 204 No Content  → (empty body)
  // 401             → user not found
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.authService.logout({
        userId: req.body.userId as string,
      });
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }

  // ── GET /auth/me ───────────────────────────────────────────────────────────
  // Returns the authenticated user's public profile.
  // 200 OK  → { id, email, payflowId, createdAt }
  // 401     → not authenticated
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.authService.getMe(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/forgot-password ─────────────────────────────────────────────
  // Body: { email }
  // 200 OK  → { message } — generic message regardless of whether the email exists
  //                          (email enumeration defence)
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.authService.forgotPassword({
        email: req.body.email as string,
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/reset-password ──────────────────────────────────────────────
  // Body: { token, password }
  // 200 OK  → { message }
  // 400     → invalid / expired token, or validation failure
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.authService.resetPassword({
        token:    req.body.token as string,
        password: req.body.password as string,
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── PATCH /auth/me ─────────────────────────────────────────────────────────
  // Body: { displayName?, phone?, avatarUrl? }
  // 200 OK  → { id, displayName, phone, avatarUrl }
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const body = req.body as Record<string, unknown>;
      const input: import('../services/auth.service').UpdateProfileInput = {};
      if ('displayName' in body) input.displayName = body.displayName as string | null;
      if ('phone'       in body) input.phone       = body.phone       as string | null;
      if ('avatarUrl'   in body) input.avatarUrl   = body.avatarUrl   as string | null;
      const result = await this.authService.updateProfile(req.user.id, input);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/change-password ─────────────────────────────────────────────
  // Body: { currentPassword, newPassword }
  // 200 OK  → { message }
  // 401     → currentPassword incorrect
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.authService.changePassword({
        userId:          req.user.id,
        currentPassword: req.body.currentPassword as string,
        newPassword:     req.body.newPassword     as string,
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/logout-all ──────────────────────────────────────────────────
  // Invalidates all refresh token hashes → forces all sessions to re-auth.
  // 204 No Content
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      await this.authService.logoutAll(req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }

  // ── PATCH /auth/preferences ────────────────────────────────────────────────
  // Body: { emailNotifications?, pushNotifications?, themePreference? }
  // 200 OK  → { emailNotifications, pushNotifications, themePreference }
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const body = req.body as Record<string, unknown>;
      const input: import('../services/auth.service').UpdatePreferencesInput = { userId: req.user.id };
      if ('emailNotifications' in body) input.emailNotifications = body.emailNotifications as boolean;
      if ('pushNotifications'  in body) input.pushNotifications  = body.pushNotifications  as boolean;
      if ('themePreference'    in body) input.themePreference    = body.themePreference    as string;
      const result = await this.authService.updatePreferences(input);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }
}
