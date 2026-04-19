"use server";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

import { sessions } from "@/session/store";
import { requestInfo, serverAction } from "rwsdk/worker";
import { db } from "@/db";
import { env } from "cloudflare:workers";
import { hashPassword, verifyPassword, validatePasswordStrength } from "./password";

function getWebAuthnConfig(request: Request) {
  const rpID = env.WEBAUTHN_RP_ID ?? new URL(request.url).hostname;
  const rpName = import.meta.env.VITE_IS_DEV_SERVER
    ? "Development App"
    : env.WEBAUTHN_APP_NAME;
  return {
    rpName,
    rpID,
  };
}

export const startPasskeyRegistration = serverAction(async (email: string) => {
  const { rpName, rpID } = getWebAuthnConfig(requestInfo.request);
  const { response } = requestInfo;

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: email,
    authenticatorSelection: {
      // Require the authenticator to store the credential, enabling a username-less login experience
      residentKey: "required",
      // Prefer user verification (biometric, PIN, etc.), but allow authentication even if it's not available
      userVerification: "preferred",
    },
  });

  await sessions.save(response.headers, { challenge: options.challenge });

  return options;
});

export const startPasskeyLogin = serverAction(async () => {
  const { rpID } = getWebAuthnConfig(requestInfo.request);
  const { response } = requestInfo;

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });

  await sessions.save(response.headers, { challenge: options.challenge });

  return options;
});

export const finishPasskeyRegistration = serverAction(async (
  email: string,
  registration: RegistrationResponseJSON,
  label?: string,
) => {
  try {
    const { request, response } = requestInfo;
    const { origin } = new URL(request.url);

    const session = await sessions.load(request);
    const challenge = session?.challenge;

    if (!challenge) {
      console.error("finishPasskeyRegistration: No challenge in session");
      return false;
    }

    const rpID = env.WEBAUTHN_RP_ID || new URL(request.url).hostname;

    const verification = await verifyRegistrationResponse({
      response: registration,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      console.error("finishPasskeyRegistration: Verification failed");
      return false;
    }

    const freeCredits = parseInt(process.env.FREE_CREDITS_AMOUNT || '15', 10);

    const user = await db.user.create({
      data: {
        email,
        username: email, // Use full email as username
        creditsRemaining: freeCredits,
        totalCreditsGranted: freeCredits,
      },
    });

    await db.credential.create({
      data: {
        userId: user.id,
        credentialId: verification.registrationInfo.credential.id,
        publicKey: verification.registrationInfo.credential.publicKey,
        counter: verification.registrationInfo.credential.counter,
        label: label?.trim() || null,
      },
    });

    // Auto-create personal tenant for new user
    const tenant = await db.tenant.create({
      data: {
        name: `${email}'s Workspace`,
        slug: `${email.split('@')[0]}-${crypto.randomUUID().slice(0, 8)}`, // Use email prefix for slug
        status: "ACTIVE",
      },
    });

    const membership = await db.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "OWNER",
      },
    });

    // Save session with tenant context
    await sessions.save(response.headers, {
      userId: user.id,
      challenge: null,
      tenantId: tenant.id,
      membershipId: membership.id,
    });

    return true;
  } catch (error) {
    console.error("finishPasskeyRegistration failed:", error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Registration failed');
  }
});

export const finishPasskeyLogin = serverAction(async (login: AuthenticationResponseJSON) => {
  const { request, response } = requestInfo;
  const { origin } = new URL(request.url);

  const session = await sessions.load(request);
  const challenge = session?.challenge;

  if (!challenge) {
    console.error("finishPasskeyLogin failure: no_challenge", { credentialId: login.id });
    return false;
  }

  const credential = await db.credential.findUnique({
    where: {
      credentialId: login.id,
    },
  });

  if (!credential) {
    console.error("finishPasskeyLogin failure: credential_not_found", { credentialId: login.id });
    return false;
  }

  const rpID = env.WEBAUTHN_RP_ID || new URL(request.url).hostname;

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: login,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: credential.credentialId,
        publicKey: credential.publicKey,
        counter: credential.counter,
      },
    });

    if (!verification.verified) {
      console.error("finishPasskeyLogin failure: verification_unverified", {
        credentialId: credential.credentialId,
        userId: credential.userId,
      });
      await db.credential.update({
        where: { credentialId: login.id },
        data: {
          failedAttempts: { increment: 1 },
          lastFailedAt: new Date(),
        },
      });
      return false;
    }
  } catch (error) {
    console.error("finishPasskeyLogin failure: verification_threw", {
      credentialId: credential.credentialId,
      userId: credential.userId,
      message: error instanceof Error ? error.message : 'unknown',
    });
    await db.credential.update({
      where: { credentialId: login.id },
      data: {
        failedAttempts: { increment: 1 },
        lastFailedAt: new Date(),
      },
    });
    return false;
  }

  await db.credential.update({
    where: {
      credentialId: login.id,
    },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
      failedAttempts: 0,
      lastFailedAt: null,
    },
  });

  const user = await db.user.findUnique({
    where: {
      id: credential.userId,
    },
  });

  if (!user) {
    return false;
  }

  // Load user's tenant membership (use first one for now)
  const membership = await db.tenantMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }, // Use oldest membership (primary tenant)
  });

  await sessions.save(response.headers, {
    userId: user.id,
    challenge: null,
    tenantId: membership?.tenantId ?? null,
    membershipId: membership?.id ?? null,
  });

  return true;
});

