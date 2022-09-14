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
            console.log('user', user);
            return res.json({ token: jwt.sign({ email: user.email, fullName: user.fullName, _id: user._id }, 'RESTFULAPIs') });
        });
    })

}

export default Users;
