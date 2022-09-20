// import mongoose from 'mongoose ';
import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
    likedBy: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        enum: [-1, 0, 1]
    }
},{
    versionKey: false
})

const Like = mongoose.model('Like', LikeSchema);
export default Like