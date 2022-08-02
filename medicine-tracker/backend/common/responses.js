const functions = require("./functions");

module.exports = () => (req, res, next) => {
    // success response
    res.success = (message, data) => {
        message = functions.prettyCase(message);
        return res.send({ response: "successful", message, data: data || {}, status:1 });
    };

    // error resposne
    res.error = (code, message) => {
        message = functions.prettyCase(message);
        // res.status(code).send({status:0 , errors : message});
        res.status(code).send({
            status: 0,
            errors: [{
                "response": "error",
                "param": "",
                message
            }]
        })
    };
    // proceed forward
    next();
};
