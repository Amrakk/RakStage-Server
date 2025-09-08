import PasskeyService from "../internal/passkey.js";
import { base64ToBuffer, bufferToBase64 } from "../../utils/encryption.js";
import { APP_NAME, CLIENT_URL, HOST, IS_PROD, PASSKEY_TRANSPORT } from "../../constants.js";
import {
    verifyRegistrationResponse,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    generateAuthenticationOptions,
} from "@simplewebauthn/server";

import BadRequestError from "../../errors/BadRequestError.js";

import type { ObjectId } from "mongooat";
import type { IResPasskey } from "../../interfaces/api/response.js";
import type { RegistrationData } from "../../interfaces/external/authn.js";
import type {
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
    AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

export default class AuthnService {
    private static challengeKey: Map<string, string> = new Map();

    private static generateChallenge(): string {
        return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
    }

    public static async createRegisterOptions(user: RegistrationData): Promise<PublicKeyCredentialCreationOptionsJSON> {
        const challenge = this.generateChallenge();
        const credentials = await PasskeyService.getByUserId(user._id);

        const options = await generateRegistrationOptions({
            challenge,
            rpName: APP_NAME,
            rpID: IS_PROD ? HOST : "localhost",
            userID: new TextEncoder().encode(`${user._id}`),
            userName: user.email,
            userDisplayName: user.name,
            timeout: 60000,
            attestationType: "none",
            authenticatorSelection: {
                userVerification: "required",
            },
            supportedAlgorithmIDs: [-7, -257],
            excludeCredentials: credentials.map(({ credentialId, transports }) => ({
                transports,
                id: credentialId,
                type: "public-key",
            })),
            extensions: {
                credProps: true,
            },
        });

        this.challengeKey.set(`authn:register:${user._id}`, options.challenge);

        return options;
    }

    public static async verifyRegister(
        userId: ObjectId,
        userName: string,
        response: RegistrationResponseJSON
    ): Promise<IResPasskey.Base[]> {
        const mapKey = `authn:register:${userId}`;
        const challenge = this.challengeKey.get(mapKey);
        if (!challenge) throw new BadRequestError("Invalid session");

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challenge,
            expectedOrigin: CLIENT_URL,
            expectedRPID: IS_PROD ? HOST : "localhost",
        });

        if (!verification.verified) throw new Error("Passkey verification failed");
        this.challengeKey.delete(mapKey);

        const { credential } = verification.registrationInfo!;
        const { counter, id, publicKey, transports } = credential;

        const passkey = {
            userId,
            counter,
            credentialId: id,
            publicKey: bufferToBase64(publicKey),
            transports: (transports || []) as PASSKEY_TRANSPORT[],
            name: `${userName}-${APP_NAME}-pk`,
        };

        return PasskeyService.insert([passkey]);
    }

    public static async createLoginOptions(id: string) {
        const challenge = this.generateChallenge();
        const credentials = await PasskeyService.getByUserId(id);

        const options = await generateAuthenticationOptions({
            challenge,
            rpID: IS_PROD ? HOST : "localhost",
            userVerification: "required",
            timeout: 60000,
            allowCredentials: credentials.map(({ credentialId, transports }) => ({
                id: credentialId,
                transports: transports as AuthenticatorTransportFuture[],
            })),
        });

        this.challengeKey.set(`authn:login:${id}`, options.challenge);
        return options;
    }

    public static async loginWithPasskey(response: AuthenticationResponseJSON): Promise<IResPasskey.Base> {
        const credential = await PasskeyService.getByCredentialId(response.rawId);
        if (!credential) throw new BadRequestError("Credential not registered in this site");

        const mapKey = `authn:login:${credential.userId}`;

        const challenge = this.challengeKey.get(mapKey);
        if (!challenge) throw new BadRequestError("Invalid session");

        const verification = await verifyAuthenticationResponse({
            response,
            credential: {
                id: credential.credentialId,
                publicKey: base64ToBuffer(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports,
            },
            expectedChallenge: challenge,
            expectedOrigin: CLIENT_URL,
            expectedRPID: IS_PROD ? HOST : "localhost",
        });

        const { verified, authenticationInfo } = verification;

        if (!verified) throw new BadRequestError("Passkey verification failed");
        this.challengeKey.delete(mapKey);

        const { newCounter } = authenticationInfo;
        return PasskeyService.updateByCredentialId(credential.credentialId, {
            counter: newCounter,
            lastUsedAt: new Date(),
        });
    }
}
