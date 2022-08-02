const _ = require("lodash");
const Model = require("../../models");
const moment = require("moment");
const Auth = require("../../common/authenticate");
const functions = require("../../common/functions");
const mongoose = require("mongoose");
const constants = require("../../common/constants");
const validation = require('../validations/User')
const flatten = require("flat");
const ObjectId = mongoose.Types.ObjectId;
const es = require("event-stream");
const fs = require("fs");
const gravatar = require('gravatar');

const _sendEmailVerification = async (doc, email) => {
  try {
    if (!doc) throw new Error("Document Missing");
    if (!email) throw new Error("Email Missing");

    doc = JSON.parse(JSON.stringify(doc));
    const tobeUpdated = {};
    if (doc.email && doc.email === email && doc.isEmailVerified === true) {
      tobeUpdated.email = email;
      const token = functions.generateNumber(4);
      tobeUpdated.tempData = Object.assign({}, doc.tempData, {
        email: email,
        emailSecret: token,
        emailSecretExpiry: Date.now() + 60 * 60 * 1e3,
      });

      await Model.User.updateOne({
        _id: doc._id
      }, {
        $set: tobeUpdated
      });

      if (token) {
        process.emit("sendEmail", {
          to: email,
          title: "Verify your account",
          message: `Please, use this code address to verify your account - <b>${token}</b>`,
        });
      }
      return;
    } else if (!doc.email) {
      tobeUpdated.email = email;
      tobeUpdated.isEmailVerified = false;
    }

    const token = functions.generateNumber(4);

    tobeUpdated.tempData = Object.assign({}, doc.tempData, {
      email: email,
      emailSecret: token,
      emailSecretExpiry: Date.now() + 60 * 60 * 1e3,
    });

    await Model.User.updateOne({
      _id: doc._id
    }, {
      $set: tobeUpdated
    });

    if (token) {
      process.emit("sendEmail", {
        to: email,
        title: "Verify your account",
        message: `Please, use this code address to verify your account - <b>${token}</b>`,
      });
    }
  } catch (error) {
    console.error("_sendEmailVerification", error);
  }
};
const _sendNewPasswordInEmail = async (doc, email) => {
  try {
    if (!doc) throw new Error("Document Missing");
    if (!email) throw new Error("Email Missing");
    if (!doc) throw new Error("ACCOUNT_NOT_FOUND");
    await doc.setPassword(token);
    await doc.save();

    if (token) {
      process.emit("sendEmail", {
        to: email,
        title: "Account New Password",
        message: `Please, use this code address to verify your account - <b>${token}</b>`,
      });
    }
  } catch (error) {
    console.error("_sendNewPasswordInEmail", error);
  }
};
const _sendForgotLinkInEmail = async (doc, email) => {
  try {
    if (!doc) throw new Error("ACCOUNT_NOT_FOUND");
    if (!email) throw new Error("Email Missing");
    const link = Model.LinkModel.findOne({
      user: doc._id
    });
    if (link) await Model.LinkModel.deleteMany({
      user: doc._id
    });
    const query = await Model.LinkModel({
      user: doc._id
    }).save();
    let url = `http://localhost:3000/reset-password/${query._id}`
    if (link != null) {
      process.emit("sendEmail", {
        to: email,
        title: "Account New Password",
        message: `Please, use this url to reset your password otherwise link is expire within 10 mintus - <b>${url}</b>`,
      });
    }
  } catch (error) {
    console.error("_sendNewPasswordInEmail", error);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    console.log(register, "geloololl");
    await validation.register(req);
    // const avatars = gravatar.url(req.body.email, {s: '100', r: 'x', d: 'retro'}, true)

    const check = await Model.User.findOne({
      name: name,
      email: email,
      password: password,
      avatars: avatars
    });
    console.log(check, "hello checlkkkk");
    if (check != null) {
      return res.send({
        status: 0,
        errors: [{
          response: "error",
          param: 'email',
          message: "You are not able to register"
        }]
      });
    }
    const saveData = {
      email: req.body.email,
      avatars: req.body.avatars,
      password: req.body.password,
      name: req.body.name,
      isEmailVerified: true
    };
    const doc = await Model.User.create(saveData);
    doc.accessToken = await Auth.getToken({
      _id: doc._id
    });
    await doc.setPassword(saveData.password);
    await doc.save();
    if (saveData.email) {
      await _sendEmailVerification(doc, saveData.email)
    }
    return res.success(constants.constant.ACCOUNT_CREATED_SUCCESSFULLY, doc);
  } catch (error) {
    next(error);
  }
};
module.exports.login = async (req, res, next) => {
  try {
    await validation.login(req);
    const criteria = [];
    if (req.body.email) {
      criteria.push({
        email: req.body.email
      });
      criteria.push({
        "temp.email": req.body.email
      });
    }
    const doc = await Model.User.findOne({
      $or: criteria,
      isDeleted: false,
    });
    if (!doc) {
      /* throw new Error("INVALID_CREDENTIALS"); */
      return res.status(401).send({
        status: 0,
        errors: [{
          response: "error",
          param: 'email',
          message: "Invalid Email Address"
        }]
      });
    }
    await doc.authenticate(req.body.password);

    if (req.body.email && !doc.isEmailVerified) {
      return res.send({
        status: 0,
        errors: [{
          response: "error",
          param: 'isEmailVerified',
          message: "Account Not Verified"
        }]
      });
    }
    if (doc.isBlocked) {
      return res.send({
        status: 0,
        errors: [{
          response: "error",
          param: 'isBlocked',
          message: "Account Blocked"
        }]
      });
    }

    // doc.loginCount += 1;
    doc.accessToken = await Auth.getToken({
      _id: doc._id
    });
    doc.deviceToken = req.body.deviceToken;
    doc.deviceType = req.body.deviceType;
    await doc.save();
    return res.success(constants.constant.ACCOUNT_LOGIN_SUCCESSFULLY, doc.accessToken);
  } catch (error) {
    next(error);
  }
}; /*{accessToken:doc.accessToken, deviceType:doc.deviceType}*/
module.exports.logout = async (req, res, next) => {
  try {
    await Model.User.updateOne({
      _id: req.user._id
    }, {
      accessToken: ""
    });

    return res.success("ACCOUNT_LOGOUT_SUCCESSFULLY");
  } catch (error) {
    next(error);
  }
};
module.exports.sendNewPasswordInEmail = async (req, res, next) => {
  try {
    await validation.sendNewPasswordInEmail(req.body);
    let doc = null;
    if (req.body.email) {
      doc = await Model.User.findOne({
        email: req.body.email,
        isDeleted: false,
      });
    }
    if (req.body.email && doc != null) {
      await _sendForgotLinkInEmail(doc, req.body.email);
      return res.success("New Password Sent");
    } else {
      // throw new Error("INVALID_CREDENTIALS");
      return res.send({
        status: 0,
        errors: [{
          response: "error",
          param: 'email',
          message: "Invalid Email"
        }]
      });
    }
  } catch (error) {
    next(error);
  }
};
module.exports.checkPasswordResetLink = async (req, res, next) => {
  try {
    const link = await Model.LinkModel.findOne({
      _id: mongoose.Types.ObjectId(req.params.id)
    });
    if (link == null) throw new Error("Password link expired");
    const start = moment(link.createdAt);
    const end = moment();
    if (end.diff(start, 'minutes') > 10)
      throw new Error("Password link expired");
    return res.success(constants.constant.PASSWORD_RESET_LINKED_VERIFIED_SUCCESSFULLY);
  } catch (error) {
    next(error)
  }
}
module.exports.resetPassswordByResetLink = async (req, res, next) => {
  try {
    const admin = await Model.LinkModel.findOne({
      _id: mongoose.Types.ObjectId(req.body.link)
    });
    const adminDetails = await Model.Admin.findOne({
      _id: admin.user
    })
    await adminDetails.setPassword(req.body.newPassword);
    await Model.LinkModel.deleteMany({
      user: admin.user
    });
    await adminDetails.save();
    return res.success(constants.constant.PASSWORD_CHANGED_SUCCESSFULLY);
  } catch (error) {
    next(error)
  }
}
module.exports.changePassword = async (req, res, next) => {
  try {
    await validation.changePassword(req);
    if (req.body.oldPassword === req.body.newPassword) {
      // throw new Error(constants.constant.PASSWORDS_SHOULD_BE_DIFFERENT);
      return res.send({
        status: 0,
        errors: [{
          response: "error",
          param: 'newPassword',
          message: constants.constant.PASSWORDS_SHOULD_BE_DIFFERENT
        }]
      });
    }
    if (req.body.newPassword != req.body.confirmPassword) {
      return res.send({
        status: 0,
        errors: [{
          response: "error",
          param: 'confirmPassword',
          message: constants.constant.PASSWORD_ARE_SAME_AS_CONFIRM_PASSWORD
        }]
      });
    }
    const doc = await Model.User.findOne({
      _id: req.user._id
    });
    // if (!doc) throw new Error(constants.constant.ACCOUNT_NOT_FOUND);
    if (!doc) {
      return res.send({
        status: 0,
        errors: [{
          response: "error",
          param: 'id',
          message: constants.constant.ACCOUNT_NOT_FOUND
        }]
      });
    }

    await doc.authenticate(req.body.oldPassword);
    await doc.setPassword(req.body.newPassword);
    await doc.save();

    return res.success(constants.constant.PASSWORD_CHANGED_SUCCESSFULLY);
  } catch (error) {
    next(error);
  }
};
module.exports.updateProfile = async (req, res, next) => {
  try {
    await validation.updateProfile(req);
    const nin = {
      $nin: [req.user._id]
    };
    if (req.body.email) {
      const checkEmail = await Model.userProfile.findOne({
        _id: nin,
        email: req.body.email,
        isDeleted: false,
      });
      if (checkEmail) {
        return res.send({
          status: 0,
          errors: [{
            response: "error",
            param: 'email',
            message: 'Email Already In Used.'
          }]
        });
      }
    }

    let updated = await Model.userProfile.findOneAndUpdate({
      _id: req.user._id
    }, {
      $set: req.body
    }, {
      new: true
    });
    updated = await Model.userProfile.findOne({
      _id: req.user._id
    }, {
      password: 0,
      secretCode: 0,
      secretExpiry: 0,
      isDeleted: 0,
      isBlocked: 0,
      accessToken: 0
    });
    // await _sendEmailVerification(updated, email);
    return res.success("Profile Updated Successfully.", updated);
  } catch (error) {
    next(error);
  }
};
module.exports.getProfile = async (req, res, next) => {
  try {
    const doc = await Model.userProfile.findOne({
      _id: req.user._id
    }, {
      password: 0,
      role: 0,
      secretCode: 0,
      secretExpiry: 0,
      accessToken: 0,
      isDeleted: 0,
      isBlocked: 0,
    });
    return res.success("Profile Data Fetch Successfully.", doc);
  } catch (error) {
    next(error);
  }
};
module.exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw new Error("UPLOADING_ERROR");

    const filePath = "/" + req.file.path.replace(/\/?public\/?/g, "");

    return res.success("FILE_UPLOADED", { filePath });
  } catch (error) {
    next(error);
  }
}

