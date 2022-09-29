// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const { Schema } = mongoose;


const CommentSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    comment: {
        type: String,
        required: true
    }
}, {
    versionKey: false
})

const Comment = mongoose.model('Comment', CommentSchema);
export default Comment

