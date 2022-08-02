const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userProfileSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name:{
        type: String,
        required: [true, 'Name is required']
    },
    surname:{
        type: String,
        required: [true, 'Surname is required']
    },
    cellphone:{
        type: Number,
        required: [true, 'Cellphone number is required']
    },
    address:{
        type: String,
        requred: [true, 'Address is required']
    },
city    :{
        type: String,
        required: [true, 'City code is required']
    },
    state:{
        type: String,
        required: [true, 'State is required']
    },
    zip:{
        type: Number,
        required: [true, 'Zip code is required']
    }

},{timestamps:true})

module.exports = mongoose.model('userProfile',userProfileSchema);