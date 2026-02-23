import jwt from 'jsonwebtoken';

const generateToken = (userId) => {

    const payload = {
        userId: userId
    };

    const token = jwt.sign(payload, );

    return token;

}