module.exports.allMedicine = async function(req,res, next){
  let id = req.user._id;
  let take = 10;
  let page = req.query.page;
  const skip = ((page - 1) * take);
  const limit = 10;
  try{
    const [medication, countResult] = await Promise.all([
      Medicine.find({id}).skip(skip).limit(limit),
      Medicine.countDocuments({id})
    ]);
    if(!medication){
      //await req.flash('info', 'Flash is back!');
      return res.json({
          data: 'No record has been found'
      })
    }
    //await req.flash('info', 'Flash is successful!');
    res.json({
      data: medication,
      meta: {countResult,page,last_page: Math.ceil(countResult / take)}
    })
  }catch(error){
    console.warn({error:error})
  }
};

module.exports.addMedicine = async function(req,res){
  let id = req.user._id;
  const data = req.body;
  const medicine = new Medicine({
    id: id,
    name: data.name,
    dosage: data.dosage,
    frequency: data.frequency,
    notification: data.notification,
    timeZone: data.timeZone,
    time: moment(req.body.birthDateISO8601, 'YYYY-MM-DD hh:mma')
  })
  const result = await medicine.save()
  const me = await result.toJSON()
  res.json({me, msg: 'success'})
};

const modalAddMedicine = async function(req,res){
    let id = req.user._id;
    console.log(`I am logging data: ${id}`);
    const data = req.body;
    const medicine = new Medicine({
        id: id,
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        notification: data.notification,
        timeZone: data.timeZone,
        time: data.notifyTime
    })
    const result = await medicine.save()
    /*if(result){
        await req.flash('info','successfully saved');
    }*/
    const me = await result.toJSON()
    res.json({me, msg: 'success'})
}

const findMedicine = async (req,res)=>{
  const {id: medsId} = req.params;
    const meds = await Medicine.findById({_id:medsId});
      if (!meds) {
        return res.json({msg: 'failed'})
      }
    res.json({msg: "success",meds})
};

// module.exports.updateMedicine = function (req, res, next){
//   try {
//     let {id: medsId} = req.params;
//     let data = req.body;
//       let inventory = {
//         _id: data._id,
//         id: data.id,
//         name: data.name,
//         dosage: data.dosage,
//         frequency: data.frequency,
//         notification: data.notification,
//         timeZone: data.timeZone,
//         time: data.time
//       };
//       Medicine.findByIdAndUpdate({ _id: medsId},{new:true});
//       if (inventory == null) {
//         res.status(500).send(err);
//         return res.json({msg: 'failed'})
//       } else {
//         res.json({msg: "success",meds})
//       }
//   } catch (error) {
//     next(error)
//   }
 
// };

const deleteMedicine = async (req, res)=>{
  const {id: medsID} = req.params
  const meds = await Medicine.findOneAndDelete({ _id: medsID })
    if (!meds) {
      return res.json({msg: 'failed'})
    }
    res.json({msg: "success",meds})
};

// module.exports.uploadFile = async (req, res, next) => {
//   try {
//     if (!req.file) throw new Error("UPLOADING_ERROR");
//     const filePath = req.file;
//     const image = filePath.location;

