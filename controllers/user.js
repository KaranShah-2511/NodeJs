import User from "../models/User.js"
import asyncWrapper from "../middleware/async.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import PostHitCount from "../models/PostHitCount.js"
import mongoose from "mongoose"
import tokenDecode from "../common/TokenDecode.js"
import Response from "../common/Response.js"
import Constants from "../common/Constants.js"
import lookup from "../common/LookUp.js"

class Users {
    static register = asyncWrapper(async (req, res) => {
        var newUser = new User(req.body);
        newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
        newUser.save((err, user) => {
            if (err) {
                return res.status(400).send({
                    message: err
                });
            } else {
                user.hash_password = undefined;
                return res.json(user);
            }
        });
    })

    static sign_in = asyncWrapper(async (req, res) => {
        User.findOne({
            email: req.body.email
        }, function (err, user) {
            if (err) throw err;
            if (!user || !user.comparePassword(req.body.password)) {
                return res.status(401).json({ message: 'Authentication failed. Invalid user or password.' });
            }
            const updates = {}
            updates["Token"] = jwt.sign({ email: user.email, fullName: user.fullName, _id: user._id }, 'RESTFULAPIs', {
                expiresIn: '2h',
            });
            User.findOneAndUpdate({ email: req.body.email }, {
                $set: updates
            }, { new: true })
                .then((data) => {
                    User.aggregate([{
                        $match: {
                            _id: data._id
                        },
                    },
                    {
                        $project: {
                            Email: '$email',
                            FullName: '$fullName',
                            Token: '$Token',
                            UserType: '$userType'
                        }
                    }], (err, data) => {
                        res.status(200).json(data)
                    })
                })

        });
    })

    static profile = asyncWrapper(async (req, res) => {

        User.findOne({ _id: req.params.userId }, (err, user) => {
            if (err) throw err;
            if (!user) { return res.status(401).json({ message: 'Authentication failed. Invalid user or password.' }); }

            User.aggregate([{ $match: { email: user.email } },
            {
                $project: {
                    Email: '$email',
                    FullName: '$fullName',
                    _id: '$_id'
                }
            }]).then((data) => res.send(data))
        });
    })

    static userHistory = asyncWrapper(async (req, res) => {
        const userData = tokenDecode(req.headers.authorization);
        PostHitCount.aggregate([{
            $match: {
                userId: mongoose.Types.ObjectId(userData._id)
            }
        },
        ...lookup("posts", 'postId', '_id', 'post'),
        ...lookup("users", 'userId', '_id', 'user'),
        {
            $project: {
                _id: '$post._id',
                title: '$post.title',
                description: '$post.description',
                tags: '$post.tags',
                likes: '$post.likes',
                dislikes: '$post.dislikes',
                viewed: '$viewed',
                name: '$user.fullName',
                email: '$user.email'
            }
        }]).then((history) => {
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', history);
            return res.send(data);
        }).catch((err) => {
            let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
            return res.send(data);
        })
    })

}

export default Users;
