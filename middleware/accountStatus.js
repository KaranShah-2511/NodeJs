import User from "../models/User.js";
import asyncWrapper from "./async.js"


const  accoutStatus = asyncWrapper(async (req, res, next) => {
    
    const user = await User.findById(req.user._id);
    if(user.status == false){
        return res.send("Your account is blocked");
    }
    return next();
})

export default accoutStatus;