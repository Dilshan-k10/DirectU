import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';


const register = async (req, res) => { 
    const { name, email, password } = req.body;

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: email },
    });

    if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


}

const getregister = async (req, res) => {
    res.json({ message: "Login endpoint is working!" });
}

export { register, getregister };