import express from 'express';
const router = express.Router();
import Users from "../controllers/user.js";

router.post('/register', Users.register);
router.post('/sign_in', Users.sign_in);
router.get('/upload', Users.authentication, Users.upload);




export default router;
