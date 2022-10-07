import express from 'express';
import Admin from '../controllers/admin.js';
import Auth from "../middleware/authentication.js";
const router = express.Router();

router.get('/', Auth, Admin.allUser);

router.get('/blockusers', Auth, Admin.blockUser);

router.get('/repotedpost', Auth, Admin.reportedPost);

router.post('/repotedpost/:postId', Auth, Admin.reviewPost);

router.get('/post/blockpost/req', Auth , Admin.getAllReq)

router.get('/post/blockaccount/req', Auth , Admin.getAllAccReq)

// router.get('/post/block/req', Auth , Admin.getAllReq)





export default router;
