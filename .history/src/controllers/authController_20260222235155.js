import e from 'express';
import express from 'express';

const register = async (req, res) => { 
    res.json({ message: "Register endpoint is working!" });

}

const getregister = async (req, res) => {
    res.json({ message: "Login endpoint is working!" });
}

export { register, getregister };