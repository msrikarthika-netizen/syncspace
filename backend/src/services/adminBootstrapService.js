import { ADMIN_EMAIL } from '../config/serverConfig.js';
import userRepository from '../repositories/userRepository.js';

/**
 * Ensures the explicitly configured local/bootstrap account can access the
 * control plane. Passwords are deliberately not created from environment
 * variables: the account must first be registered through the normal flow.
 */
export async function ensureConfiguredAdmin() {
  if (!ADMIN_EMAIL) return;

  const user = await userRepository.findByEmail(ADMIN_EMAIL);
  if (!user) {
    console.warn(
      `ADMIN_EMAIL is configured but no user exists for it. Register the account first, then restart the backend.`
    );
    return;
  }

  if (user.role === 'admin' && user.isActive !== false) {
    console.log(`Configured administrator is ready: ${ADMIN_EMAIL}`);
    return;
  }

  await userRepository.promoteAndActivateByEmail(ADMIN_EMAIL);
  console.log(`Configured administrator promoted and activated: ${ADMIN_EMAIL}`);
}
