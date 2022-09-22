import User from "../models/User.js"
import asyncWrapper from "../middleware/async.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

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
                            Token: '$Token'
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



}

export default Users;
