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
import UnblockReq from "../models/UnblockReq.js"
import lookup from "../common/LookUp.js"
import Notification from "../models/Notification.js"

class Admin {

  static allUser = asyncWrapper(async (req, res) => {
    let filter = { "$match": { $and: [{ userType: "User", status: true }] } };
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

  static getUserCount = asyncWrapper(async (req, res) => {

    User.aggregate([
      { "$match": { $and: [{ userType: "User", status: true }] } },
      { "$group": { _id: null, TotalUsercount: { $sum: 1 } } }
    ])
      .then((users) => {
        var diffMonth = 0 + (req.body.month != '' ? req.body.month : 1);
        var date = new Date(), y = date.getFullYear(), m = date.getMonth();
        var firstDay = new Date(y, m - (diffMonth - 1), 1);
        var lastDay = new Date(y, m + 1, 2);
        User.find({
          created: {
            $gte: firstDay,
            $lt: lastDay
          }

        })
          .then((users1) => {
            users[0]["filterCount"] = users1.length
            let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', { users });
            return res.send(data);
          })

        // let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', users);
        // return res.send(data);
      })
  })

  static getUserPostCount = asyncWrapper(async (req, res) => {

    const year = req.body.year || new Date().getFullYear();
    const user = []; const post = []; const reportData = [];
    let userCount = 0;

    for (let i = 0; i <= 11; i++) {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 1);
      // const start = new Date(year, i, 2);
      // const end = new Date(year, i+1 , 1);


      User.find({
        "userType": "User",
        "created": {
          "$gt": start,
          "$lte": end
        }
        // created: {$gt: start,$lt: end},userType:"User"
      })
        .then(async (res) => {

          user.splice(i, 0,
            res.length
          );
          await delay(500)
        })

      Post.find({
        "created": {
          "$gt": start,
          "$lte": end
        }
      })
        .then(async (res) => {
          post.splice(i, 0,
            res.length
          );
          await delay(500)
        })

      Report.find({
        "created": {
          "$gt": start,
          "$lte": end
        }
      })
        .then(async (res) => {
          reportData.splice(i, 0,
            res.length
          );
          await delay(500)
        })
    }

    await delay(500)
    const count = { user, post, reportData }
    let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', count);
    return res.send(data);

  })

  static getPostCount = asyncWrapper(async (req, res) => {
    const user = [];
    const count = [];
    Post.aggregate([{
      $group: {
        _id: '$createdBy',
        count: {
          $sum: 1
        }
      }
    }, {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    }, {
      $sort: {
        count: -1
      }
    }, {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    }, {
      $project: {
        name: '$user.fullName',
        count: '$count'
      }
    }]).then((value) => {
      // value.forEach((element) => {
      //   user.push(element.name);
      //   count.push(element.count);
      // });
      value.map((name, i) => {
        user.splice(i, 0,
          name.name
        );
        count.splice(i, 0,
          name.count
        );
      })
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', { user, count });
      return res.send(data);
    })
  })

  static blockUser = asyncWrapper(async (req, res) => {
    let filter = { "$match": { $and: [{ userType: "User", status: false }] } };
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
      [{ $match: { status: true } },
      {
        $group: {
          _id: { postId: '$postId' },
          count: { $sum: 1 }
        }
      },
      ...lookup("posts", "_id.postId", "_id", "post"),
      ...lookup("users", "post.createdBy", "_id", "user"),
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

    ).then((reportData) => {
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', reportData);
      return res.send(data);
    })
  })

  static reviewPost = asyncWrapper(async (req, res) => {
    await Post.findByIdAndUpdate(req.params.postId, { status: req.body.status })
      .then(async (reportPost) => {
        await delay(500);
        await Bookmark.updateMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { status: req.body.status }, { new: true })
        // Bookmark.aggregate([
        //   {
        //     $match: {
        //       postId: mongoose.Types.ObjectId(req.params.postId)
        //     }
        //   }
        // ]).then(async (j) => {
        //   await delay(500);
        //   j.map(async (item) => {
        //     await Bookmark.findByIdAndUpdate(item._id, { status: req.body.status }, { new: true });
        //   })
        // })

        // Report.aggregate([
        //   {
        //     $match: {
        //       postId: mongoose.Types.ObjectId(req.params.postId)
        //     }
        //   }
        // ]).then(async (reports) => {
        //   await delay(500);
        //   reports.map(async (item) => {
        //     await Report.findByIdAndUpdate(item._id, { status: false }, { new: true });
        //   })
        // })
        await Report.updateMany({ postId: mongoose.Types.ObjectId(req.params.postId) }, { status: false }, { new: true })
          .then(async (nofion) => {
            const notification = new Notification({
              owner: reportPost.createdBy,
              postId: req.params.postId,
              description: (req.body.status === true) ? `Your post ${reportPost.title} is enable` : `Your post ${reportPost.title} violate policy`
            })
            try {
              await notification.save();
            } catch (err) {
              let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
              return res.send(data);
            }
          })
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, 'Your updated status', reportPost);
        return res.send(data);
      })
      .catch((err) => {
        let data = Response(Constants.RESULT_CODE.ERROR, Constants.RESULT_FLAG.FAIL, err);
        return res.send(data);
      })
  })

  static getAllReq = asyncWrapper(async (req, res) => {
    UnblockReq.aggregate([
      {
        $match: {
          type: 'Post'
        }
      },
      ...lookup("posts", "postId", "_id", "post"),
      ...lookup("users", "userId", "_id", "user"),
      {
        $project: {
          _id: '$_id',
          title: '$post.title',
          description: '$post.description',
          tags: '$post.tags',
          createdBy: '$post.createdBy',
          created: '$post.created',
          status: '$post.status',
          likes: '$post.likes',
          dislikes: '$post.dislikes',
          TotalReport: '$count',
          name: '$user.fullName',
          email: '$user.email',
          type: "$type",
          ReqDescription: "$description"
        }
      }]).then((allreq) => {
        let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', allreq);
        return res.send(data);
      })
  })

  static getAllAccReq = asyncWrapper(async (req, res) => {
    UnblockReq.aggregate([{ $match: { type: 'Account' } },
    ...lookup("users", "userId", "_id", "user"),
    {
      $project: {
        _id: '$_id',
        name: '$user.fullName',
        email: '$user.email',
        type: "$type",
        ReqDescription: "$description"
      }
    }]).then((allreq) => {
      let data = Response(Constants.RESULT_CODE.OK, Constants.RESULT_FLAG.SUCCESS, '', allreq);
      return res.send(data);
    })
  })

}

export default Admin;