//     return res.success("IMAGE_UPLOADED", {
//       image
//     });
//   } catch (error) {
//     next(error);
//   }
// };
/* CATEGORIES AND SUBCATEGORIES APIS */
// module.exports.addCategories = async (req, res, next) => {
//   try {
//     await validation.addCategories(req);
//     req.body.adminId = req.user._id;
//     const checkCategory = await Model.CategoriesSchema.findOne({
//       name: req.body.name
//     })
//     if (checkCategory != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: 'name',
//           message: 'Category is already exist with this name.'
//         }]
//       });
//     }
//     const doc = await Model.CategoriesSchema.create(req.body);
//     await doc.save();
//     return res.success("Categories created Successfully", doc);
//   } catch (error) {
//     next(error);
//   }
// }
// module.exports.getCategories = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     let search = req.query.search;
//     let startDate = req.query.startDate || null;
//     let endDate = req.query.endDate || null;
//     const criteria = {
//       parentCategoryId: {
//         $in: [null]
//       },
//       isDeleted: false
//     }
//     if (search != "" && search != null) {
//       criteria.name = {
//         $regex: search,
//         $options: "i"
//       }
//     }
//     if (startDate != null && startDate != "" && endDate != null && endDate != "") {
//       criteria.createdAt = {
//         $gte: new Date(moment(startDate).startOf('days')),
//         $lte: new Date(moment(endDate).endOf('days'))
//       }
//     }
//     let categoryData = await Model.CategoriesSchema.find(criteria, {
//         isActive: 0
//       })
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       });
//     let count = await Model.CategoriesSchema.countDocuments(criteria);

