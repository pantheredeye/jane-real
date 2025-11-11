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
import { requestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { env } from "cloudflare:workers";

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

export async function checkEmailAvailable(email: string) {
  const existing = await db.user.findUnique({ where: { email } });
  return !existing; // true if available, false if taken
}

export async function startPasskeyRegistration(email: string) {
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
}

export async function startPasskeyLogin() {
  const { rpID } = getWebAuthnConfig(requestInfo.request);
  const { headers } = requestInfo;

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });

  await sessions.save(headers, { challenge: options.challenge });

  return options;
}

export async function finishPasskeyRegistration(
  email: string,
  registration: RegistrationResponseJSON,
) {
  try {
    const { request, headers } = requestInfo;
    const { origin } = new URL(request.url);

    const session = await sessions.load(request);
    const challenge = session?.challenge;

    if (!challenge) {
      console.error("finishPasskeyRegistration: No challenge in session");
      return false;
    }

    const rpID = env.WEBAUTHN_RP_ID || new URL(request.url).hostname;
    console.log("finishPasskeyRegistration verification params:", {
      origin,
      rpID,
      email,
    });

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

    await sessions.save(headers, { challenge: null });

    const user = await db.user.create({
      data: {
        email,
        username: email, // Use full email as username
      },
    });

    await db.credential.create({
      data: {
        userId: user.id,
        credentialId: verification.registrationInfo.credential.id,
        publicKey: verification.registrationInfo.credential.publicKey,
        counter: verification.registrationInfo.credential.counter,
      },
    });

    // Auto-create personal tenant for new user
    const tenant = await db.tenant.create({
      data: {
        name: `${email}'s Workspace`,
        slug: `${email.split('@')[0]}-${Date.now()}`, // Use email prefix for slug
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
    await sessions.save(headers, {
      userId: user.id,
      challenge: null,
      tenantId: tenant.id,
      membershipId: membership.id,
    });

    console.log("finishPasskeyRegistration: Success for user:", email);
    return true;
  } catch (error) {
    console.error("finishPasskeyRegistration: Error:", error);
    throw error; // Re-throw so we get the 500 with details
  }
}

export async function finishPasskeyLogin(login: AuthenticationResponseJSON) {
  const { request, headers } = requestInfo;
  const { origin } = new URL(request.url);

  const session = await sessions.load(request);
  const challenge = session?.challenge;

  if (!challenge) {
    console.error("finishPasskeyLogin: No challenge in session");
    return false;
  }

  const credential = await db.credential.findUnique({
    where: {
      credentialId: login.id,
    },
  });

  if (!credential) {
    console.error("finishPasskeyLogin: Credential not found:", login.id);
    return false;
  }

  const rpID = env.WEBAUTHN_RP_ID || new URL(request.url).hostname;
  console.log("finishPasskeyLogin verification params:", {
    origin,
    rpID,
    credentialId: credential.credentialId,
  });

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
      console.error("finishPasskeyLogin: Verification failed");
      return false;
    }
  } catch (error) {
    console.error("finishPasskeyLogin: Verification error:", error);
    return false;
  }

  await db.credential.update({
    where: {
      credentialId: login.id,
    },
    data: {
      counter: verification.authenticationInfo.newCounter,
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

  await sessions.save(headers, {
    userId: user.id,
    challenge: null,
    tenantId: membership?.tenantId ?? null,
    membershipId: membership?.id ?? null,
  });

  return true;
}
