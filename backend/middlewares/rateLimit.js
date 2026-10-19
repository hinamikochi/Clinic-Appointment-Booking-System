// Per-process limiter; configure a shared gateway limit when running multiple replicas.
module.exports = function rateLimit(max = 10, windowMs = 15 * 60000) {
    const hits = new Map();
    return (req, res, next) => {
        const now = Date.now(), key = req.ip;
        if (hits.size > 5000) for (const [ip, entry] of hits) if (entry.until <= now) hits.delete(ip);
        let entry = hits.get(key);
        if (!entry || entry.until <= now) { entry = { count: 0, until: now + windowMs }; hits.set(key, entry); }
        if (++entry.count > max) { res.set('Retry-After', String(Math.ceil((entry.until - now) / 1000))); return res.status(429).json({ message: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.' }); }
        next();
    };
};