//     return res.success("Categories Fetch Successfully", {
//       categoryData,
//       count
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getCategoriesById = async (req, res, next) => {
//   try {
//     await validation.getCategoriesById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.categoryId)
//     }
//     let categoriesData = await Model.CategoriesSchema.findOne(criteria)
//     if (categoriesData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: 'categoryId',
//           message: "Invalid category id."
//         }]
//       });
//     }
//     return res.success("Categories Fetch Successfully", categoriesData);
//   } catch (error) {

//     next(error);
//   }
// }
// module.exports.updateCategoryById = async (req, res, next) => {
//   try {
//     await validation.updateCategoryById(req);
//     if (req.body.name != null && req.body.name != "") {
//       let dataCheck = await Model.CategoriesSchema.findOne({
//         _id: {
//           $in: [mongoose.Types.ObjectId(req.body.categoryId)]
//         },
//         name: req.body.name,
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: 'name',
//             message: "Category is already exist with this name."
//           }]
//         });
//       }

//     }
//     const updated = await Model.CategoriesSchema.findOneAndUpdate({
//       _id: mongoose.Types.ObjectId(req.body.categoryId)
//     }, {
//       $set: req.body
//     }, {
//       new: true
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: 'categoryId',
//           message: "Invalid Category Id for update."
//         }]
//       });
//     }
//     return res.success("Category Updated Successfully", updated);
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getSubCategories = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     let search = req.query.search;
//     let startDate = req.query.startDate || null;
//     let endDate = req.query.endDate || null;
//     const criteria = {
//       parentCategoryId: {
//         $nin: [null]
//       },
//       isDeleted: false
//     }
//     const pipeline = [{
//       $match: criteria
//     }, {
//       $lookup: {
//         from: "categories",
//         localField: "parentCategoryId",
//         foreignField: "_id",
//         as: "parentCategoryId"
//       }
//     }, {
//       $unwind: {
//         path: "$parentCategoryId"
//       }
//     }]
//     if (search != "" && search != null) {
//       pipeline.push({
//         $match: {
//           $or: [{
//             name: {
//               $regex: search,
//               $options: "i"
//             }
//           }, {
//             "parentCategoryId.name": {
//               $regex: search,
//               $options: "i"
//             }
//           }]
//         }
//       })
//     }
//     pipeline.push({
//       $project: {
//         _id: 1
//       }
//     });
//     if (startDate != null && startDate != "" && endDate != null && endDate != "") {
//       criteria.createdAt = {
//         $gte: new Date(moment(startDate).startOf('days')),
//         $lte: new Date(moment(endDate).endOf('days'))
//       }
//     }
//     let count = await Model.CategoriesSchema.aggregate(pipeline);
//     count = count.length;
//     pipeline.pop({
//       $project: {
//         _id: 1
//       }
//     })
//     pipeline.push({
//       $limit: limit
//     }, {
//       $skip: page * limit
//     });
//     let categoryData = await Model.CategoriesSchema.aggregate(pipeline);
//     return res.success("SubCategory Data Fetch Successfully", {
//       categoryData,
//       count
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.updateSubCategoryById = async (req, res, next) => {
//   try {
//     await validation.updateSubCategoryById(req);
//     if (req.body.name != null && req.body.name != "") {
//       let dataCheck = await Model.CategoriesSchema.findOne({
//         _id: {
//           $in: [mongoose.Types.ObjectId(req.body.categoryId)]
//         },
//         name: req.body.name,
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: 'name',
//             message: "Category is already exist with this name."
//           }]
//         });
//       }

//     }
//     const updated = await Model.CategoriesSchema.findOneAndUpdate({
//       _id: mongoose.Types.ObjectId(req.body.categoryId)
//     }, {
//       $set: req.body
//     }, {
//       new: true
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: 'categoryId',
//           message: "Invalid Category Id for update."
//         }]
//       });
//     }
//     return res.success("SubCategory Updated Successfully", updated);
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getSubCategoriesByCategoryId = async (req, res, next) => {
//   try {
//     await validation.getSubCategoriesByCategoryId(req);
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     const criteria = {
//       parentCategoryId: {
//         $in: [mongoose.Types.ObjectId(req.query.categoryId)]
//       },
//       isDeleted: false
//     }
//     const pipeline = [{
//       $match: criteria
//     }, {
//       $lookup: {
//         from: "categories",
//         localField: "parentCategoryId",
//         foreignField: "_id",
//         as: "parentCategoryId"
//       }
//     }, {
//       $unwind: {
//         path: "$parentCategoryId"
//       }
//     }]
//     pipeline.push({
//       $project: {
//         _id: 1
//       }
//     });
//     let count = await Model.CategoriesSchema.aggregate(pipeline);
//     count = count.length;
//     pipeline.pop({
//       $project: {
//         _id: 1
//       }
//     })
//     pipeline.push({
//       $limit: limit
//     }, {
//       $skip: page * limit
//     });
//     let categoryData = await Model.CategoriesSchema.aggregate(pipeline);

//     return res.success("SubCategory Data Fetch Successfully", {
//       categoryData,
//       count
//     });

//   } catch (error) {
//     next(error);
//   }
// }; 
// /* TRENDS TAG APIS */
// module.exports.addTrendsTag = async (req, res, next) => {
//   try {
//     await validation.addTrendsTag(req);
//     console.log(req.body, "req.bodyyy")
//     req.body.adminId = req.user._id;
//     const checkTrends = await Model.TrendsTagModel.findOne({
//       categoryId: mongoose.Types.ObjectId(req.body.categoryId),
//       subCategoryId: mongoose.Types.ObjectId(req.body.subCategoryId),
//       isDeleted: false
//     })
//     if (checkTrends != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "trendTagName",
//           message: "Trends Tags Name  with this category and subcategory is already added."
//         }]
//       });
//     }
//     const doc = await Model.TrendsTagModel.create(req.body);
//     await doc.save();
//     return res.success("Trends Tag Created Successfully", doc);

//   } catch (error) {
//     next(error);
//   }
// }
// module.exports.getTrendsTag = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     const criteria = {
//       isDeleted: false
//     }
//     // if (search != "" && search != null) {
//     //   criteria.trendTagName = {
//     //     $in: [{
//     //       $regex: search,
//     //       $options: "i"
//     //     }]
//     //   }
//     // }
//     let count = await Model.TrendsTagModel.countDocuments(criteria);
//     let trendsTypeData = await Model.TrendsTagModel.find(criteria)
//       .populate('categoryId', 'name _id')
//       .populate('subCategoryId', 'name _id')
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       })
//     // if (search != "" && search != null && trendsTypeData.length > 0) {
//     //   await Model.TrendsTagModel.updateMany(criteria, {
//     //     $inc: {
//     //       searchCount: 1
//     //     }
//     //   })
//     // }
//     return res.success("Trends Tag all data Fetch Successfully", {
//       trendsTypeData,
//       count
//     });

//   } catch (error) {

//     next(error);
//   }
// }
// module.exports.getTrendsTagById = async (req, res, next) => {
//   try {
//     await validation.getTrendsTagById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.tagId)
//     }
//     let trendsTypeData = await Model.TrendsTagModel.findOne(criteria).populate('categoryId', 'name _id').populate('subCategoryId', 'name _id');
//     if (trendsTypeData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "tagId",
//           message: "Invalid tag id."
//         }]
//       });
//     }
//     return res.success("Trends Tag Data Fetch Successfully", trendsTypeData);

//   } catch (error) {

//     next(error);
//   }
// }
// module.exports.getTrendsTagByCategoryAndSubCategory = async (req, res, next) => {
//   try {
//     await validation.getTrendsTagByCategoryAndSubCategory(req);
//     const criteria = {
//       categoryId: mongoose.Types.ObjectId(req.query.categoryId),
//       subCategoryId: mongoose.Types.ObjectId(req.query.subCategoryId),
//       isDeleted: false
//     }
//     let trendsTypeData = await Model.TrendsTagModel.findOne(criteria).populate('categoryId', 'name _id').populate('subCategoryId', 'name _id');
//     if (trendsTypeData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "tagId",
//           message: "Invalid tag id."
//         }]
//       });
//     }
//     return res.success("Successfully Fetch Trend Tag Data with Category and Subcategory", trendsTypeData);
//   } catch (error) {

//     next(error);
//   }
// }
// module.exports.updateTrendsTagById = async (req, res, next) => {
//   try {
//     await validation.updateTrendsTagById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.body.tagId)
//     }
//     if (req.body.trendTagName != null && req.body.trendTagName != "") {
//       let dataCheck = await Model.TrendsTagModel.findOne({
//         _id: {
//           $nin: [mongoose.Types.ObjectId(req.body.trendTypeId)]
//         },
//         trendTagName: {
//           $in: [req.body.trendTagName]
//         },
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: "trendTagName",
//             message: "Trend Tag is already exist with this name."
//           }]
//         });
//       }

//     }
//     let trendsTypeData = await Model.TrendsTagModel.findOneAndUpdate(criteria, {
//       $set: req.body
//     }, {
//       new: true
//     }).populate('categoryId', 'name _id').populate('subCategoryId', 'name _id');
//     if (trendsTypeData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "tagId",
//           message: "Invalid tag id for update."
//         }]
//       });
//     }
//     return res.success("Trend Tag Updated Successfully", trendsTypeData);

//   } catch (error) {

//     next(error);
//   }
// }
// /* TRENDS TYPE APIS */
// module.exports.addTrendsType = async (req, res, next) => {
//   try {
//     await validation.addTrendsType(req);
//     req.body.adminId = req.user._id;
//     const checkTrendsType = await Model.TrendsTypeModel.findOne({
//       trendTypeName: req.body.trendTypeName
//     })
//     if (checkTrendsType != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "trendTypeName",
//           message: "Trend Type Name is already exist."
//         }]
//       });
//     }
//     const doc = await Model.TrendsTypeModel.create(req.body);
//     await doc.save();
//     return res.success("TrendType Created Successfully", doc);
//   } catch (error) {
//     next(error);
//   }
// }
// module.exports.getTrendsType = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     let search = req.query.search;
//     const criteria = {
//       isDeleted: false
//     }
//     if (search != "" && search != null) {
//       criteria.trendTypeName = {
//         $regex: search,
//         $options: "i"
//       }
//     }
//     let count = await Model.TrendsTypeModel.countDocuments(criteria);
//     let trendsTypeData = await Model.TrendsTypeModel.find(criteria)
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       });
//     return res.success("Successfully", {
//       trendsTypeData,
//       count
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getTrendsTypeById = async (req, res, next) => {
//   try {
//     await validation.getTrendsTypeById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.trendsTypeId)
//     }
//     let trendsTypeData = await Model.TrendsTypeModel.findOne(criteria)
//     if (trendsTypeData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "tagTypeId",
//           message: "Invalid tag type id."
//         }]
//       });
//     }
//     return res.success("Trend Type Data Fetch Successfully", trendsTypeData);
//   } catch (error) {

//     next(error);
//   }
// }
// module.exports.updateTrendsTypeById = async (req, res, next) => {
//   try {
//     await validation.updateTrendsTypeById(req);
//     if (req.body.trendTypeName != null && req.body.trendTypeName != "") {
//       let dataCheck = await Model.TrendsTypeModel.findOne({
//         _id: {
//           $nin: [mongoose.Types.ObjectId(req.body.trendTypeId)]
//         },
//         trendTypeName: req.body.trendTypeName,
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: "trendTypeName",
//             message: "Trend Type is already exist with this name."
//           }]
//         });
//       }

//     }
//     const updated = await Model.TrendsTypeModel.findOneAndUpdate({
//       _id: mongoose.Types.ObjectId(req.body.trendTypeId)
//     }, {
//       $set: req.body
//     }, {
//       new: true
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "trendTypeId",
//           message: "Invalid tag type id for update."
//         }]
//       });
//     }
//     return res.success("Trend Type Updated Successfully", updated);
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.removeTrendsType = async (req, res, next) => {
//   try {
//     await validation.removeTrendsType(req);
//     const updated = await Model.TrendsTypeModel.updateMany({
//       _id: {
//         $in: req.body.trendsTypeIds
//       }
//     }, {
//       $set: {
//         isDeleted: true
//       }
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "trendsTypeIds",
//           message: "Invalid trend type ids for delete."
//         }]
//       });
//     }
//     return res.success("Trend Type Deleted Successfully", {});

//   } catch (error) {
//     next(error);
//   }
// };
// /* GEOGRAPHY MANAGEMENT APIS */
// module.exports.addCountryForTrends = async (req, res, next) => {
//   try {
//     await validation.addCountryForTrends(req);
//     let dataObject = {
//       name: req.body.name,
//       options: req.body.options
//     }
//     const countryData = await GeographyModel.findOneAndUpdate({
//         _id: req.params.adminId
//       },
//       dataObject, {
//         upsert: true,
//         new: true
//       }
//     );
//     return res.success("Country Name Created Successfully", countryData);

//   } catch (error) {
//     next(error);
//   }
// }
// module.exports.getCountryForTrends = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     const criteria = {
//       isDeleted: false
//     }
//     let count = await Model.GeographyModel.countDocuments(criteria);
//     let trendsTypeData = await Model.GeographyModel.find(criteria)
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       })
//     return res.success("Data Fetch  Successfully", {
//       trendsTypeData,
//       count
//     });

//   } catch (error) {
//     next(error);
//   }
// }
// /* COMPASS MATRIC FOR TREND APIS */
// module.exports.addCompassMatricForTrends = async (req, res, next) => {
//   try {
//     await validation.addCompassMatricForTrends(req);
//     req.body.adminId = req.user._id;
//     let dataObject = {
//       name: req.body.name,
//       options: req.body.options
//     }
//     const compassData = await CompassMatricModel.findOneAndUpdate({
//         _id: req.params.adminId
//       },
//       dataObject, {
//         upsert: true,
//         new: true
//       }
//     );
//     return res.success("Compass Matric Created Successfully", compassData);

