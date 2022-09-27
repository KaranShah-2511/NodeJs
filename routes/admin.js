import express from 'express';
import Admin from '../controllers/admin.js';
import Auth from "../middleware/authentication.js";
const router = express.Router();

router.get('/', Auth, Admin.allUser);

router.get('/repotedpost', Auth, Admin.reportedPost);

router.post('/repotedpost/:postId', Auth, Admin.reviewPost);





export default router;
