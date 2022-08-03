const _ = require("lodash");
const Model = require("../../models");
const moment = require("moment");
const Auth = require("../../common/authenticate");
const functions = require("../../common/functions");
const mongoose = require("mongoose");
const constants = require("../../common/constants");
const validation = require('../validations/index')
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
    await validation.register(req);
    // const avatars = gravatar.url(req.body.email, {s: '100', r: 'x', d: 'retro'}, true)

    const check = await Model.User.findOne({
      email: email,
      password: password,
    });
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
