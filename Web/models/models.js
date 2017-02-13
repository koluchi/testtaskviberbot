'use strict'

const mongoose = require('mongoose');
let ObjectId = mongoose.Types.ObjectId; 
const Schema = mongoose.Schema;

const BotSchema = new Schema({
    name: { type: String, default: 'Новый бот', trim: true },
    paToken: { type: String, default: '', trim: true },
    webhookURL: {type: String, default: '', trim: true}
});

BotSchema.path('name').required(true, 'Название не может быть пустым!');
BotSchema.path('paToken').required(true, 'Токен не может быть пустым!');
BotSchema.path('webhookURL').required(true, 'URL не может быть пустым!');

//module.exports = mongoose.model('Bot', BotSchema);
mongoose.model('Bot', BotSchema);

const UserProfileSchema = new Schema({
    id: {type: String},
    name: {type: String},
    avatar:{type: String},
    country:{type: String},
    language:{type: String},

});

const UserSchema = new Schema({
    profile: {type: UserProfileSchema},
    bots: [{type: Schema.ObjectId, ref: 'Bot'}],
    subscribed: {type:Boolean, default:true}
});

UserSchema.statics = {
    getUser: function(profile){
        return this.findOne({"profile.id":profile.id})
    },
    getUserbyId: function(id){
        return this.findOne({_id:id});
    }
}

mongoose.model('User', UserSchema);

const MessageSchema = new Schema({
    bot: {type: Schema.ObjectId, ref: 'Bot'},
    user: {type: Schema.ObjectId, ref: 'User'},
    message: {type: String},
    timestamp: {type: Number},
    isUserMessage: {type: Boolean, default: false},
    token: String
});

MessageSchema.statics = {
    getMessagebyId: function(id){
        return this.findOne({_id:id});
    },
    getUserBotMessages: function(botId, userId){
        return this.find({bot: new ObjectId(botId), user: new ObjectId(userId)});
    }
}

mongoose.model('Message', MessageSchema);