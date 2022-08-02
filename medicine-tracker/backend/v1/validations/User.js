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

// /* CATEGORIES AND SUBCATEGORIES APIS */
// module.exports.addCategories = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         name: Joi.string().required().label("Name"),
//         slug: Joi.string().required().label("Slug"),
//         discription: Joi.string().required().label("Description"),
//         parentCategoryId: Joi.string().optional().label("Parent Category Id"),
//         banner: Joi.array().optional().label("Banner"),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getCategoriesById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         categoryId: Joi.string().required().label("Category Id"),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updateCategoryById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         categoryId: Joi.string().length(24).required().label("Category Id"),
//         name: Joi.string().optional().label("Name"),
//         slug: Joi.string().optional().label("Slug"),
//         discription: Joi.string().optional().label("Description"),
//         parentCategoryId: Joi.string().optional().label("Parent Category Id"),
//         banner: Joi.array().optional().label("Banner"),
//         isActive: Joi.boolean().optional()
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getSubCategoriesByCategoryId = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         categoryId: Joi.string().required().label("Category Id"),
//         page: Joi.string().optional().label("Page"),
//         limit: Joi.string().optional().label("Limit")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updateSubCategoryById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         categoryId: Joi.string().length(24).required().label("Category Id"),
//         name: Joi.string().optional().label("Name"),
//         slug: Joi.string().optional().label("Slug"),
//         discription: Joi.string().optional().label("Description"),
//         parentCategoryId: Joi.string().optional().label("Parent Category Id"),
//         banner: Joi.array().optional().label("Banner"),
//     });
//     return await validateSchema(req[property], schema);
// }
// /* TRENDS TAG APIS */
// module.exports.addTrendsTag = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         trendTagName: Joi.array().items(Joi.string().required()).required().label("Trend Tag Name"),
//         subCategoryId: Joi.string().length(24).required().label("SubCategory Id"),
//         categoryId: Joi.string().length(24).required().label("Category Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getTrendsTagById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         tagId: Joi.string().required().label("Tag Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getTrendsTagByCategoryAndSubCategory = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         categoryId: Joi.string().required().label("Category Id"),
//         subCategoryId: Joi.string().required().label("SubCategory Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updateTrendsTagById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         tagId: Joi.string().required().label("Tag Id"),
//         trendTagName: Joi.array().items(Joi.string().optional()).optional().label("Trend Tag Name"),
//         subCategoryId: Joi.string().length(24).optional().label("SubCategory Id"),
//         categoryId: Joi.string().length(24).optional().label("Category Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// /* TRENDS TYPE APIS */
// module.exports.addTrendsType = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         trendTypeName: Joi.string().required().label("Trend Type Name"),
//         slug: Joi.string().required().label("Slug"),
//         discription: Joi.string().required().label("Description"),
//         banner: Joi.array().optional().label("Banner"),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updateTrendsTypeById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         trendTypeId: Joi.string().required().label("Trend Type Id"),
//         trendTypeName: Joi.string().optional().label("Trend Type Name"),
//         slug: Joi.string().optional().label("Slug"),
//         discription: Joi.string().optional().label("Description"),
//         banner: Joi.array().optional().label("Banner"),
//         isActive: Joi.boolean().optional()
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getTrendsTypeById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         trendsTypeId: Joi.string().required().label("Tag Type Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.removeTrendsType = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         trendsTypeIds: Joi.array().items(Joi.string().required()).required().label("Trends Type Ids")
//     });
//     return await validateSchema(req[property], schema);
// }
// /* TRENDS APIS */
// module.exports.addTrend = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         categoryId: Joi.string().length(24).required().label("Category Id"),
//         trendsTagId: Joi.array().items(Joi.string().length(24).required()).required().label("Trends Tag Id"),
//         trendstypeId: Joi.string().length(24).required().label("Trends Type Id"),
//         cultureWarriorsId: Joi.string().length(24).required().label("CultureWarriors Id"),
//         geographyId: Joi.array().items(Joi.string().length(24).required()).required().label("Geography Id"),
//         compassMatricId: Joi.array().items(Joi.string().length(24).required()).required().label("Compass Matric Id"),
//         title: Joi.string().required().label("Title"),
//         shortDescription: Joi.string().required().label("Short Description"),
//         contentDescription: Joi.string().required().label("Content Description"),
//         refrenceLink: Joi.array().items(Joi.string().optional().allow("")).optional().label("Refrence Link"),
//         slug: Joi.string().required().label("Slug"),
//         images: Joi.array().items(Joi.string().optional().allow("")).optional().label("Images"),
//         seoDetails: Joi.object().keys({
//             seoTitle: Joi.string().required().label("Seo Title"),
//             metaDescription: Joi.string().required().label("Meta Description"),
//             scripts: Joi.array().items({
//                 scriptType: Joi.string().optional().label("Script Type"),
//                 scriptContent: Joi.string().optional().label("Script Content"),
//             }).optional(),
//         }),
//         videoUrl: Joi.string().required().label("Video Url"),
//         score: Joi.number().required().label("Score"),
//         popularityInPercentage: Joi.number().required().label("Popularity In Percentage"),
//         activity: Joi.number().required().label("Activity"),
//         freshness: Joi.number().required().label("Freshness"),
//         trending: Joi.string().required().label("Trending"),
//         research: Joi.string().required().label("Research"),
//         interest: Joi.string().required().label("Interest"),
//         concept: Joi.string().required().label("Concept"),
//         related: Joi.string().required().label("Related"),
//         segment: Joi.string().required().label("Segment"),
//         comparison: Joi.string().required().label("Comparison"),
//         relatedReport: Joi.string().required().label("Related Report"),
//         viewTime: Joi.string().required().label("View Time"),
//         gender: Joi.string().allow("MALE", "FEMALE", "OTHER").optional().label("Gender"),
//         ageGroup: Joi.string().optional().label("Age Group"),
//         reviewSummary: Joi.string().required().label("Review Summary"),
//         inventiveness: Joi.number().required().label("Inventiveness"),
//         engagement: Joi.number().required().label("Engagement"),
//         humanCentricity: Joi.number().required().label("Human Centricity"),

//         // compassMatric: Joi.object().keys({
//         //     categoryId: Joi.string().length(24).optional().label("Category Id"),
//         //     subCategoryId: Joi.string().length(24).optional().label("SubCategory Id")
//         // })
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updateTrendById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         trendId: Joi.string().length(24).required().label("Trend Id"),
//         geographyId: Joi.array().items(Joi.string().length(24).optional()).optional().label("Geography Id"),
//         compassMatricId: Joi.array().items(Joi.string().length(24).optional()).optional().label("Compass Matric Id"),
//         title: Joi.string().optional().label("Title"),
//         shortDescription: Joi.string().optional().label("Short Description"),
//         contentDescription: Joi.string().optional().label("Content Description"),
//         slug: Joi.string().optional().label("Slug"),
//         categoryId: Joi.string().length(24).optional().label("Category Id"),
//         subCategoryId: Joi.string().length(24).optional().label("SubCategory Id"),
//         trendsTagId: Joi.array().items(Joi.string().length(24).optional()).optional().label("Trends Tag Id"),
//         images: Joi.array().items(Joi.string().optional()).optional().label("Images"),
//         seoDetails: Joi.object().keys({
//             seoTitle: Joi.string().optional().label("Seo Title"),
//             metaDescription: Joi.string().optional().label("Meta Description"),
//             scripts: Joi.array().items({
//                 scriptType: Joi.string().optional().label("Script Type"),
//                 scriptContent: Joi.string().optional().label("Script Content"),
//             }).optional(),
//         }),
//         videoUrl: Joi.string().optional().label("Video Url"),
//         score: Joi.number().optional().label("Score"),
//         popularityInPercentage: Joi.number().optional().label("Popularity In Percentage"),
//         activity: Joi.number().optional().label("Activity"),
//         freshness: Joi.number().optional().label("Freshness"),
//         trending: Joi.string().optional().label("Trending"),
//         research: Joi.string().optional().label("Research"),
//         interest: Joi.string().optional().label("Interest"),
//         concept: Joi.string().optional().label("Concept"),
//         related: Joi.string().optional().label("Related"),
//         segment: Joi.string().optional().label("Segment"),
//         comparison: Joi.string().optional().label("Comparison"),
//         relatedReport: Joi.string().optional().label("Related Report"),
//         viewTime: Joi.string().optional().label("View Time"),
//         trendstypeId: Joi.string().length(24).optional().label("Trends Type Id"),
//         cultureWarriorsId: Joi.string().length(24).optional().label("CultureWarriors Id"),
//         gender: Joi.string().allow("MALE", "FEMALE", "OTHER").optional().label("Gender"),
//         ageGroup: Joi.string().optional().label("Age Group"),
//         reviewSummary: Joi.string().optional().label("Review Summary"),
//         inventiveness: Joi.number().optional().label("Inventiveness"),
//         engagement: Joi.number().optional().label("Engagement"),
//         humanCentricity: Joi.number().optional().label("Human Centricity"),
//         trendStatus: Joi.number().optional().label("Trend Status"),
//         isDeleted: Joi.boolean().optional(),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getTrendById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         trendId: Joi.string().required().label("Trend Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// /*TREND COUNTRY NAME APIS */       
// module.exports.addCountryForTrends = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         name: Joi.string.required().label("Name"),
//         options: Joi.array().items(Joi.string().optional()).label("Options")
//     });
//     return await validateSchema(req[property], schema);
// }
// /*TREND CONPASS MATRIC APIS */       
// module.exports.addCompassMatricForTrends = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         name: Joi.string.required().label("Name"),
//         options: Joi.array().items(Joi.string().optional()).label("Options")
//     });
//     return await validateSchema(req[property], schema);
// }
// /* CULTURE wARRIOR APIS MANAGEMENT BY SUPERADMIN */
// module.exports.addCultureWarrior = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         categoryId: Joi.string().length(24).optional().label("Category Id"),
//         subCategoryId: Joi.string().length(24).optional().label("SubCategory Id"),
//         trendsTagId: Joi.array().items(Joi.string().length(24).optional()).optional().label("Trends Tag Id"),
//         trendstypeId: Joi.string().length(24).optional().label("Trends Type Id"),
//         userName: Joi.string().required().label("User Name"),
//         email: Joi.string().required().label("Email"),
//         password: Joi.string().required().label("Password"),
//         firstName: Joi.string().required().label("First Name"),
//         lastName: Joi.string().required().label("Last Name"),
//         contactNumber: Joi.string().required().label("Contact Number"),
//         image: Joi.string().allow("").optional().label("Image"),
//         displayName: Joi.string().allow("").optional().label("Display Name"),
//         profileDescription: Joi.string().allow("").optional().label("Profile Description"),

//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getCultureWarriorById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         cultureWireId: Joi.string().required().label("Culture Wire Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updateCultureWarriorById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         cultureWireId: Joi.string().length(24).required().label("Culture Wire Id"),
//         categoryId: Joi.string().length(24).optional().label("Category Id"),
//         subCategoryId: Joi.string().length(24).optional().label("SubCategory Id"),
//         trendsTagId: Joi.array().items(Joi.string().length(24).optional()).optional().label("Trends Tag Id"),
//         trendstypeId: Joi.string().length(24).optional().label("Trends Type Id"),
//         userName: Joi.string().optional().label("User Name"),
//         email: Joi.string().optional().label("Email"),
//         password: Joi.string().optional().label("Password"),
//         firstName: Joi.string().optional().label("First Name"),
//         lastName: Joi.string().optional().label("Last Name"),
//         contactNumber: Joi.string().optional().label("Contact Number"),
//         image: Joi.string().allow("").optional().label("Image"),
//         displayName: Joi.string().allow("").optional().label("Display Name"),
//         profileDescription: Joi.string().allow("").optional().label("Profile Description"),
//         isActive: Joi.boolean().optional(),
//         isDeleted: Joi.boolean().optional()
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.regenerateCultureWarriorPasswordById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         cultureWireId: Joi.string().required().label("Culture Wire Id"),
//         password: Joi.string().required().label("Password"),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.removeCultureWarrior = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         cultureWarriorIds: Joi.array().items(Joi.string().required()).required().label("Culture Wire Ids")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.powerTransferToCultureWarrior = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         cultureWireId: Joi.string().length(24).required().label("Culture Wire Id"),
//         isMigrate: Joi.boolean().required()
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.leaderBoardRewardMessage = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         cultureWireId: Joi.string().length(24).required().label("Culture Wire Id"),
//         email: Joi.string().required().label("Email"),
//         message: Joi.string().required().label("Message"),

//     });
//     return await validateSchema(req[property], schema);
// }
// /* EVENT APIS */
// module.exports.addEvent = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         trendstypeId: Joi.string().length(24).required().label("Trends Type Id"),
//         cultureWarriorsId: Joi.string().length(24).optional().label("Culture Warriors Id"),
//         eventTitle: Joi.string().required().label("Event Title"),
//         shortDescription: Joi.string().required().label("Short Description"),
//         contentDescription: Joi.string().required().label("Content Description"),
//         slug: Joi.string().required().label("Slug"),
//         images: Joi.array().items(Joi.string().optional().allow("")).optional().label("Images"),
//         latitude: Joi.string().required().label("Latitude"),
//         longitude: Joi.string().required().label("Longitude"),
//         startDate: Joi.date().required().label("Start Date"),
//         endDate: Joi.date().required().label("End Date"),
//         startTime: Joi.string().required().label("Start Time"),
//         endTime: Joi.string().required().label("End Time")
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updateEventById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         eventId: Joi.string().length(24).required().label("Event Id"),
//         cultureWarriorsId: Joi.string().length(24).optional().label("Culture Warriors Id"),
//         eventTitle: Joi.string().optional().label("Event Title"),
//         shortDescription: Joi.string().optional().label("Short Description"),
//         contentDescription: Joi.string().optional().label("Content Description"),
//         slug: Joi.string().optional().label("Slug"),
//         images: Joi.array().items(Joi.string().optional().allow("")).optional().label("Images"),
//         latitude: Joi.string().optional().label("Latitude"),
//         longitude: Joi.string().optional().label("Longitude"),
//         startDate: Joi.date().optional().label("Start Date"),
//         endDate: Joi.date().optional().label("End Date"),
//         startTime: Joi.string().optional().label("Start Time"),
//         endTime: Joi.string().optional().label("End Time"),
//         isSaveAsDraft: Joi.boolean().optional()
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getEventListById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         eventId: Joi.string().required().label("Event Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// /* PRICE APIS */
// module.exports.addPrice = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         title: Joi.string().required().label("Title"),
//         shortDescription: Joi.string().required().label("Short Description"),
//         priceName: Joi.string().required().label("Price Name"),
//         duration: Joi.string().required().label("Duration"),
//         amount: Joi.number().required().label("Amount"),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.updatePriceById = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         priceId: Joi.string().length(24).required().label("Price Id"),
//         title: Joi.string().optional().label("Title"),
//         shortDiscription: Joi.string().optional().label("Short Description"),
//         priceName: Joi.string().optional().label("Price Name"),
//         duration: Joi.string().optional().label("Duration"),
//         amount: Joi.number().optional().label("Amount"),
//     });
//     return await validateSchema(req[property], schema);
// }
// module.exports.getPriceListById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         priceId: Joi.string().required().label("Price Id")
//     });
//     return await validateSchema(req[property], schema);
// }
// /* ENQUIRY LIST APIS */
// module.exports.getEquiriesListById = async (req, property = 'query') => {
//     let schema = Joi.object().keys({
//         enquiryId: Joi.string().required().label("Enquiry Id"),
//     });
//     return await validateSchema(req[property], schema);
// }
// /* REPORT APIS */
// module.exports.addReport = async (req, property = 'body') => {
//     let schema = Joi.object().keys({
//         parentReportedId: Joi.string().length(24).optional().label("Parent Reported Id"),
//         categoryId: Joi.string().required().label("Category Id"),
//         trendId: Joi.string().length(24).optional().label("Trend Id"),
//         trendsTagId: Joi.string().length(24).required().label("Trends Tag Id"),
//         eventTitle: Joi.string().required().label("Event Title"),
//         customContentEditor: Joi.string().required().label("Custom Content Editor"),
//         startDate: Joi.date().required().label("start Date"),
//         endDate: Joi.date().required().label("End Date"),
//         customContentPlacement: Joi.string().required().label("Custom Content Placement"),
//         accessStatus: Joi.string().allow("FREE", "PRO").optional().label("Access Status")
//     });
//     return await validateSchema(req[property], schema);
// }