//   } catch (error) {
//     next(error);
//   }
// }
// module.exports.getCompassMetricForTrends = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     const criteria = {
//       isDeleted: false
//     }
//     let count = await Model.CompassMetricModel.countDocuments(criteria);
//     let CompassData = await Model.CompassMetricModel.find(criteria)
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       })
//     return res.success("Compass Metric Data Fetch  Successfully", {
//       CompassData,
//       count
//     });

//   } catch (error) {

//     next(error);
//   }
// }
// /* TRENDS APIS */
// module.exports.addTrend = async (req, res, next) => {
//   try {
//     await validation.addTrend(req);
//     const adminId = req.user._id;
//     const checkName = await Model.TrendsSchema.findOne({
//       title: req.body.title,
//       isDeleted: false
//     });
//     if (checkName != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "title",
//           message: "Please channge your title of trend."
//         }]
//       });
//     }
//     const doc = await Model.TrendsSchema(req.body).save();
//     if (doc != null) {
//       return res.success("TrendType Created Successfully", doc);
//     } else {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "",
//           message: "Unable to Add"
//         }]
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.updateTrendById = async (req, res, next) => {
//   try {
//     await validation.updateTrendById(req);
//     if (req.body.title != null && req.body.title != "") {
//       let dataCheck = await Model.TrendsSchema.findOne({
//         _id: {
//           $nin: [mongoose.Types.ObjectId(req.body.trendId)]
//         },
//         title: req.body.title,
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: "title",
//             message: "Trend is already exist with this name."
//           }]
//         });
//       }
//     }
//     if (req.body.trendStatus == 0) {
//       req.body.publishDate = new Date();
//     }
//     const updated = await Model.TrendsSchema.findOneAndUpdate({
//       _id: mongoose.Types.ObjectId(req.body.trendId)
//     }, {
//       $set: req.body
//     }, {
//       new: true
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "trendId",
//           message: "Invalid tag type id for update."
//         }]
//       });
//     }
//     return res.success("Trend Updated Successfully", updated);

//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getTrendById = async (req, res, next) => {
//   try {
//     await validation.getTrendById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.trendId)
//     }
//     let trendData = await Model.TrendsSchema.findOne(criteria, {
//         viewCount: 1,
//         title: 1,
//         publishDate: 1,
//         trendStatus: 1

//       }
//       /* , {
//             $inc: {
//               viewCount: 1
//             }
//           } */
//     ).populate("trendsTagId", 'trendTagName').populate("cultureWarriorsId", 'userName')
//     if (trendData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "trendId",
//           message: "Invalid trend id."
//         }]
//       });
//     }
//     if (req.body.trendStatus == 0) {
//       req.body.publishDate = new Date();
//     }
//     return res.success("Successfully", trendData);

//   } catch (error) {
//     next(error);
//   }
// }
// module.exports.getTrendList = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     // const categoryId = req.query.categoryId;
//     const criteria = {
//       isDeleted: false
//     }
//     let count = await Model.TrendsSchema.countDocuments(criteria);

//     let trendData = await Model.TrendsSchema.find(criteria, {
//         viewCount: 1,
//         title: 1,
//         publishDate: 1,
//         trendStatus: 1

//       })
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       })
//       .populate("trendsTagId", 'trendTagName')
//       .populate("cultureWarriorsId", 'userName')
//       .populate("categoryId", 'name')


//     return res.success("Successfully", {
//       trendData,
//       count
//     });

//   } catch (error) {
//     next(error);
//   }
// };
// /* CULTURE wARRIOR APIS MANAGEMENT BY user */
// module.exports.addCultureWarrior = async (req, res, next) => {
//   try {
//     await validation.addCultureWarrior(req);
//     const adminId = req.user._id;
//     const checkWire = await Model.Admin.findOne({
//       userName: req.body.userName,
//       isDeleted: false
//     })
//     if (checkWire != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "userName",
//           message: "This user name  already exist"
//         }]
//       });
//     }

//     const doc = await Model.Admin.create(req.body);
//     await doc.setPassword(req.body.password);
//     await doc.save();
//     return res.success("Culture Warrior Created Successfully.", doc);

//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.updateCultureWarriorById = async (req, res, next) => {

//   try {
//     await validation.updateCultureWarriorById(req);
//     const categoryId = req.body.categoryId;
//     const subCategoryId = req.body.subCategoryId;
//     const trendsTagId = req.body.trendsTagId;
//     const trendstypeId = req.body.trendstypeId;

//     if (req.body.userName != null && req.body.userName != "") {
//       let dataCheck = await Model.Admin.findOne({
//         _id: {
//           $nin: [mongoose.Types.ObjectId(req.body.cultureWireId)]
//         },
//         userName: req.body.userName,
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: "userName",
//             message: "Culture Warrior is already exist with this name."
//           }]
//         });
//       }

//     }
//     if (req.body.trendStatus == 0) {
//       req.body.publishDate = new Date();
//     }
//     const updated = await Model.Admin.findOneAndUpdate({
//       _id: mongoose.Types.ObjectId(req.body.cultureWireId)
//     }, {
//       $set: req.body

//     }, {
//       new: true
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "cultureWireId",
//           message: "Invalid CultureWire Id for update."
//         }]
//       });
//     }
//     return res.success("Culture Warrior Updated Successfully.", updated);

