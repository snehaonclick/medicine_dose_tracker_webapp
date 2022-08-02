const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');/* send grid api key */
const fromMail = "snehasinghonclickinovation@gmail.com"/* sendgrid email */


exports.send = async (payload) => {
    try {
        const msg = {
            to: payload.to,
            from: fromMail,
            subject: payload.title,
            html: payload.message
        };
        try {
        const result = await sgMail.send(msg);
        console.log(result, "result");
        } catch (error) {
            console.log(error, "resulterror");
        }
        return result
    } catch (error) {
        return error;
    }
}