import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { badRequest, unauthorized } from '../../shared/errors';
import { ok } from '../../shared/http';
import { farmersService } from '../farmers/farmers.service';
import { totpService } from './totp.service';

export const authController = {
  /**
   * Who the bearer token belongs to. The mobile app calls this on cold start to
   * confirm the session is still good and to hydrate the profile in one round
   * trip — sign-in itself is handled by Supabase Auth on the device.
   */
  async me(req: Request, res: Response) {
    const id = farmerId(req);
    const profile = await farmersService.getProfile(id, req.user?.email ?? null);
    const twoFactor = await totpService.status(id);
    ok(res, { user: { id, email: req.user?.email ?? null }, profile, twoFactor });
  },

  async setupTwoFactor(req: Request, res: Response) {
    const email = req.user?.email;
    if (!email) throw badRequest('Your account has no email address to bind the authenticator to');
    ok(res, await totpService.setup(farmerId(req), email));
  },

  async verifyTwoFactor(req: Request, res: Response) {
    const verified = await totpService.verify(farmerId(req), (req.body as { token: string }).token);
    if (!verified) throw unauthorized('That code is not valid. Check the time on your phone and try again.');
    ok(res, await totpService.status(farmerId(req)));
  },

  async verifyBackupCode(req: Request, res: Response) {
    const verified = await totpService.verifyBackupCode(
      farmerId(req),
      (req.body as { code: string }).code,
    );
    if (!verified) throw unauthorized('That backup code is not valid, or has already been used');
    ok(res, await totpService.status(farmerId(req)));
  },

  /** Disabling requires a fresh code, so a stolen session cannot strip 2FA. */
  async disableTwoFactor(req: Request, res: Response) {
    const id = farmerId(req);
    const { token } = req.body as { token: string };
    const verified = await totpService.verify(id, token);
    if (!verified) throw unauthorized('Enter a current code to turn two-factor off');
    await totpService.disable(id);
    ok(res, { enabled: false, backupCodesRemaining: 0 });
  },

  async twoFactorStatus(req: Request, res: Response) {
    ok(res, await totpService.status(farmerId(req)));
  },

  async regenerateBackupCodes(req: Request, res: Response) {
    const id = farmerId(req);
    const verified = await totpService.verify(id, (req.body as { token: string }).token);
    if (!verified) throw unauthorized('Enter a current code to issue new backup codes');
    ok(res, { backupCodes: await totpService.regenerateBackupCodes(id) });
  },
};
