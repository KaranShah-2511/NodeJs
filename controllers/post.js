import Post from "../models/Post.js"
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
        let filter = { "$match": {} };
        if (req.body.Searchby != '' && req.body.Searchby != null) {
            let regex = new RegExp(req.body.Searchby, 'i');
            filter = { "$match": { $and: [{ $or: [{ "title": regex }, { "description": regex }, { "tags": regex }] }] } }
        }
        Post.aggregate([filter,
            {
                $project: {
                    _id: "$_id",
                    title: '$title',
                    description: '$description',
                    tags: '$tags',
                    createdBy: '$createdBy',
                    created: "$created"
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
                        created: "$created"
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
        }, { new: true }).then((newPost) => res.send(newPost))
    })

    static deletePost = asyncWrapper(async (req, res) => {
        Post.findByIdAndDelete({ _id: req.params.postId }, { new: true }).then((dl) => res.send(dl))
    })
}

export default Posts;
