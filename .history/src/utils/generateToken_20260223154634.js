import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {

    const payload = {
        userId: userId
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

    res.cookie('jwt', token,    {
        httpOnly: true,
        se
            
    });

    return token;

}