//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.regenerateCultureWarriorPasswordById = async (req, res, next) => {
//   try {
//     await validation.regenerateCultureWarriorPasswordById(req);
//     const password = req.body.password;
//     let dataCheck = await Model.Admin.findOne({
//       _id: mongoose.Types.ObjectId(req.body.cultureWireId),
//       role: constants.ROLE.ADMIN,
//       isDeleted: false
//     })
//     if (dataCheck == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "cultureWireId",
//           message: "Culture Warrior Id is invalid."
//         }]
//       });
//     }
//     if (password == null || password == "") {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "password",
//           message: "Password is required."
//         }]
//       });
//     } else if (password != null && password != "") {
//       await dataCheck.setPassword(password);
//       await dataCheck.save();
//       process.emit("sendEmail", {
//         to: dataCheck.email,
//         title: "Account New Password",
//         message: `Your password will be changed by admin, PLease use this password for login - <b>${password}</b>`,
//       });
//     }
//     return res.success("Culture Warrior Password Genrated Successfully.", {});
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getCultureWarriorById = async (req, res, next) => {
//   try {
//     await validation.getCultureWarriorById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.cultureWireId),
//       isDeleted: false
//     }
//     let warriorData = await Model.Admin.aggregate([{
//       $match: criteria
//     }, {
//       $lookup: {
//         from: "trends",
//         let: {
//           id: "$_id"
//         },
//         pipeline: [{
//             $match: {
//               $expr: {
//                 $eq: ["$cultureWarriorsId", "$$id"]
//               }
//             }
//           },
//           {
//             $group: {
//               _id: "$cultureWarriorsId",
//               count: {
//                 $sum: 1
//               }

//             }
//           }, {
//             $project: {
//               count: 1
//             }
//           }
//         ],
//         as: "trends"
//       }
//     }, {
//       $project: {
//         _id: 1,
//         email: 1,
//         displayName: 1,
//         firstName: 1,
//         lastName: 1,
//         userName: 1,
//         profileDescription: 1,
//         image: 1,
//         latitude: 1,
//         longitude: 1,
//         address: 1,
//         isDeleted: 1,
//         isActive: 1,
//         createdAt: 1,
//         updatedAt: 1,
//         permission: 1,
//         contactNumber: 1,
//         postCount: {
//           $cond: {
//             if: {
//               $eq: ['$trends', []]
//             },
//             then: 0,
//             else: {
//               "$arrayElemAt": ['$trends.count', 0]
//             },
//           }
//         }
//       }
//     }])
//     if (warriorData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "cultureWireId",
//           message: "Invalid CultureWire id."
//         }]
//       });
//     }
//     return res.success("Fetch Culture Warrior Successfully.", warriorData);

//   } catch (error) {

//     next(error);
//   }
// };
// module.exports.getCultureWarrior = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     let search = req.query.search;
//     const criteria = {
//       isDeleted: false,
//       role: constants.ROLE.ADMIN
//     }
//     if (search != "" && search != null) {
//       criteria.$or = [{
//         userName: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         email: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         firstName: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         isActive: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         displayName: {
//           $regex: search,
//           $options: "i"
//         }
//       }]
//     }
//     let count = await Model.Admin.countDocuments(criteria);
//     let warriorData = await Model.Admin.aggregate([{
//       $match: criteria
//     }, {
//       $lookup: {
//         from: "trends",
//         let: {
//           id: "$_id"
//         },
//         pipeline: [{
//             $match: {
//               $expr: {
//                 $eq: ["$cultureWarriorsId", "$$id"]
//               }
//             }
//           },
//           {
//             $group: {
//               _id: "$cultureWarriorsId",
//               count: {
//                 $sum: 1
//               }

//             }
//           }, {
//             $project: {
//               count: 1
//             }
//           }
//         ],
//         as: "trends"
//       }
//     }, {
//       $project: {
//         _id: 1,
//         email: 1,
//         displayName: 1,
//         firstName: 1,
//         lastName: 1,
//         userName: 1,
//         profileDescription: 1,
//         image: 1,
//         latitude: 1,
//         longitude: 1,
//         address: 1,
//         isDeleted: 1,
//         isActive: 1,
//         createdAt: 1,
//         updatedAt: 1,
//         permission: 1,
//         contactNumber: 1,
//         postCount: {
//           $cond: {
//             if: {
//               $eq: ['$trends', []]
//             },
//             then: 0,
//             else: {
//               "$arrayElemAt": ['$trends.count', 0]
//             },
//           }
//         }
//       }
//     }, {
//       $limit: limit
//     }, {
//       $skip: page * limit
//     }, {
//       $sort: {
//         createdAt: -1
//       }
//     }])
//     return res.success("Fetch Culture Warrior Successfully.", {
//       warriorData,
//       count
//     });

//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.removeCultureWarrior = async (req, res, next) => {
//   try {
//     await validation.removeCultureWarrior(req);
//     const updated = await Model.Admin.updateMany({
//       _id: {
//         $in: req.body.cultureWarriorIds
//       }
//     }, {
//       $set: {
//         isDeleted: true
//       }
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "cultureWarriorIds",
//           message: "Invalid culture warrior ids for delete."
//         }]
//       });
//     }
//     return res.success("Culture Warrior Successfully Deleted.", {});
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getLeaderBoardList = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     const leaderBoardType = req.query.leaderBoardType || 1;
//     let search = req.query.search;
//     let startDate = req.query.startDate || null;
//     let endDate = req.query.endDate || null;
//     const criteria = {
//       isDeleted: false,
//       role: constants.ROLE.ADMIN
//     }
//     if (search != null && search != "") {
//       criteria.$or = [{
//         userName: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         fullName: {
//           $regex: search,
//           $options: "i"
//         }
//       }]
//     }
//     if (startDate != null && startDate != "" && endDate != null && endDate != "") {
//       criteria.createdAt = {
//         $gte: new Date(moment(startDate).startOf('days')),
//         $lte: new Date(moment(endDate).endOf('days'))
//       }
//     }
//     let count = await Model.Admin.countDocuments(criteria);
//     if (leaderBoardType == 1) {
//       let premiumWarriorData = await Model.Admin.aggregate([{
//         $match: criteria
//       }, {
//         $lookup: {
//           from: "trends",
//           let: {
//             id: "$_id"
//           },
//           pipeline: [{
//               $match: {
//                 $expr: {
//                   $eq: ["$cultureWarriorsId", "$$id"]
//                 }
//               }
//             },
//             {
//               $group: {
//                 _id: "$cultureWarriorsId",
//                 count: {
//                   $sum: 1
//                 }

//               }
//             }, {
//               $project: {
//                 count: 1
//               }
//             }
//           ],
//           as: "trends"
//         }
//       }, {
//         $project: {
//           _id: 1,
//           displayName: 1,
//           firstName: 1,
//           lastName: 1,
//           userName: 1,
//           isDeleted: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           postCount: {
//             $cond: {
//               if: {
//                 $eq: ['$trends', []]
//               },
//               then: 0,
//               else: {
//                 "$arrayElemAt": ['$trends.count', 0]
//               },
//             }
//           }
//         }
//       }, {
//         $limit: limit
//       }, {
//         $skip: page * limit
//       }, {
//         $sort: {
//           createdAt: -1
//         }
//       }])
//       return res.success("Fetch Culture Warrior Successfully", {
//         premiumWarriorData,
//         count
//       });
//     } else if (leaderBoardType == 2) {
//       let starWarriorData = await Model.Admin.aggregate([{
//         $match: criteria
//       }, {
//         $lookup: {
//           from: "LikedTrends",
//           let: {
//             id: "$_id"
//           },
//           pipeline: [{
//               $match: {
//                 $expr: {
//                   $eq: ["$cultureWarriorsId", "$$id"]
//                 }
//               }
//             },
//             {
//               $group: {
//                 _id: "$cultureWarriorsId",
//                 count: {
//                   $sum: 1
//                 }

//               }
//             }, {
//               $project: {
//                 count: 1
//               }
//             }
//           ],
//           as: "LikedTrends"
//         }
//       }, {
//         $project: {
//           _id: 1,
//           email: 1,
//           fullName: 1,
//           userName: 1,
//           firstName: 1,
//           lastName: 1,
//           isEmailVerified: 1,
//           isDeleted: 1,
//           isLikeded: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           permission: 1,
//           like: {
//             $cond: {
//               if: {
//                 $eq: ['$LikedTrends', []]
//               },
//               then: 0,
//               else: {
//                 "$arrayElemAt": ['$LikedTrends.count', 0]
//               },
//             }
//           }
//         }
//       }, {
//         $limit: limit
//       }, {
//         $skip: page * limit
//       }, {
//         $sort: {
//           createdAt: -1
//         }
//       }])
//       return res.success("Fetch Culture Warrior Successfully", {
//         starWarriorData,
//         count
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.leaderBoardRewardMessage = async (req, res, next) => {
//   try {
//     await validation.leaderBoardRewardMessage(req);
//     const email = req.body.email;
//     const message = req.body.message;
//     let dataCheck = await Model.Admin.findOne({
//       _id: mongoose.Types.ObjectId(req.body.cultureWireId),
//       role: constants.ROLE.ADMIN,
//       isDeleted: false
//     })
//     if (dataCheck == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "cultureWireId",
//           message: "Culture Warrior Id is invalid."
//         }]
//       });
//     }
//     if (email == null || email == "") {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "email",
//           message: "email is required."
//         }]
//       });
//     } else if (message == null || message == "") {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "message",
//           message: "message is required."
//         }]
//       });
//     } else if (email != null && email != "" && message != null || message != "") {
//       await Model.RewardMessageModel({
//         adminId: req.user._id,
//         cultureWireId: dataCheck._id,
//         message: message
//       }).save();
//       process.emit("sendEmail", {
//         to: email,
//         title: "Reward Message",
//         message: message,
//       });
//     }
//     return res.success("Reply Send Successfully.", {});
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.powerTransferToCultureWarrior = async (req, res, next) => {
//   try {
//     await validation.powerTransferToCultureWarrior(req);
//     const isMigrate = req.query.isMigrate;
//     console.log(req.query)
//     let dataCheck = await Model.Admin.findOne({
//       _id: mongoose.Types.ObjectId(req.query.cultureWireId),
//       role: constants.ROLE.ADMIN
//     })
//     if (dataCheck == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "cultureWireId",
//           message: "Invalid cultureWireId for delete."
//         }]
//       });
//     }
//     if (isMigrate == true || isMigrate == 'true') {
//       await Model.Admin.findOneAndUpdate({
//         _id: mongoose.Types.ObjectId(req.query.cultureWireId),
//         role: constants.ROLE.ADMIN
//       }, {
//         $set: {
//           isDeleted: true
//         }
//       }, {
//         new: true
//       });
//     } else {
//       await Model.Admin.deleteOne({
//         _id: mongoose.Types.ObjectId(req.query.cultureWireId)
//       });
//     }
//     return res.success("Successfully Deleted.", {});
//   } catch (error) {
//     next(error);
//   }
// };
// /* EVENT APIS */
// module.exports.addEvent = async (req, res, next) => {
//   try {
//     await validation.addEvent(req);
//     let location = {}
//     let coordinates = []
//     if (req.body.latitude && req.body.longitude) {
//       coordinates.push(Number(req.body.longitude))
//       coordinates.push(Number(req.body.latitude))
//       location.type = "Point";
//       location.coordinates = coordinates
//       req.body.location = location;
//     }
//     const checkWire = await Model.EventSchema.findOne({
//       eventTitle: req.body.eventTitle,
//       isDeleted: false
//     })
//     if (checkWire != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "eventTitle",
//           message: "This Event already exist."
//         }]
//       });
//     }
//     const doc = await Model.EventSchema.create(req.body);
//     await doc.save();
//     return res.success("Event Created Successfully", doc);
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.updateEventById = async (req, res, next) => {
//   try {
//     await validation.updateEventById(req);
//     if (req.body.eventTitle != null && req.body.eventTitle != "") {
//       let dataCheck = await Model.EventSchema.findOne({
//         _id: {
//           $nin: [mongoose.Types.ObjectId(req.body.eventId)]
//         },
//         eventTitle: req.body.eventTitle,
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: "eventTitle",
//             message: "Event is already exist with this name."
//           }]
//         });
//       }
//     }
//     let location = {}
//     let coordinates = []
//     if (req.body.latitude && req.body.longitude) {
//       coordinates.push(Number(req.body.longitude))
//       coordinates.push(Number(req.body.latitude))
//       location.type = "Point";
//       location.coordinates = coordinates
//       req.body.location = location;
//     }
//     let updated = await Model.EventSchema.findOneAndUpdate({
//       _id: mongoose.Types.ObjectId(req.body.eventId)
//     }, {
//       $set: req.body
//     }, {
//       new: true
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "eventId",
//           message: "Invalid Event Id for Update."
//         }]
//       });
//     }
//     // console.log(updated, "data aa ja aaaaaaaaaa")
//     // updated = await Model.EventSchema.findOne({
//     //   _id: mongoose.Types.ObjectId(req.body.eventId)
//     // }, {
//     //   cultureWarriorsId: 0,
//     //   trendstypeId: 0,
//     //   adminId: 0,
//     //   label: 0,
//     //   slug: 0,
//     //   images: 0,
//     //   contentDiscription: 0,
//     //   shortDiscription: 0
//     // });
//     return res.success("Event Updated Successfully", updated);
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getEventList = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     let search = req.query.search;
//     const criteria = {
//       isDeleted: false
//     }
//     if (search != "" && search != null) {
//       criteria.eventTitle = {
//         $regex: search,
//         $options: "i"
//       }
//     }
//     let count = await Model.EventSchema.countDocuments(criteria);
//     let postData = await Model.EventSchema.find(criteria, {
//         cultureWarriorsId: 0,
//         trendstypeId: 0,
//         adminId: 0,
//         label: 0,
//         slug: 0,
//         images: 0,
//         contentDiscription: 0,
//         shortDiscription: 0
//       })
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       })
//     return res.success("Fetch Event Data Successfully", {
//       postData,
//       count
//     });

//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getEventListById = async (req, res, next) => {
//   try {
//     await validation.getEventListById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.eventId)
//     }
//     let eventData = await Model.EventSchema.findOne(criteria)
//     if (eventData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "eventId",
//           message: "Invalid event id."
//         }]
//       });
//     }
//     return res.success("Fetch Event Data Successfully.", eventData);

//   } catch (error) {

//     next(error);
//   }
// };
// /* PRICE APIS */
// module.exports.addPrice = async (req, res, next) => {
//   try {
//     await validation.addPrice(req);
//     const adminId = req.user._id;
//     const checkWire = await Model.PriceSchema.findOne({
//       priceName: req.body.priceName,
//       isDeleted: false
//     })
//     if (checkWire != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "priceName",
//           message: "Price Name is already exist."
//         }]
//       });
//     }
//     const doc = await Model.PriceSchema(req.body).save();
//     if (doc != null) {
//       return res.success("Price Created Successfully", doc);
//     } else {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "Price",
//           message: "Unable to Add Price."
//         }]
//       });
//       // throw new Error("unable to add");
//     }
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getPriceList = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     let search = req.query.search;
//     let startDate = req.query.startDate || null;
//     let endDate = req.query.endDate || null;
//     const criteria = {
//       isDeleted: false
//     }
//     if (search != "" && search != null) {
//       criteria.priceName = {
//         $regex: search,
//         $options: "i"
//       }
//     }
//     if (startDate != null && startDate != "" && endDate != null && endDate != "") {
//       criteria.createdAt = {
//         $gte: new Date(moment(startDate).startOf('days')),
//         $lte: new Date(moment(endDate).endOf('days'))
//       }
//     }
//     let count = await Model.PriceSchema.countDocuments(criteria);
//     let priceListData = await Model.PriceSchema.find(criteria, {
//         cultureWarriorsId: 0,
//         shortDiscription: 0,
//         adminId: 0,
//         title: 0
//       })
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       })
//     return res.success("Fetch Price Data Successfully", {

