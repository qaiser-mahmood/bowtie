const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    usertype: {type: String, required: true},
    company: {type: String, required: false},
    date: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date
})

const User = mongoose.model('User', UserSchema)

module.exports = User