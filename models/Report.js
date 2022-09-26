// import mongoose from 'mongoose ';
import mongoose from 'mongoose';
const { Schema } = mongoose;


const ReportSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    }
}, {
    versionKey: false
})

const Report = mongoose.model('Report', ReportSchema);
export default Report