//       priceListData,
//       count
//     });

//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.updatePriceById = async (req, res, next) => {
//   try {
//     await validation.updatePriceById(req);
//     if (req.body.priceName != null && req.body.priceName != "") {
//       let dataCheck = await Model.PriceSchema.findOne({
//         _id: {
//           $nin: [mongoose.Types.ObjectId(req.body.priceId)]
//         },
//         priceName: req.body.priceName,
//         isDeleted: false
//       })
//       if (dataCheck != null) {
//         return res.send({
//           status: 0,
//           errors: [{
//             response: "error",
//             param: "priceName",
//             message: "Price Name is already exist with this name."
//           }]
//         });
//       }
//     }
//     let updated = await Model.PriceSchema.findOneAndUpdate({
//       _id: mongoose.Types.ObjectId(req.body.priceId)
//     }, {
//       $set: req.body
//     }, {
//       new: true
//     });
//     if (updated == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "priceId",
//           message: "Invalid priceId for Update."
//         }]
//       });
//     }
//     updated = await Model.PriceSchema.findOne({
//       _id: mongoose.Types.ObjectId(req.body.priceId)
//     }, {
//       cultureWarriorsId: 0
//     });
//     return res.success("Event Updated Successfully", updated);
//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getPriceListById = async (req, res, next) => {
//   try {
//     await validation.getPriceListById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.priceId)
//     }
//     let eventData = await Model.PriceSchema.findOne(criteria)
//     if (eventData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "priceId",
//           message: "Invalid priceId."
//         }]
//       });
//     }
//     return res.success("Fetch Price Data Successfully.", eventData);

