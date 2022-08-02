const Services = require("../services/EmailService");
module.exports.init = async () => {
    process.on("sendEmail", async (args) => {
        await Services.send(args);
    });
};