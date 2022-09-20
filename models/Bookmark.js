// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const { Schema } = mongoose;


const BookmarkSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
         ref: 'Post'
    },
    isBookmark:{
        type: Boolean,
        default:false
    }
},{
    versionKey: false
})

const Bookmark = mongoose.model('Bookmark', BookmarkSchema);
export default Bookmark