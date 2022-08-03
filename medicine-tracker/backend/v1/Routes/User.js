const router = require("express").Router();
const multer = require("multer");
const Auth = require("../../common/authenticate");
const Controller = require("../controller");

// const aws = require("aws-sdk");
// const multerS3 = require('multer-s3');
// aws.config.update({
//     secretAccessKey: '',
//     accessKeyId: ''
// });
// var s3 = new aws.S3();
// var upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: '',/* bucket name */
//         ACL : "public-read",
//         key: function (req, file, cb) {
//             console.log(file);
//             cb(null, file.originalname); //use Date.now() for unique file keys
//         }
//     })
// });

const storage = multer.diskStorage({   
    destination: function(req, file, cb) { 
       cb(null, 'public/uploads/superAdmin');    
    }, 
    filename: function (req, file, cb) { 
       cb(null , file.originalname);   
    }
 });
 const upload = multer({ storage: storage});
/* SUPERADMIN ONBOARDING  */
router.post("/register", Controller.User.register);
router.post("/login", Controller.User.login);
router.post("/logout", Auth.verify("User"), Controller.User.logout);
router.get("/getProfile", Auth.verify("User"), Controller.User.getProfile); 
router.put("/updateProfile", Auth.verify("User"), Controller.User.updateProfile);
router.post("/changePassword",  Auth.verify("User"), Controller.User.changePassword);
router.post("/forgotPassword", Controller.User.sendNewPasswordInEmail); 
router.get('/checkForgotPasswordLink/:id', Controller.User.checkPasswordResetLink);
router.post('/resetPassswordByResetLink', Controller.User.resetPassswordByResetLink);
router.post("/uploadFile", upload.single("file"), Controller.User.uploadFile);

/* MEDICINE CRUD */
router.post("/addMedicine", Auth.verify("User"), Controller.User.addMedicine);
// router.put("/updateMedicine", Auth.verify("User"), Controller.User.updateMedicine);
// router.get("/getMedicine", Auth.verify("User"), Controller.User.getMedicine);
// router.delete("/deleteMedicine", Auth.verify("User"), Controller.User.deleteMedicine);



module.exports = router