//   } catch (error) {

//     next(error);
//   }
// }
// /*  ENQUIRY LIST APIS */
// module.exports.getEquiriesList = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) > 0 ? (Number(req.query.page) - 1) : 0;
//     const limit = Number(req.query.limit) || 10;
//     let search = req.query.search;
//     let startDate = req.query.startDate || null;
//     let endDate = req.query.endDate || null;
//     const criteria = {
//       isDeleted: false
//     }
//     if (search != "" && search != null) {
//       criteria.$or = [{
//         userName: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         email: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         firstName: {
//           $regex: search,
//           $options: "i"
//         }
//       }, {
//         lastName: {
//           $regex: search,
//           $options: "i"
//         }
//       }]
//     }
//     if (startDate != null && startDate != "" && endDate != null && endDate != "") {
//       criteria.createdAt = {
//         $gte: new Date(moment(startDate).startOf('days')),
//         $lte: new Date(moment(endDate).endOf('days'))
//       }
//     }
//     let count = await Model.EnquiriesMgtModel.countDocuments(criteria);
//     let enquiryListData = await Model.EnquiriesMgtModel.find(criteria)
//       .limit(limit)
//       .skip(page * limit)
//       .sort({
//         createdAt: -1
//       })
//       .populate('userId', "userName email phoneNo ");
//     return res.success("Fetch Enquiry Data Successfully", {
//       enquiryListData,
//       count
//     });

//   } catch (error) {
//     next(error);
//   }
// };
// module.exports.getEquiriesListById = async (req, res, next) => {
//   try {
//     await validation.getEquiriesListById(req);
//     const criteria = {
//       _id: mongoose.Types.ObjectId(req.query.enquiryId)
//     }
//     let enquiryData = await Model.EnquiriesMgtModel.findOne(criteria)
//     if (enquiryData == null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: "enquiryId",
//           message: "Invalid enquiryId."
//         }]
//       });
//     }
//     return res.success("Fetch Enquiry Data Successfully.", enquiryData);

//   } catch (error) {

//     next(error);
//   }
// }
// /* REPORT APIS */
// module.exports.addReport = async (req, res, next) => {
//   try {
//     await validation.addReport(req);
//     req.body.adminId = req.user._id;
//     const checkReport = await Model.ReportSchema.findOne({
//       reportName: req.body.reportName,
//       createdAt: {
//         $gte: new Date(req.body.startDate),
//         $lte: new Date(req.body.endDate)
//       }
//     })
//     if (checkReport != null) {
//       return res.send({
//         status: 0,
//         errors: [{
//           response: "error",
//           param: 'reportName',
//           message: 'Report is already exist with this reportName.'
//         }]
//       });
//     }
//     const doc = await Model.ReportSchema.create(req.body);
//     await doc.save();
//     return res.success("Categories created Success", doc);
//   } catch (error) {
//     next(error);
//   }
// }
// //   module.exports.getAllTrendExport = async (req, res, next) => {
// //     let pipeline = [];
// //     if (data.query.moduleKey)
// //       pipeline.push({
// //         $match: {
// //           status: {
// //             $ne: 2
// //           },
// //           moduleKey: data.query.moduleKey
// //         },
// //       });
// //     else pipeline.push({
// //       $match: {
// //         status: {
// //           $ne: 2
// //         }
// //       }
// //     });
// //     pipeline.push({
// //       $project: {
// //         title: 1,
// //         shortDescription: 1,
// //         contentDescription: 1,
// //         slug: 1,
// //         _id: 0
// //       }
// //     });
// //     let cultureWire = await model.TrendsSchema.aggregate(pipeline).exec();
// //     var ws = XLSX.utils.json_to_sheet(cultureWire, {
// //       header: ["title", "shortDescription", "contentDescription", "slug", ],
// //     });
// //     var wb = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(wb, ws, "cultureWire");
// //     let sendFileName = "cultureWire.xlsx";

// //     XLSX.writeFile(wb, "./uploads/exportedCsv/cultureWire.xlsx");
// //     done({
// //       message: await TrendsSchema.getResponseMessage(
// //         "FETCHED_SUCCESSFULLY"
// //       ),
// //       data: process.env.EXPORTURLLIVE + sendFileName,
// //     });
// // }
// module.exports.getTrendCsv = async (req, res) => {

//   const trendId = req.query.trendId;

//   const trend = await Model.TrendsSchema.find({
//       trendId: ObjectId(req.trendId),
//       Deleted: false
//     })
//     .cursor({})
//   const fileName = "Usertrend.csv";
//   const fileUrl = "./uploads/admin/" + fileName;
//   const writableStream = fs.createWriteStream(fileUrl);
//   writableStream.write(
//     "S.No, trend_id, title, shortDescription, contentDescription,refrenceLink, images, categoryId, trendsTagId, metaDescription, reviewSummary, compassMatricId, popularityInPercentage, inventiveness, engagement, humanCentricity, score, gender, ageGroup, geographyId\n"
//   );
//   trend
//     .pipe(
//       es.map(async (details, callback) => {
//         count++;
//         return callback(
//           null,
//           `${
//                   count
//                   },${
//                   JSON.stringify(details.trend_id ? details.trend_id : "")
//                   },${
//                   JSON.stringify(details.title ? details.title : "")
//                   },${
//                   JSON.stringify(details.shortDescription ? details.shortDescription : "")
//                   },${
//                   JSON.stringify(details.contentDescription ? details.contentDescription : "")
//                   },${
//                   JSON.stringify(details.refrenceLink ? details.refrenceLink : "")
//                   },${
//                   JSON.stringify(details.images ? details.images : "")
//                   },${
//                     JSON.stringify(details.categoryId ? details.categoryId : "")
//                   },${
//                   JSON.stringify(details.trendsTagId ? details.trendsTagId : "")
//                   },${
//                   JSON.stringify(details.metaDescription ?  details.metaDescription : "")
//                   },${
//                   JSON.stringify(details.reviewSummary ?  details.reviewSummary : "")
//                   },${
//                   JSON.stringify(details.compassMatricId ?  details.compassMatricId : "")
//                   },${
//                   JSON.stringify(details.popularityInPercentage ?  details.popularityInPercentage : "")
//                   },${
//                   JSON.stringify(details.inventiveness ?  details.inventiveness : "")
//                   },${
//                   JSON.stringify(details.engagement ?  details.engagement : "")
//                   },${
//                   JSON.stringify(details.humanCentricity ?  details.humanCentricity : "")
//                   },${
//                   JSON.stringify(details.score ?  details.score : "")
//                    },${
//                   JSON.stringify(details.gender ?  details.gender : "")
//                   },${
//                   JSON.stringify(details.ageGroup ?  details.ageGroup : "")
//                   },${
//                   JSON.stringify(details.geographyId ?  details.geographyId : "")
//                   },${
//                   JSON.stringify(details.createdAt ? moment(new Date(moment(details.createdAt).subtract(630, "minute"))).format("DD-MMM-YYYY") : "")
//                   }\n`
//         );
//       })
//     )
//     .pipe(writableStream);

//     trend.on("end", async () => {
//     console.log("url", fileUrl);
//   });
//   let fileNameSend = {
//     redirection: config.get("exportUrl") + fileName,
//   };
//   return fileNameSend;
// };