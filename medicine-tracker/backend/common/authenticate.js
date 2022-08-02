const jwt = require("jsonwebtoken");
const Model = require("../models");
const Handlebars = require("handlebars");

module.exports.getToken = (data) =>
  jwt.sign(data, process.env.SECRET_KEY, {
    expiresIn: "30 days"
  });

module.exports.verifyToken = (token) =>
  jwt.verify(token, process.env.SECRET_KEY);

module.exports.verify = (...args) => async (req, res, next) => {
  try {
    const roles = [].concat(args).map((role) => role.toLowerCase());
    const token = String(req.headers.authorization || "")
      .replace(/bearer|jwt/i, "")
      .replace(/^\s+|\s+$/g, "");
    let decoded;
    if (token) decoded = this.verifyToken(token);
    let doc = null;
    let role = "";
    if (!decoded && roles.includes("guest")) {
      role = "guest";
      return next();
    }
    if (decoded != null && roles.includes("user")) {
      role = "user";
      doc = await Model.User.findOne({
        _id: decoded._id,
        accessToken: token,
        isBlocked: false,
        isDeleted: false,
      });
    }
    // if (decoded != null && roles.includes("admin")) {
    //   role = "admin";
    //   doc = await Model.Admin.findOne({
    //     _id: decoded._id,
    //     accessToken: token,
    //     isBlocked: false,
    //     isDeleted: false,
    //   });
    // }
    // if (decoded != null && roles.includes("superadmin")) {
    //   role = "superadmin";
    //   doc = await Model.Admin.findOne({
    //     _id: decoded._id,
    //     accessToken: token,
    //     isBlocked: false,
    //     isDeleted: false,
    //   });
    // }
    if (!doc) {
      return res.status(401).json({
        msg: 'Token is not valid'
      });
    };
    if (role) req[role] = doc.toJSON();
    next();
  } catch (error) {
    console.error('something wrong with auth middleware')
    res.status(500).json({
      msg: 'Server Error'
    });
  }
};