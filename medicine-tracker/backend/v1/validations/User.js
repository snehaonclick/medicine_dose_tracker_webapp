const Joi = require("joi");
const validateSchema = async (inputs, schema) => {
    try {
        const {
            error,
            value
        } = schema.validate(inputs);
        if (error) throw error.details ? error.details[0].message.replace(/['"]+/g, '') : "";
        else return false;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

Joi.objectId = () => Joi.string().pattern(/^[0-9a-f]{24}$/, "valid ObjectId");
module.exports.identify = Joi.object({
    id: Joi.objectId().required(),
});

module.exports.register = async (req, property = 'body') => {
    let schema = Joi.object().keys({
        email: Joi.string().email().required().label("Email"),
        name: Joi.string().optional().label("User Name"),
        avatars: Joi.string().optional().label("Avatars"),
        password: Joi.string().min(6).required()
    })
    return await validateSchema(req[property], schema);
}
module.exports.login = async (req, property = 'body') => {
    let schema = Joi.object().keys({
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).min(6).required().label("Password"),
    });
    return await validateSchema(req[property], schema);
}
// module.exports.sendNewPasswordInEmail = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         email: Joi.string().email().required().label("Email"),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.changePassword = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         oldPassword: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).min(6).required().label("Old Password"),
//         newPassword: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).min(6).required().label("New Password"),
//         confirmPassword: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).min(6).required().label("Confirm Password")
//     });
//     return await validateSchema(req[property], schema);
// }
module.exports.updateProfile = async (req, property = 'body') => {
    let schema = Joi.object().keys({
        email: Joi.string().email().optional().label("Email"),
        name: Joi.string().optional().label("User Name"),
        surname: Joi.string().optional(),
        cellphone: Joi.string().optional(),
        address: Joi.string().optional().label("address"),
        city: Joi.string().optional().allow("").label("city"),
        state: Joi.string().optional(),
        zip: Joi.string().optional(),
    });
    return await validateSchema(req[property], schema);
}
