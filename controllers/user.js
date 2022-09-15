import User from "../models/User.js"
import asyncWrapper from "../middleware/async.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


class Users {
    static register = asyncWrapper(async (req, res) => {
        var newUser = new User(req.body);
        newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
        newUser.save(function (err, user) {
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
            updates["Token"] = jwt.sign({ email: user.email, fullName: user.fullName, _id: user._id }, 'RESTFULAPIs',  {
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
                }], (err, data) =>  {
                    res.status(200).json(data)
                })
            })

        });
    })

    static upload = asyncWrapper(asyncWrapper((req, res) => {
        res.send("success")
    }))

}

export default Users;
