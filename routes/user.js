import express from 'express';
const router = express.Router();
import Users from "../controllers/user.js";

router.post('/register', Users.register );




export default router;
