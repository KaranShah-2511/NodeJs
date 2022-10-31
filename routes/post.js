import express from 'express';
const router = express.Router();
import Posts from "../controllers/post.js";
import Auth from "../middleware/authentication.js";
import IsBlock from "../middleware/accountStatus.js";
import upload from '../middleware/fileUpload.js';

//add IsBlock after Auth

router.post('/', Auth, Posts.create);

// router.post('/', Auth, upload.single('image'), Posts.create);

router.post('/getallpost', Auth, Posts.getPosts);

router.get('/singlepost/:postId', Auth, Posts.getSinglePost);

router.get('/getallposts/:userId', Auth, Posts.getUserPosts);

router.post('/updatepost/:postId', Posts.updatePost);

// router.post('/updatepost/:postId', Auth, upload.single('image'), Posts.updatePost);

router.delete('/deletepost/:postId', Auth, Posts.deletePost);

router.post('/likepost/:postId', Auth, Posts.likePost);

router.get('/likepost/:postId', Auth, Posts.likeUsers);

router.post('/bookmark', Auth, Posts.bookmark);

router.get('/bookmark', Auth, Posts.userBookmark);

router.post('/comment', Auth, Posts.comment);

router.get('/comment/:postId', Auth, Posts.getComment);

router.post('/postreport', Auth, Posts.postReport);

router.post('/accountreport', Auth, Posts.accReport);

router.post('/unblockreq', Auth, Posts.unblockReq);



router.post('/singleimage', Auth, upload.single('image'), Posts.uploadImage);

router.post('/multipleimage', Auth, upload.array('image', 4), Posts.uploadMultipleImage);



export default router;
