import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handler } from '../../shared/http';
import { authController } from './auth.controller';
import { backupCodeSchema, totpTokenSchema } from './auth.schema';

/**
 * Sign-in, sign-up and token refresh belong to Supabase Auth and happen on the
 * device. This router covers what the server must own: identity confirmation
 * and the TOTP second factor.
 */
export const authRoutes = Router();

// A 6-digit code is 10⁶ possibilities; without a limit it is brute-forceable.
const totpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
});

authRoutes.use(requireAuth);

authRoutes.get('/me', handler(authController.me));

authRoutes.get('/2fa/status', handler(authController.twoFactorStatus));
authRoutes.post('/2fa/setup', handler(authController.setupTwoFactor));
authRoutes.post('/2fa/verify', totpLimiter, validate(totpTokenSchema), handler(authController.verifyTwoFactor));
authRoutes.post(
  '/2fa/verify-backup',
  totpLimiter,
  validate(backupCodeSchema),
  handler(authController.verifyBackupCode),
);
authRoutes.post(
  '/2fa/backup-codes',
  totpLimiter,
  validate(totpTokenSchema),
  handler(authController.regenerateBackupCodes),
);
authRoutes.delete('/2fa', totpLimiter, validate(totpTokenSchema), handler(authController.disableTwoFactor));