// ============================================================================
// PASSWORD AUTHENTICATION
// ============================================================================

export const signupWithPassword = serverAction(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { response } = requestInfo;

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid password' };
    }

    // Check if email is already taken
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: 'Signup failed. Please try again.' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const freeCredits = parseInt(process.env.FREE_CREDITS_AMOUNT || '15', 10);

    // Create user with password hash
    const user = await db.user.create({
      data: {
        email,
        username: email,
        passwordHash,
        creditsRemaining: freeCredits,
        totalCreditsGranted: freeCredits,
      },
    });

    // Auto-create personal tenant for new user
    const tenant = await db.tenant.create({
      data: {
        name: `${email}'s Workspace`,
        slug: `${email.split('@')[0]}-${crypto.randomUUID().slice(0, 8)}`,
        status: "ACTIVE",
      },
    });

    const membership = await db.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "OWNER",
      },
    });

    // Save session with tenant context
    await sessions.save(response.headers, {
      userId: user.id,
      tenantId: tenant.id,
      membershipId: membership.id,
    });

    return { success: true };
  } catch (error) {
    console.error("signupWithPassword failed:", error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: 'Signup failed. Please try again.' };
  }
});

// ============================================================================
// PASSKEY MANAGEMENT (for logged-in users)
// ============================================================================

export const startPasskeyAddition = serverAction(async () => {
  const { request, response } = requestInfo;
  const session = await sessions.load(request);
  if (!session?.userId) {
    throw new Error("Not authenticated");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const { rpName, rpID } = getWebAuthnConfig(request);
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });

  await sessions.save(response.headers, { ...session, challenge: options.challenge });
  return options;
});

export const finishPasskeyAddition = serverAction(async (
  registration: RegistrationResponseJSON,
  label?: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { request, response } = requestInfo;
    const { origin } = new URL(request.url);

    const session = await sessions.load(request);
    if (!session?.userId) {
      return { success: false, error: "Not authenticated" };
    }

    const challenge = session.challenge;
    if (!challenge) {
      return { success: false, error: "No challenge in session" };
    }

    const rpID = env.WEBAUTHN_RP_ID || new URL(request.url).hostname;

    const verification = await verifyRegistrationResponse({
      response: registration,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: "Verification failed" };
    }

    const existing = await db.credential.findUnique({
      where: { credentialId: verification.registrationInfo.credential.id },
    });
    if (existing) {
      return { success: false, error: "Fingerprint or face sign-in is already set up for this device." };
    }

    await db.credential.create({
      data: {
        userId: session.userId,
        credentialId: verification.registrationInfo.credential.id,
        publicKey: verification.registrationInfo.credential.publicKey,
        counter: verification.registrationInfo.credential.counter,
        label: label?.trim() || null,
      },
    });

    await sessions.save(response.headers, { ...session, challenge: null });
    return { success: true };
  } catch (error) {
    console.error("finishPasskeyAddition failed:", error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: "Could not set up fingerprint or face sign-in" };
  }
});

export const removePasskey = serverAction(async (credentialId?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const session = await sessions.load(requestInfo.request);
    if (!session?.userId) {
      return { success: false, error: "Not authenticated" };
    }

    if (credentialId) {
      const result = await db.credential.deleteMany({
        where: { id: credentialId, userId: session.userId },
      });
      if (result.count === 0) {
        return { success: false, error: "Device not found" };
      }
    } else {
      await db.credential.deleteMany({
        where: { userId: session.userId },
      });
    }
    return { success: true };
  } catch (error) {
    console.error("removePasskey failed:", error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: "Could not remove this device" };
  }
});

export const loginWithPassword = serverAction(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { response } = requestInfo;

    // Find user by email
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Load user's tenant membership (use first one for now)
    const membership = await db.tenantMembership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" }, // Use oldest membership (primary tenant)
    });

    // Save session
    await sessions.save(response.headers, {
      userId: user.id,
      tenantId: membership?.tenantId ?? null,
      membershipId: membership?.id ?? null,
    });

    return { success: true };
  } catch (error) {
    console.error("loginWithPassword failed:", error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: 'Login failed. Please try again.' };
  }
});
