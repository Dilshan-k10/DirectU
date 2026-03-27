import jwt from 'jsonwebtoken';
import { generateToken } from '../utils/generateToken.js';
import { prisma } from '../config/db.js';

export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token not found' });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, role: true }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            generateToken(user.id, user.role, res);
            res.status(200).json({ message: 'Token refreshed successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
