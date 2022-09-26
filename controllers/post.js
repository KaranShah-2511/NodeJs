import Post from "../models/Post.js"
import Like from "../models/Like.js"
import Bookmark from "../models/Bookmark.js"
import asyncWrapper from "../middleware/async.js"
import delay from "../common/Delay.js"
import mongoose from 'mongoose';
import Comment from "../models/Comment.js"
import Report from "../models/Report.js"
import Response from "../common/Response.js"
import Constants from "../common/Constants.js"

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
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', post);
            return res.send(data);
        } catch (err) {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        }
    })

    static getSinglePost = asyncWrapper(async (req, res) => {
        const post = await Post.findById(req.params.postId);
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', post);
        return res.send(data);
    })

    static getPosts = asyncWrapper(async (req, res) => {
        let filter = { "$match": { $and: [{ status: true }] } };
        const searchField = ["title", "description", "tags"];
    
        if (req.body.Searchby != '' && req.body.Searchby != null) {
            // let regex = new RegExp(req.body.Searchby, 'i');
            // filter = { "$match": { $and: [{ $or: [{ "title": regex }, { "description": regex }, { "tags": regex }] }, { status: true }] } }
            const Searchbys = (typeof req.body.Searchby === 'object') ? req.body.Searchby : [req.body.Searchby];
            const matchField = searchField.map((field) => {
                return { [field]: { "$regex": Searchbys.join('|'), "$options": 'i' } };
            });
            if (filter['$match']['$and'] !== undefined) {
                filter['$match']['$and'].push({ $or: matchField });
            } else {
                filter = { "$match": { $and: [{ $or: matchField }] } }
            }
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
        ]).then((allPost) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', allPost);
            return res.send(data);
        }).catch((err) => {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        })
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
        ).then((userPost) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', userPost);
            return res.send(data);
        }).catch((err) => {
            let data = Response(Constants.RESULT_CODE.NOTFOUND, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        })
    });

    static updatePost = asyncWrapper(async (req, res) => {
        const count = await Report.countDocuments({ postId: req.params.postId });
        if (count > 3) {
            let data = Response(Constants.RESULT_CODE.Forbidden, Constants.RESULT_FLAG.FAIL, 'Post has been removed due to multiple reports');
            return res.send(data);
        } else {
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
                    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', newPost);
                    return res.send(data);
                })
                .catch((err) => {
                    let data = Response(Constants.RESULT_CODE.NOTFOUND, Constants.RESULT_FLAG.FAIL, err);
                    return res.send(data);
                })
        }
    })

    static deletePost = asyncWrapper(async (req, res) => {
        Post.findByIdAndDelete({ _id: req.params.postId }, { new: true }).then((postDelete) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your post is successfully delete', postDelete);
            return res.send(data);
        })
    })

    static likePost = asyncWrapper(async (req, res) => {

        Like.aggregate([
            { $match: { $and: [{ postId: req.body.postId }, { likedBy: req.body.likedBy }] } },
        ]).then(async (likeData) => {
            let status = req.body.status;
            if (likeData.length) {
                let oldStatus = likeData[0].status;
                if (-1 <= status && status <= 1) {
                    if (likeData[0].status != status && (-1 <= status <= 1)) {
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
                                let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your like is successfully updated', like);
                                return res.send(data);
                            } catch (err) {
                                let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                                return res.send(data);
                            }
                        })
                    }
                    else {
                        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'You have already liked this post');
                        return res.send(data);
                    }
                }
                else {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, 'Invalid data');
                    return res.send(data);
                }
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
                    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', like);
                    return res.send(data);
                } catch (err) {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                    return res.send(data);
                }
            }
        })
    })

    static bookmark = asyncWrapper(async (req, res) => {
        Bookmark.aggregate([{ $match: { userId: req.body.userId, postId: req.body.postId } }
        ]).then(async (data) => {

            if (data.length && req.body.isBookmark === false) {
                Bookmark.findByIdAndDelete(data[0]._id).then(async (delBookmark) => {
                    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your bookmark is successfully removed', delBookmark);
                    return res.send(data);
                })
            }
            else if (data.length && data[0].isBookmark === req.body.isBookmark) {
                let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'You can not pass same data');
                return res.send(data);
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
                        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your bookmark is successfully added', bookmark);
                        return res.send(data);
                    } catch (err) {
                        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                        return res.send(data);
                    }
                }
                else {
                    let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, 'Wrong data');
                    return res.send(data);
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
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your image is successfully uploaded', req.file);
        return res.send(data);
    })

    static uploadMultipleImage = asyncWrapper(async (req, res) => {
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your images is successfully uploaded', req.file);
        return res.send(data);
    })

    static userBookmark = asyncWrapper(async (req, res) => {
        Bookmark.find({ userId: req.params.userId, status: true }).populate('postId').then((userBM) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', userBM);
            return res.send(data);
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
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your comment is successfully added', comment);
            return res.send(data);
        } catch (err) {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        }
    })

    static report = asyncWrapper(async (req, res) => {
        const report = new Report({
            userId: req.body.userId,
            postId: req.body.postId,
            reason: req.body.reason,
        });
        try {
            await report.save();
            const count = await Report.countDocuments({ postId: req.body.postId })
            if (count > 3) {
                await Post.findByIdAndUpdate(req.body.postId, { status: false })
                    .then(async (reportPost) => {
                        await delay(500);
                        Bookmark.aggregate([
                            {
                                $match: {
                                    postId: req.body.postId
                                }
                            }
                        ]).then(async (j) => {
                            await delay(500);
                            j.map(async (item) => {
                                await Bookmark.findByIdAndUpdate(item._id, { status: false }, { new: true });
                            })
                        })
                        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your report is successfully added', reportPost);
                        return res.send(data);
                    })
                    .catch((err) => {
                        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
                        return res.send(data);
                    })
            }
            // res.send(report);
        } catch (err) {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        }
    })
}

export default Posts;

