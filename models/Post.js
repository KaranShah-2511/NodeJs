// import mongoose from 'mongoose ';
import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    createdBy: {
        type: String,
        require: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    tags: {
        type: Array,
        "default": []
    },
    UpdatedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: Boolean,
        default: true
    }
})

const Post = mongoose.model('Post', PostSchema);
export default Post