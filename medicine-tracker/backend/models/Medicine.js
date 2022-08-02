const mongoose = require('mongoose')
const moment = require('moment')
// const cfg = require('../../config');
const Twilio = require('twilio');

const medicineSchema = new mongoose.Schema({
  id:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name:{
    type: String,
    required: [true, 'Medicine name must\'t be empty']
  },
  dosage:{
    type: 'Number',
    required: [true, 'Must be a numeric value']
  },
  frequency:{
    type: 'Number',
    required: true
  },
  notification:{
    type: 'Number',
    required: [true, 'Mustsn\'t be empty']
  },
  timeZone:{
      type: String
  },
  time: {
    type: Date, 
    index: true
  }

},{timestamps:true});

medicineSchema.methods.requiresNotification = function(date) {
  return Math.round(moment.duration(moment(this.time).tz(this.timeZone).utc()
    .diff(moment(date).utc())
    ).asMinutes()) === this.notification;
};

medicineSchema.statics.sendNotifications = function(callback) {
  const searchDate = new Date();
    Medicine
      .find()
      .then(function(medicines) {
        medicines = medicines.filter(function(medicine) {
            return medicine.requiresNotification(searchDate);
        });
        if (medicines.length > 0) {
          sendNotifications(medicines);
        }
      });
  }
    /**
    * Send messages to all medicine owners via Twilio
    * @param {array} medicines List of appointments.
    */
    function sendNotifications(medicines) {
      const client = new Twilio(cfg.twilioAccountSid, cfg.twilioAuthToken);
        medicines.forEach(function(medicine) {
          // Create options to send the message
          const options = {
            to: `+27786671901`,
            from: cfg.twilioPhoneNumber,
            /* eslint-disable max-len */
            body: `Hi Ronewa. Just a reminder that you have an appointment coming up.`,
            /* eslint-enable max-len */
          };

          // Send the message!
          client.messages.create(options, function(err, response) {
            if (err) {
              // Just log ERROR
              console.error(err);
            } else {
              // Log the last few digits of a phone number
              console.log('Message sent to *******');
            }
          });
        });

       /* if (callback) {
          callback.call();
        }*/
    }

const Medicine = mongoose.model('medicine',medicineSchema);

module.exports = Medicine;