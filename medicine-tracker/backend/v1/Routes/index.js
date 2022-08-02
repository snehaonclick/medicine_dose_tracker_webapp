const router = require("express").Router();
// const UsersRoutes = require("./user");
// const AdminRoutes = require("./admin");
const UsersRoutes = require("./User");

// router.use("/user",UsersRoutes);
router.use("/User", UsersRoutes);
// router.use("/admin", AdminRoutes);

module.exports = router;




