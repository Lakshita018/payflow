// ---------------------------------------------------------------------------
// User routes — composition root for user-discovery endpoints.
//   prisma → UserRepository + FavouriteContactRepository + TransactionRepository
//          → UserService → UserController
// Mounted at /api/v1/users in app.ts.
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { FavouriteContactRepository } from '../repositories/favourite.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const userRepository      = new UserRepository(prisma);
const favouriteRepository = new FavouriteContactRepository(prisma);
const transactionRepository = new TransactionRepository(prisma);
const userService         = new UserService(userRepository, favouriteRepository, transactionRepository);
const userController      = new UserController(userService);

const auth = createAuthMiddleware(userRepository);

export const userRouter = Router();

// GET  /api/v1/users/search?q=<query>
// Static paths must be registered before parameterised routes.
userRouter.get('/search', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void userController.search(req, res, next);
});

// GET  /api/v1/users/recent
userRouter.get('/recent', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void userController.getRecentContacts(req, res, next);
});

// GET  /api/v1/users/favourites
userRouter.get('/favourites', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void userController.getFavourites(req, res, next);
});

// POST /api/v1/users/favourites/:contactUserId
userRouter.post('/favourites/:contactUserId', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void userController.addFavourite(req, res, next);
});

// DELETE /api/v1/users/favourites/:contactUserId
userRouter.delete('/favourites/:contactUserId', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void userController.removeFavourite(req, res, next);
});

// GET  /api/v1/users/payflow/:payflowId
// Parameterised route — registered last so static paths match first.
userRouter.get('/payflow/:payflowId', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void userController.lookupRecipient(req, res, next);
});
