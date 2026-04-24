import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getDb, getUserUploadedBytes } from '../../db';

const router = Router();

const FREE_QUOTA_BYTES = 100 * 1024 * 1024; // 100MB

/** GET /api/user/quota — returns storage usage for the authenticated user */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const used = await getUserUploadedBytes(db, req.user!.userId);
    res.json({ used, limit: FREE_QUOTA_BYTES, tier: 'free' });
  } catch (err) {
    next(err);
  }
});

export default router;
