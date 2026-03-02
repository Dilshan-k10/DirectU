import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';
impo


const register = async (req, res) => { 
    const { name, email, password, role,  } = req.body;

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

    // Create new user
    const user = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: hashedPassword,
            role: role,

        }
    });
    
    res.status(201).json({
        status: "success",
        message: "User created successfully",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });


}

const login = async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists in the Table
    const user = await prisma.user.findUnique({
        where: { email: email },
    });

    if (!user) {
        return res.status(401).json({
            error: "Invalid email or password"
        });
    }

    // verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            error: "Invalid email or password"
        });
    }

    // generate JWT token
    const token = generateToken();

    
    res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });




};
 

export { register, login };