import express from 'express';
const router = express.Router();
import Users from "../controllers/user.js";
import Auth from "../middleware/authentication.js"

router.post('/register', Users.register);
router.post('/sign_in', Users.sign_in);
router.get('/profile/:userId', Auth, Users.profile);
router.get('/history', Auth, Users.userHistory);




export default router;
