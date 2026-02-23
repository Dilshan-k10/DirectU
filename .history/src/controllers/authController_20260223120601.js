
const register = async (req, res) => { 
    const { name, email, password } = req.body;

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

}

const getregister = async (req, res) => {
    res.json({ message: "Login endpoint is working!" });
}

export { register, getregister };