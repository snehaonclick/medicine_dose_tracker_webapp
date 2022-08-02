const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const constant = require('../common/constants');

const DocSchema = new Schema({
    name: { 
        type: String
    },
    email: {
        type: String,
        default: "",
        index: true
    },
    password: {
        type: String,
        default: "",
        index: true
    },
    avatars:{
        type: String
      },
      date:{
        type: Date,
        default: Date.now
      },
    accessToken: {
        type: String,
        default: "",
        index: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isBlocked : {
        type: Boolean,
        default : false
    },
}, {
    timestamps: true
});

DocSchema.set("toJSON", {
    getters: true,
    virtuals: true
});

DocSchema.methods.authenticate = function (password, callback) {
    const promise = new Promise((resolve, reject) => {
        if (!password) {
            reject(new Error("MISSING_PASSWORD"));
        }

        bcrypt.compare(password, this.password, (error, result) => {
            if (!result) reject(new Error("INVALID_PASSWORD"));
            resolve(this);
        });
    });

    if (typeof callback !== "function") return promise;
    promise.then((result) => callback(null, result)).catch((err) => callback(err));
};

DocSchema.methods.setPassword = function (password, callback) {
    const promise = new Promise((resolve, reject) => {
        if (!password) reject(new Error("Missing Password"));

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) reject(err);
            this.password = hash;
            resolve(this);
        });
    });

    if (typeof callback !== "function") return promise;
    promise.then((result) => callback(null, result)).catch((err) => callback(err));
};

module.exports = mongoose.model("User", DocSchema);
