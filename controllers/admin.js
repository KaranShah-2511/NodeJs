// import Task from "../models/Task.js"
import asyncWrapper from "../middleware/async.js"
import User from "../models/User.js"
import Response from "../common/Response.js"
import Constants from "../common/Constants.js"
import Report from "../models/Report.js"
import Post from "../models/Post.js"
import Bookmark from "../models/Bookmark.js"
import mongoose from "mongoose"
import delay from "../common/Delay.js"

class Admin {

  static allUser = asyncWrapper(async (req, res) => {
    let filter = { "$match": { $and: [{ userType: "User" }] } };
    const searchField = ["fullName", "email"];

    if (req.body.Searchby != '' && req.body.Searchby != null) {

      const Searchbys = (typeof req.body.Searchby === 'object') ? req.body.Searchby : [req.body.Searchby];
      const matchField = searchField.map((field) => {
        return { [field]: { "$regex": Searchbys.join('|'), "$options": 'i' } };
      });
      if (filter['$match']['$and'] !== undefined) {
        filter['$match']['$and'].push({ $or: matchField });
      } else {
        filter = { "$match": { $and: [{ $or: matchField }] } }
      }
    }

    User.aggregate([filter])
      .then((users) => {
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', users);
        return res.send(data);
      })
  })

  static reportedPost = asyncWrapper(async (req, res) => {
    Report.aggregate(
      [{
        $group: {
          _id: { postId: '$postId' },
          count: { $sum: 1 }
        }
      }, {
        $lookup: {
          from: 'posts',
          localField: '_id.postId',
          foreignField: '_id',
          as: 'post'
        }
      }, {
        $unwind: {
          path: '$post',
          preserveNullAndEmptyArrays: true
        }
      }, {
        $lookup: {
          from: 'users',
          localField: 'post.createdBy',
          foreignField: '_id',
          as: 'user'
        }
      }, {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: '$_id.postId',
          title: '$post.title',
          description: '$post.description',
          tags: '$post.tags',
          createdBy: '$post.createdBy',
          created: '$post.created',
          status: '$post.status',
          likes: '$post.likes',
          dislikes: '$post.dislikes',
          TotalReport: '$count',
          name: "$user.fullName",
          email: "$user.email",
        }
      },
      { $sort: { TotalReport: -1 } }]

    ).then((repotData) => {
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', repotData);
      return res.send(data);
    })
  })

  static reviewPost = asyncWrapper(async (req, res) => {
    await Post.findByIdAndUpdate(req.params.postId, { status: req.body.status })
      .then(async (reportPost) => {
        await delay(500);
        Bookmark.aggregate([
          {
            $match: {
              postId: mongoose.Types.ObjectId(req.params.postId)
            }
          }
        ]).then(async (j) => {
          await delay(500);
          j.map(async (item) => {
            await Bookmark.findByIdAndUpdate(item._id, { status: req.body.status }, { new: true });
          })
        })
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your report is successfully added');
        return res.send(data);
      })
      .catch((err) => {
        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
        return res.send(data);
      })
  })

  

}

export default Admin;
