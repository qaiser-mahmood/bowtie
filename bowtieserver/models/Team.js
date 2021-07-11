const mongoose = require('mongoose')
const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: { type: String, required: true },
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}],
})

const Team = mongoose.model('Team', TeamSchema)

module.exports = Team