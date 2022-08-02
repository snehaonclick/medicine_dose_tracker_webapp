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




// /* TRENDS TAG */
// router.post("/addTrendsTag", Auth.verify("User"), Controller.User.addTrendsTag); 
// router.get("/getTrendsTag", Auth.verify("superAdmin"), Controller.superAdmin.getTrendsTag);  
// router.get("/getTrendsTagById", Auth.verify("superAdmin"), Controller.superAdmin.getTrendsTagById);  
// router.get("/getTrendsTagByCategoryAndSubCategory", Auth.verify("superAdmin"), Controller.superAdmin.getTrendsTagByCategoryAndSubCategory);  
// router.put("/updateTrendsTagById", Auth.verify("superAdmin"), Controller.superAdmin.updateTrendsTagById);  
// /* TRENDS TYPE */
// router.post("/addTrendsType", Auth.verify("superAdmin"), Controller.superAdmin.addTrendsType);
// router.get("/getTrendsType", Auth.verify("superAdmin"), Controller.superAdmin.getTrendsType);
// router.get("/getTrendsTypeById", Auth.verify("superAdmin"), Controller.superAdmin.getTrendsTypeById);  
// router.put("/updateTrendsTypeById", Auth.verify("superAdmin"), Controller.superAdmin.updateTrendsTypeById);
// router.delete("/removeTrendsType", Auth.verify("superAdmin"), Controller.superAdmin.removeTrendsType);
// /* TRENDS  */
// router.post("/addTrend", Auth.verify("superAdmin"), Controller.superAdmin.addTrend); 
// router.put("/updateTrendById", Auth.verify("superAdmin"), Controller.superAdmin.updateTrendById);
// router.get("/getTrendById", Auth.verify("superAdmin"), Controller.superAdmin.getTrendById);
// router.get("/getTrendList", Auth.verify("superAdmin"), Controller.superAdmin.getTrendList);   
// router.get("/getTrendCsv", Auth.verify("superAdmin"), Controller.superAdmin.getTrendCsv);   
// /* TRENDS COMPASS MATRIC  */
// router.post("/addCompassMatricForTrends", Auth.verify("superAdmin"), Controller.superAdmin.addCompassMatricForTrends); 
// router.get("/getCompassMetricForTrends", Auth.verify("superAdmin"), Controller.superAdmin.getCompassMetricForTrends);
// /* GEOGRAPHY MANAGEMENT APIS */
// router.post("/addCountryForTrends", Auth.verify("superAdmin"), Controller.superAdmin.addCountryForTrends); 
// router.get("/getCountryForTrends", Auth.verify("superAdmin"), Controller.superAdmin.getCountryForTrends);
// /* CATEGORY & SUBCATEGORY LIST */
// router.post("/addCategories", Auth.verify("superAdmin"), Controller.superAdmin.addCategories);
// router.get("/getCategories", Auth.verify("superAdmin"), Controller.superAdmin.getCategories);   
// router.get("/getCategoriesById", Auth.verify("superAdmin"), Controller.superAdmin.getCategoriesById);  
// router.put("/updateCategoryById", Auth.verify("superAdmin"), Controller.superAdmin.updateCategoryById);
// router.get("/getSubCategories", Auth.verify("superAdmin"), Controller.superAdmin.getSubCategories); 
// router.put("/updateSubCategoryById", Auth.verify("superAdmin"), Controller.superAdmin.updateSubCategoryById);
// router.get("/getSubCategoriesByCategoryId", Auth.verify("superAdmin"), Controller.superAdmin.getSubCategoriesByCategoryId);
// /* CULTURE WIRE MGT BY SUPER ADMIN */
// router.post("/addCultureWarrior", Auth.verify("superAdmin"), Controller.superAdmin.addCultureWarrior);   
// router.get("/getCultureWarrior", Auth.verify("superAdmin"), Controller.superAdmin.getCultureWarrior);  
// router.get("/getCultureWarriorById", Auth.verify("superAdmin"), Controller.superAdmin.getCultureWarriorById);  
// router.put("/updateCultureWarriorById", Auth.verify("superAdmin"), Controller.superAdmin.updateCultureWarriorById);    
// router.delete("/removeCultureWarrior", Auth.verify("superAdmin"), Controller.superAdmin.removeCultureWarrior); 
// router.delete("/powerTransferToCultureWarrior", Auth.verify("superAdmin"), Controller.superAdmin.powerTransferToCultureWarrior); 
// router.put("/regenerateCultureWarriorPasswordById", Auth.verify("superAdmin"), Controller.superAdmin.regenerateCultureWarriorPasswordById);     
// router.get("/getLeaderBoardList", Auth.verify("superAdmin"), Controller.superAdmin.getLeaderBoardList);  
// router.post("/leaderBoardRewardMessage", Auth.verify("superAdmin"), Controller.superAdmin.leaderBoardRewardMessage); 

// /* EVENT APIS */
// router.post("/addEvent", Auth.verify("superAdmin"), Controller.superAdmin.addEvent);     
// router.get("/getEventList", Auth.verify("superAdmin"), Controller.superAdmin.getEventList);
// router.put("/updateEventById", Auth.verify("superAdmin"), Controller.superAdmin.updateEventById);
// router.get("/getEventListById", Auth.verify("superAdmin"), Controller.superAdmin.getEventListById);
// /* PRICE APIS */  
// router.post("/addPrice", Auth.verify("superAdmin"), Controller.superAdmin.addPrice);  
// router.get("/getPriceList", Auth.verify("superAdmin"), Controller.superAdmin.getPriceList);
// router.put("/updatePriceById", Auth.verify("superAdmin"), Controller.superAdmin.updatePriceById);
// router.get("/getPriceListById", Auth.verify("superAdmin"), Controller.superAdmin.getPriceListById);
// /* ENQUIRIES LIST APIS */
// router.get("/getEquiriesList", Auth.verify("superAdmin"), Controller.superAdmin.getEquiriesList);
// router.get("/getEquiriesListById", Auth.verify("superAdmin"), Controller.superAdmin.getEquiriesListById);
// /* REPORT APIS */
// router.post("/addReport", Auth.verify("superAdmin"), Controller.superAdmin.addReport);  
// router.get("/getTrendCsv", Auth.verify("superAdmin"), Controller.superAdmin.getTrendCsv);



module.exports = router


