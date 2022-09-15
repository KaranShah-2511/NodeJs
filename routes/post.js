import express from 'express';
const router = express.Router();
import Posts from "../controllers/post.js";
import Auth from "../middleware/authentication.js"

router.post('/', Auth, Posts.create);
router.get('/', Auth, Posts.getPosts);
router.get('/:id', Auth, Posts.getUserPosts);




export default router;
