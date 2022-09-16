import express from 'express';
const router = express.Router();
import Posts from "../controllers/post.js";
import Auth from "../middleware/authentication.js"

router.post('/', Auth, Posts.create);
router.get('/', Auth, Posts.getPosts);
router.get('/getallposts/:userId', Auth, Posts.getUserPosts);
router.post('/updatepost/:postId', Auth, Posts.updatePost);
router.delete('/deletepost/:postId', Auth, Posts.deletePost);
router.post('/likepost/:postId', Auth, Posts.likePost);




export default router;
