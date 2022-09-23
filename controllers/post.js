import Post from "../models/Post.js"
import Like from "../models/Like.js"
import Bookmark from "../models/Bookmark.js"
import asyncWrapper from "../middleware/async.js"
import delay from "../middleware/delay.js"
import mongoose from 'mongoose';
import Comment from "../models/Comment.js"


class Posts {
    static create = asyncWrapper(async (req, res) => {
        const post = new Post({
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags || [],
            createdBy: req.body.createdBy,
            UpdatedDate: new Date(),
            // imagePath: req.file.filename
        });
        try {
            await post.save();
            res.send(post);
        } catch (err) {
            res.send(err);
        }
    })

    static getPosts = asyncWrapper(async (req, res) => {
        let filter = { "$match": { $and: [{ status: true }] } };
        if (req.body.Searchby != '' && req.body.Searchby != null) {
            let regex = new RegExp(req.body.Searchby, 'i');
            filter = { "$match": { $and: [{ $or: [{ "title": regex }, { "description": regex }, { "tags": regex }] }, { status: true }] } }
        }
        Post.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            filter,
            {
                $project: {
                    _id: "$_id",
                    title: '$title',
                    description: '$description',
                    tags: '$tags',
                    createdBy: '$createdBy',
                    created: "$created",
                    status: "$status",
                    likes: "$likes",
                    dislikes: "$dislikes",
                    name: "$user.fullName",
                    email: "$user.email",
                    // imagePath: "$imagePath",
                }
            },
            { $sort: { created: -1 } }
        ]).then((s) => res.send(s))
    });

    static getUserPosts = asyncWrapper(async (req, res) => {
        Post.aggregate(
            [
                { $match: { createdBy: (mongoose.Types.ObjectId(req.params.userId)) } },
                {
                    $project: {
                        title: '$title',
                        description: '$description',
                        tags: '$tags',
                        createdBy: '$createdBy',
                        created: "$created",
                        status: "$status",
                        likes: "$likes",
                        dislikes: "$dislikes",
                        // imagePath: "$imagePath"
                    }
                },
                { $sort: { created: -1 } }
            ]
        ).then((s) => res.send(s))
    });

    static updatePost = asyncWrapper(async (req, res) => {
        await Post.findByIdAndUpdate({ _id: req.params.postId }, {
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags || [],
            createdBy: req.body.createdBy,
            UpdatedDate: new Date(),
            status: req.body.status,
            // imagePath: req.file.filename
        }, { new: true })
            .then(async (newPost) => {
                await delay(500);
                Bookmark.aggregate([
                    {
                        $match: {
                            postId: req.params.postId
                        }
                    }
                ]).then(async (j) => {
                    await delay(500);
                    j.map(async (item) => {
                        // Bookmark.findByIdAndUpdate({item._id }, { status: req.body.status }, { new: true })
                        await Bookmark.findByIdAndUpdate(item._id, { status: req.body.status }, { new: true });
                    })
                })

                res.send(newPost)
            })
            .catch((err) => {
                res.send(err)
            })
    })

    static deletePost = asyncWrapper(async (req, res) => {
        Post.findByIdAndDelete({ _id: req.params.postId }, { new: true }).then((dl) => res.send(dl))
    })

    static likePost = asyncWrapper(async (req, res) => {

        Like.aggregate([
            { $match: { $and: [{ postId: req.body.postId }, { likedBy: req.body.likedBy }] } },
        ]).then(async (s) => {
            let status = req.body.status;
            if (s.length) {
                let oldStatus = s[0].status;
                if (-1 <= status && status <= 1) {
                    if (s[0].status != status && (-1 <= status <= 1)) {
                        Like.findOneAndDelete({ likedBy: req.body.likedBy, postId: req.body.postId }).then(async (data) => {
                            const like = new Like({
                                likedBy: req.body.likedBy,
                                postId: req.body.postId,
                                status: req.body.status
                            });
                            try {
                                await like.save().then(async (i) => {
                                    if (status === 1) {
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ((oldStatus != 0) ? { $inc: { likes: 1, dislikes: -1 } } : { $inc: { likes: 1 } })
                                        )
                                    }
                                    else if (status === 0) {
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ((oldStatus === 1) ? { $inc: { likes: -1 } } : { $inc: { dislikes: -1 } })
                                        )
                                    }
                                    else {
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ((oldStatus != 0) ? { $inc: { dislikes: 1, likes: -1 } } : { $inc: { dislikes: 1 } })
                                        )
                                    }
                                });
                                res.send(like);
                            } catch (err) {
                                return res.status(400).send({
                                    message: err
                                });
                            }
                        })
                    }
                    else { res.send("You can not send same data") }
                }
                else { res.send("Not valid data") }
            }
            else {
                const like = new Like({
                    likedBy: req.body.likedBy,
                    postId: req.body.postId,
                    status: status
                });
                try {
                    await like.save().then(async (i) => {
                        if (status === 1) {
                            await Post.findByIdAndUpdate(req.body.postId,
                                ({ $inc: { likes: 1 } })
                            )
                        }
                        else if (status === -1) {
                            await Post.findByIdAndUpdate(req.body.postId,
                                ({ $inc: { dislikes: 1 } })
                            )
                        }
                    });
                    res.send(like);
                } catch (err) {
                    console.log(err);
                }
            }
        })
    })

    static bookmark = asyncWrapper(async (req, res) => {
        Bookmark.aggregate([{ $match: { userId: req.body.userId, postId: req.body.postId } }
        ]).then(async (data) => {

            if (data.length && req.body.isBookmark === false) {
                Bookmark.findByIdAndDelete(data[0]._id).then(async (i) => {
                    res.send("delete bookmark")
                })
            }
            else if (data.length && data[0].isBookmark === req.body.isBookmark) {
                res.send("You can not pass same data")
            }
            else {
                if (req.body.isBookmark === true) {
                    const bookmark = new Bookmark({
                        userId: req.body.userId,
                        postId: req.body.postId,
                        isBookmark: req.body.isBookmark,
                    });
                    try {
                        await bookmark.save();
                        res.send(bookmark);
                    } catch (err) {
                        console.log(err);
                    }
                }
                else {
                    res.send("Wrong data")
                }

            }
        })


    })

    // static userBookmark = asyncWrapper(async (req, res) => {
    //     Bookmark.find({ userId: req.params.userId, status: true }).then((data) => {
    //         res.send(data)
    //     })
    // })

    static uploadImage = asyncWrapper(async (req, res) => {
        res.send(req.file)
    })

    static uploadMultipleImage = asyncWrapper(async (req, res) => {
        res.send(req.files)
    })

    static userBookmark = asyncWrapper(async (req, res) => {
        Bookmark.find({ userId: req.params.userId, status: true }).populate('postId').then((data) => {
            res.send(data)
        })
    })

    static comment = asyncWrapper(async (req, res) => {
        const comment = new Comment({
            userId: req.body.userId,
            postId: req.body.postId,
            comment: req.body.comment,
        });
        try {
            await comment.save();
            res.send(comment);
        } catch (err) {
            console.log(err);
        }
    })
}

export default Posts;

