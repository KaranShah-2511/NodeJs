import User from "../models/User.js"
import asyncWrapper from "../middleware/async.js"
import jwt from "jsonwebtoken"
import  bcrypt from "bcrypt"


class Users {
    static register = asyncWrapper(async (req, res) => {
        var newUser = new User(req.body);
        newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
        newUser.save(function(err, user) {
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
}

export default Users;
