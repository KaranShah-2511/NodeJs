import Post from "../models/Post.js"
import Like from "../models/Like.js"
import asyncWrapper from "../middleware/async.js"

class Posts {
    static create = asyncWrapper(async (req, res) => {
        const post = new Post({
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags || [],
            createdBy: req.body.createdBy,
            UpdatedDate: new Date(),
        });
        try {
            await post.save();
            res.send(post);
        } catch (err) {
            console.log(err);
        }
    })

    static getPosts = asyncWrapper(async (req, res) => {
        let filter = { "$match": { $and: [{ status: true }] } };
        if (req.body.Searchby != '' && req.body.Searchby != null) {
            let regex = new RegExp(req.body.Searchby, 'i');
            filter = { "$match": { $and: [{ $or: [{ "title": regex }, { "description": regex }, { "tags": regex }] }, { status: true }] } }
        }
        Post.aggregate([filter,
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
                    dislikes: "$dislikes"
                }
            },
            { $sort: { created: -1 } }
        ]).then((s) => res.send(s))
    });

    static getUserPosts = asyncWrapper(async (req, res) => {
        Post.aggregate(
            [
                { $match: { createdBy: req.params.userId } },
                {
                    $project: {
                        title: '$title',
                        description: '$description',
                        tags: '$tags',
                        createdBy: '$createdBy',
                        created: "$created",
                        status: "$status",
                        likes: "$likes",
                        dislikes: "$dislikes"
                    }
                },
                { $sort: { created: -1 } }
            ]
        ).then((s) => res.send(s))
    });

    static updatePost = asyncWrapper(async (req, res) => {
        Post.findByIdAndUpdate({ _id: req.params.postId }, {
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags || [],
            createdBy: req.body.createdBy,
            UpdatedDate: new Date(),
            status: req.body.status,
        }, { new: true }).then((newPost) => res.send(newPost))
    })

    static deletePost = asyncWrapper(async (req, res) => {
        Post.findByIdAndDelete({ _id: req.params.postId }, { new: true }).then((dl) => res.send(dl))
    })

    static likePost = asyncWrapper(async (req, res) => {

        Like.aggregate([
            { $match: { $and: [{ postId: req.body.postId }, { likedBy: req.body.likedBy }] } },
        ]).then(async (s) => {

            if (s.length) {
                let oldstatus = s[0].status;
                if (-1 <= req.body.status && req.body.status <= 1) {

                    if (s[0].status != req.body.status && (-1 <= req.body.status <= 1)) {

                        Like.findOneAndDelete({ likedBy: req.body.likedBy, postId: req.body.postId }).then(async (data) => {
                            const like = new Like({
                                likedBy: req.body.likedBy,
                                postId: req.body.postId,
                                status: req.body.status
                            });
                            try {
                                await like.save().then(async (i) => {

                                    if (req.body.status === 1) {
                                    
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ({ $inc: { likes: 1, dislikes: -1 } })
                                        )
                                    }
                                    else if (req.body.status === 0) {
                                    
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ((oldstatus === 1) ? { $inc: { likes: -1 } } : { $inc: { dislikes: -1 } })
                                        )
                                    }
                                    else {
                                    
                                        await Post.findByIdAndUpdate(req.body.postId,
                                            ({ $inc: { dislikes: 1, likes: -1 } })
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
                    status: req.body.status
                });
                try {
                    await like.save().then(async (i) => {
                        if (req.body.status === 1) {
                            await Post.findByIdAndUpdate(req.body.postId,
                                ({ $inc: { likes: 1 } })
                            )
                        }
                        else if (req.body.status === -1) {
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
}

export default Posts;
