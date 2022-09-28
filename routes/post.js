import express from 'express';
const router = express.Router();
import Posts from "../controllers/post.js";
import Auth from "../middleware/authentication.js";
import upload from '../middleware/fileUpload.js';

router.post('/', Auth, Posts.create);

// router.post('/', Auth, upload.single('image'), Posts.create);

router.get('/', Auth, Posts.getPosts);

router.get('/singlepost/:postId', Auth, Posts.getSinglePost);

router.get('/getallposts/:userId', Auth, Posts.getUserPosts);

router.post('/updatepost/:postId', Posts.updatePost);

// router.post('/updatepost/:postId', Auth, upload.single('image'), Posts.updatePost);

router.delete('/deletepost/:postId', Auth, Posts.deletePost);

router.post('/likepost/:postId', Auth, Posts.likePost);

router.get('/likepost/:postId', Auth, Posts.likeUsers);

router.post('/bookmark', Auth, Posts.bookmark);

router.get('/bookmark/:userId', Auth, Posts.userBookmark);

router.post('/comment', Auth, Posts.comment);

router.post('/report', Auth, Posts.report);

router.post('/unblockreq', Auth, Posts.unblockReq);

router.get('/notification/:userId', Auth, Posts.getNotification);

router.delete('/notification/:notificationId', Auth, Posts.deleteNotification);

router.post('/singleimage', Auth, upload.single('image'), Posts.uploadImage);

router.post('/multipleimage', Auth, upload.array('image', 4), Posts.uploadMultipleImage);



export default router;
