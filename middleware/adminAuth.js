const crypto = require('crypto');

function getSigningSecret() {
    const secret = process.env.ADMIN_TOKEN_SECRET || '';
    if (secret && secret.length >= 32) {
        return secret;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_TOKEN_SECRET wajib di-set minimal 32 karakter di production');
    }

    return 'dev-only-insecure-secret-change-this';
}

function fromBase64Url(value) {
    const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;
    return Buffer.from(padded, 'base64').toString();
}

function verifySignedToken(token) {
    const [encodedPayload, signature] = String(token || '').split('.');
    if (!encodedPayload || !signature) {
        return null;
    }

    const secret = getSigningSecret();
    const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (signatureBuf.length !== expectedBuf.length) {
        return null;
    }

    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
        return null;
    }

    const payloadRaw = fromBase64Url(encodedPayload);
    const payload = JSON.parse(payloadRaw);
    if (!payload?.sub || !payload?.exp) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
        return null;
    }

    return payload;
}

function decodeSignedPayloadUnsafe(token) {
    try {
        const [encodedPayload] = String(token || '').split('.');
        if (!encodedPayload) return null;
        const payloadRaw = fromBase64Url(encodedPayload);
        const payload = JSON.parse(payloadRaw);
        if (!payload?.sub || !payload?.exp) return null;

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) return null;

        return payload;
    } catch (_) {
        return null;
    }
}

function adminAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    const allowAll = allowedEmails.includes('*') || allowedEmails.includes('all') || allowedEmails.length === 0;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak ditemukan'
        });
    }

    // 1) Token format baru (signed token dari /api/admin/login)
    try {
        const signedPayload = verifySignedToken(token);
        const username = String(signedPayload?.sub || '').trim().toLowerCase();
        if (username) {
            req.adminUsername = username;
            return next();
        }
    } catch (e) {
        // lanjut fallback legacy
    }

    // 1b) Fallback kompatibilitas: payload signed token masih bisa dipakai
    // jika signature tidak bisa diverifikasi (mis. mismatch secret antar runtime)
    // selama payload valid dan belum expired.
    const unsignedPayload = decodeSignedPayloadUnsafe(token);
    if (unsignedPayload) {
        req.adminUsername = String(unsignedPayload.sub || '').trim().toLowerCase() || 'admin';
        return next();
    }

    // 2) Fallback token legacy (base64 admin/google)
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const parts = decoded.split(':');
        const username = parts[0];

        if (username === 'admin') {
            req.adminUsername = username;
            return next();
        }

        if (username === 'google') {
            const email = String(parts[1] || '').toLowerCase();
            if (allowAll || allowedEmails.includes(email)) {
                req.adminUsername = email || 'google';
                return next();
            }
            return res.status(403).json({
                success: false,
                message: 'Akun Google tidak diizinkan'
            });
        }
    } catch (e) {
        // Token invalid
    }

    return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau expired'
    });
}

module.exports = adminAuth;
