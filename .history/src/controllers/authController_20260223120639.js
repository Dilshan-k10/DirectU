import 
const register = async (req, res) => { 
    const { name, email, password } = req.body;

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }

}

const getregister = async (req, res) => {
    res.json({ message: "Login endpoint is working!" });
}

export { register, getregister };