// import mongoose from 'mongoose ';
import mongoose, { Schema } from 'mongoose';

const UnblockReqSchema = new mongoose.Schema({
    userId: Schema.Types.ObjectId,
    postId: {
        type:Schema.Types.ObjectId,
        unique: true,
    },
    status: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
    },
    created: {
        type: Date,
        default: Date.now
    },
}, {
    versionKey: false
})

const UnblockReq = mongoose.model('UnblockReq', UnblockReqSchema);
export default UnblockReq