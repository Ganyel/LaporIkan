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
