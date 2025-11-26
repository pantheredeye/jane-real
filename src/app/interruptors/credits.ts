import type { AppContext } from '~/worker.tsx';

/**
 * Require Credits Interruptor
 *
 * Checks if user has credits remaining to access the route calculator.
 * Bypasses check for:
 * - Grandfathered users (unlimited access)
 * - Active/trialing subscribers (unlimited access)
 *
 * Redirects to paywall if credits exhausted.
 */
export async function requireCredits({ ctx }: { ctx: AppContext }) {
  // Must be authenticated
  if (!ctx.user) {
    return Response.redirect('/user/login', 302);
  }

  // Grandfathered users bypass credits
  if (ctx.user.grandfathered) {
    return; // Allow access
  }

  // Active or trialing subscribers bypass credits
  if (
    ctx.user.subscriptionStatus === 'ACTIVE' ||
    ctx.user.subscriptionStatus === 'TRIALING' ||
    ctx.user.subscriptionStatus === 'GRANDFATHERED'
  ) {
    return; // Allow access
  }

  // Check if user has credits remaining
  if (ctx.user.creditsRemaining <= 0) {
    return Response.redirect('/subscription/subscribe?reason=no-credits', 302);
  }

  // Has credits, allow access
  return;
}
