
const register = async (req, res) => { 
    const { username, password } = req.body;

}

const getregister = async (req, res) => {
    res.json({ message: "Login endpoint is working!" });
}

export { register, getregister };