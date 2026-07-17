// ---------------------------------------------------------------------------
// UserController — HTTP layer for user-discovery endpoints.
//
// All endpoints are protected by authMiddleware. req.user.id is the
// authenticated user's id — never read from the request body.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';

export class UserController {
  constructor(private readonly userService: UserService) {
    this.lookupRecipient = this.lookupRecipient.bind(this);
    this.search          = this.search.bind(this);
    this.getRecentContacts = this.getRecentContacts.bind(this);
    this.addFavourite    = this.addFavourite.bind(this);
    this.removeFavourite = this.removeFavourite.bind(this);
    this.getFavourites   = this.getFavourites.bind(this);
  }

  // GET /api/v1/users/payflow/:payflowId
  // 200 OK → { name, payflowId, avatar, walletExists }
  async lookupRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.userService.lookupRecipient(req.params.payflowId as string);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/users/search?q=<query>
  // 200 OK → PublicProfile[]
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.userService.search(req.query.q as string, req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/users/recent
  // 200 OK → RecentContact[]
  async getRecentContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.userService.getRecentContacts(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/users/favourites/:contactUserId
  // 204 No Content
  async addFavourite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      await this.userService.addFavourite(req.user.id, req.params.contactUserId as string);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/v1/users/favourites/:contactUserId
  // 204 No Content
  async removeFavourite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      await this.userService.removeFavourite(req.user.id, req.params.contactUserId as string);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/users/favourites
  // 200 OK → PublicProfile[]
  async getFavourites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.userService.getFavourites(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }
}
