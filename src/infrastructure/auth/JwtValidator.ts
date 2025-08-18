import { Either } from '@either';
import { createVerify } from 'crypto';

import {
  DecodedTokenPayload,
  IJwtValidator,
} from '../../application/services/auth/IJwtValidator';
import { ApplicationError } from '../../application/shared/errors/ApplicationError';
import { AuthTokenInvalidError } from '../../application/shared/errors/AuthTokenInvalidError';

// Minimal JWT verification (RS256) without external dependency.
// NOTE: For production hardening, consider a vetted lib (e.g., jose) but keeping MVP dependency surface minimal.

interface JwtValidatorConfig {
  jwksUri?: string;
  issuer?: string;
  audience?: string;
  userIdClaim: string;
  required: boolean;
  fetchFn?: typeof fetch; // allows test
}

export class JwtValidator implements IJwtValidator {
  private fetchFn: typeof fetch;

  constructor(private readonly cfg: JwtValidatorConfig) {
    this.fetchFn = cfg.fetchFn || fetch;
  }

  async validate(
    token: string,
  ): Promise<Either<ApplicationError, DecodedTokenPayload>> {
    if (!this.cfg.required) {
      return Either.success({ userId: 'anonymous', raw: {} });
    }
    if (!token) return Either.error(new AuthTokenInvalidError('Empty token'));

    const parts = token.split('.');
    if (parts.length !== 3)
      return Either.error(new AuthTokenInvalidError('Malformed JWT'));

    const [headerB64, payloadB64, signatureB64] = parts;
    type JwtHeader = { alg: string; kid: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let header: JwtHeader | Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: Record<string, any>;
    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
      payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      );
    } catch {
      return Either.error(new AuthTokenInvalidError('Invalid JSON in token'));
    }

    if (this.cfg.issuer && payload.iss !== this.cfg.issuer)
      return Either.error(new AuthTokenInvalidError('Issuer mismatch'));
    if (this.cfg.audience && payload.aud !== this.cfg.audience)
      return Either.error(new AuthTokenInvalidError('Audience mismatch'));

    if (Date.now() / 1000 > payload.exp)
      return Either.error(new AuthTokenInvalidError('Token expired'));

    // Signature verification (RS256 only) minimal implementation
    if (header.alg !== 'RS256')
      return Either.error(new AuthTokenInvalidError('Unsupported alg'));

    const pem = await this.getPemForKid(header.kid);
    if (!pem)
      return Either.error(new AuthTokenInvalidError('JWKS key not found'));

    const verify = createVerify('RSA-SHA256');
    verify.update(`${headerB64}.${payloadB64}`);
    verify.end();
    const sig = Buffer.from(signatureB64, 'base64url');
    const ok = verify.verify(pem, sig);
    if (!ok)
      return Either.error(new AuthTokenInvalidError('Invalid signature'));

    const userId = payload[this.cfg.userIdClaim];
    if (!userId || typeof userId !== 'string')
      return Either.error(new AuthTokenInvalidError('UserId claim missing'));

    return Either.success({ userId, raw: payload });
  }

  private async getPemForKid(kid: string): Promise<string | null> {
    if (!this.cfg.jwksUri) return null;
    // Always fetch JWKS fresh (no local cache) to avoid stale keys in multi-container deployments
    let key;
    try {
      const res = await this.fetchFn(this.cfg.jwksUri);
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      key = (data.keys || []).find((k: any) => k.kid === kid);
    } catch {
      return null;
    }
    if (!key || !key.n || !key.e) return null;
    return this.rsaPublicKeyToPem(key.n, key.e);
  }

  private rsaPublicKeyToPem(
    modulusB64Url: string,
    exponentB64Url: string,
  ): string {
    const modulus = Buffer.from(modulusB64Url, 'base64url');
    const exponent = Buffer.from(exponentB64Url, 'base64url');

    // Build minimal DER sequence for RSA public key
    function derEncodeLength(len: number): Buffer {
      if (len < 128) return Buffer.from([len]);
      const bytes: number[] = [];
      let tmp = len;
      while (tmp > 0) {
        bytes.unshift(tmp & 0xff);
        tmp >>= 8;
      }
      return Buffer.from([0x80 | bytes.length, ...bytes]);
    }

    function derInteger(b: Buffer): Buffer {
      let buf = b;
      if (buf[0] & 0x80) buf = Buffer.concat([Buffer.from([0x00]), buf]);
      return Buffer.concat([
        Buffer.from([0x02]),
        derEncodeLength(buf.length),
        buf,
      ]);
    }

    const modInt = derInteger(modulus);
    const expInt = derInteger(exponent);
    const seqBody = Buffer.concat([modInt, expInt]);
    const fullSeq = Buffer.concat([
      Buffer.from([0x30]),
      derEncodeLength(seqBody.length),
      seqBody,
    ]);
    const bitString = Buffer.concat([
      Buffer.from([0x03]),
      derEncodeLength(fullSeq.length + 1),
      Buffer.from([0x00]),
      fullSeq,
    ]);
    const algId = Buffer.from('300d06092a864886f70d0101010500', 'hex'); // rsaEncryption OID
    const subjectPubKeyInfo = Buffer.concat([
      Buffer.from([0x30]),
      derEncodeLength(algId.length + bitString.length),
      algId,
      bitString,
    ]);
    const b64 = subjectPubKeyInfo.toString('base64');
    const pem = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
    return pem;
  }
}
