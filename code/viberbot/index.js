'use strict';
const ViberBotAPI = (app)=> {

    const _self = this;
    const _app = app;
/*
    const mongoose = require('mongoose');
    mongoose.Promise = global.Promise;
*/
    const Bot = mongoose.model('Bot');
    const User = mongoose.model('User');
    const Message = mongoose.model('Message');

    const ViberBot = require('viber-bot').Bot;
    const BotEvents = require('viber-bot').Events;
    const TextMessage = require('viber-bot').Message.Text;

    const winston = require('winston');
    const toYAML = require('winston-console-formatter');
    require('dotenv').config();
    
    //сохраняем токен сообщения из web морды
    const saveMessageToken = function(id, token){
        Message.getMessagebyId(id)
        .then((msg)=>{
            msg.token = token;
            return msg.save();
        });
    }
    //получаем сокет из config
    const getSocket = function(botId, userId){
        let conf = _app.get('config');
        let index = conf.sockets.findIndex(function(el){return el.userId == userId && el.botId == botId;});
        let result = null;
        if(index >= 0){
            result = conf.sockets[index].socket
        }
        return result;
    }

    
    //инстанс viberbot
    var ViberBotInstance = function(name, token, botId){
        const _botId = botId;
        
        function createLogger() {
            const logger = new winston.Logger({
                level: "debug" // We recommend using the debug level for development
            });

            logger.add(winston.transports.Console, toYAML.config());
            return logger;
        }
        //получаем сокет из профиля пользователя
        const getSocketbyUserProfile = function(bot, userProfile){
            let conf = _app.get('config');
            let botIndex = conf.bots.findIndex(function(el){return el.descr.paToken == bot.authToken;});
            let botId = conf.bots[botIndex].descr._id;
            return User.getUser(userProfile)
            .then((user)=>{
                return getSocket(botId, user._id);
            },(err)=>{
                console.log(err);
            });
        }
        //отправить сообщение пользователю(сообщения бота)
        function say(response, message, messageId) {
            response.send(new TextMessage(message))
            .then((tokens)=>{
                if(messageId && tokens && tokens[0]){
                    saveMessageToken(messageId, tokens[0])
                }
            });
        }
        //сохранение пользователя/получение пользователя
        const saveUser = function (userProfile){
            return User.getUser(userProfile)
            .then((user)=>{
                if(user){
                    if(user.bots.filter((el)=>{return el==_botId;}).lenght==0){
                        user.bots.push(_botId);
                        user.profile.name = userProfile.name;
                        user.profile.avatar = userProfile.avatar;
                        return user.save();
                    } else if(!user.subscribed){
                        user.subscribed = true;
                        user.profile.name = userProfile.name;
                        user.profile.avatar = userProfile.avatar;
                        return user.save();
                    } else {
                        if(user.profile.name != userProfile.name || user.profile.avatar != userProfile.avatar){
                            user.profile.name = userProfile.name;
                            user.profile.avatar = userProfile.avatar;
                            return user.save();
                        } else {
                            return user;
                        }
                    }
                } else {
                    user = new User({profile: userProfile, bots: [_botId]});
                    return user.save();
                }
            },(err)=>{
                    console.log(err);
                    return err;
            });
        }
        //сохранение сообщения
        const saveMessage = function (response, msgText, msgToken, msgTimestamp, isUser){
            return new Promise((resolve, reject)=>{
                saveUser(response.userProfile)
                .then(user=>{
                    if(user){
                        const message = new Message({user: user._id, bot: _botId, message: msgText, token: msgToken, timestamp: msgTimestamp, isUserMessage: isUser});
                        return message.save();
                    } else {
                        reject();
                    }
                }).then((message)=>{
                    resolve(message);
                },err=>{
                    console.log(err);
                    reject(err);
                });
            });
        }

        const logger = createLogger();

        // Creating the bot with access token, name and avatar
        const bot = new ViberBot(logger, {
            authToken: token, // Learn how to get your access token at developers.viber.com
            name: name,
            avatar: "https://raw.githubusercontent.com/devrelv/drop/master/151-icon.png" // Just a placeholder avatar to display the user
        });

        // The user will get those messages on first registration
        //обработка event subscribe(подписаться)(почему то не приходит)
        bot.onSubscribe(response => {
            const msgText = `Привет ${response.userProfile.name}. Это SUBSCRIBE!`;
            saveUser(response.userProfile)
            .then(user=>{
                onFinish(new TextMessage(msgText));
            },(err)=>{
                console.log(err);
            });
            
        });
        //обработка event unsubscribe(отписаться)
        bot.onUnsubscribe(userId => {
            const profile = {id: userId};
            User.getUser(profile)
            .then((user)=>{
                user.subscribed = false;
                user.save();
            });
        });
        //приглашение при открытии приватных сообщений в viber
        bot.onConversationStarted((userProfile, onFinish) => {
            const msgText = `Привет ${userProfile.name}. Я ${bot.name}! Поговори со мной, скажи мне Привет, привет или хао!`;
            saveUser(userProfile)
            .then(user=>{
                onFinish(new TextMessage(msgText));
            },(err)=>{
                console.log(err);
            });
        });

        bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
            // This sample bot can answer only text messages, let's make sure the user is aware of that.
            if (!(message instanceof TextMessage)) {
                say(response, 'Извини, только текст.');
            }
        });

        
        //обработчик текстовых сообщений с маской Привет|привет|Хао
        bot.onTextMessage(/^Привет|привет|Хао$/i, (message, response) => {
            saveMessage(response, message.text, message.token, message.timestamp, true)
            .then((msg)=>{
                getSocketbyUserProfile(bot, response.userProfile)
                .then(socket=>{
                    if(socket){
                        socket.json.send(msg);
                    }
                    const msgText = `Привет! Я ${bot.name}! Я умею отвечать на слова Привет, привет и хао. Это всё что я умею.`;
                    say(response, msgText);
                });
            }
            ,(err)=>{
                console.log(err);
            });
        });

        //обработчик остальных текстовых сообщений
        bot.onTextMessage(/./, (message, response) => {
            saveMessage(response, message.text, message.message_token, message.timestamp, true)
            .then((msg)=>{
                getSocketbyUserProfile(bot, response.userProfile)
                .then(socket=>{
                    if(socket){
                        socket.json.send(msg);
                    }
                });
            },(err)=>{

            });
        });

        return bot;
    };

    //сохранение сообщений из web морды
    const saveMessage = function (botId, user, msgText, msgTimestamp, isUser){
        isUser = isUser||false;
        msgTimestamp = msgTimestamp||(new Date).getTime();
        return new Promise((resolve, reject)=>{
            const message = new Message({user: user._id, bot: botId, message: msgText, token: null, timestamp: msgTimestamp, isUserMessage: isUser});
            message.save()
            .then((msg)=>{
                let conf = _app.get('config');
                const bot = conf.bots.filter((el)=>{return el.descr._id==botId;})[0];
                if(bot){
                    bot.instance.sendMessage(user.profile, new TextMessage(msgText))
                    .then((tokens)=>{
                        if(msg._id && tokens && tokens[0]){
                            return saveMessageToken(msg._id, tokens[0])
                        }
                    })
                    .then(()=>{
                        let socket = getSocket(botId, user._id);
                        if(socket){
                            socket.json.send(msg);
                        }
                        resolve(msg);
                    });  
                } else {
                    reject({err: 'Инстанс бота отсутствует'})
                }
            },err=>{
                console.log(err);
                reject(err);
            });
        });
    }

    //отправка сообщений в viber из web морды
    _self.sendTxtMessage = (botId, userId, message)=>{
        return User.getUserbyId(userId)
        .then((user)=>{
            return saveMessage(botId, user, message);
        },(err)=>{
            console.log(err);
        });
    };
    //установка webhook
    const setWebhook = (bot, url)=>{
        let conf = _app.get('config');
        conf.appAPI.use('/'+url,bot.middleware());
        bot.setWebhook(process.env.WEBHOOK_URL+url)
        .then(()=> {},
        (err)=> {
            console.log(err);
        });
    };
    //создание бота
    const createBot = (bot, doc)=>{
        let conf = _app.get('config');
        setWebhook(bot, doc.webhookURL);
        conf.bots.push({descr:doc, instance:bot});
        conf.appAPI.set('config',conf);
    }

    //загрузка ботов
    _self.loadBots = ()=>{
        Bot.find()
        .then((docs)=>{
            docs.forEach(function(doc){
                const bot = new ViberBotInstance(doc.name, doc.paToken, doc._id);
                createBot(bot, doc);
                
            });
        });
    };

    _self.getBots = ()=>{
        return Bot.find();
    };

    _self.getBot = (id)=>{
        return Bot.findOne({_id:id});
    };

    //метод создание нового бота
    _self.createNewBot = (data)=>{
        const doc = new Bot(data);
        return new Promise((res,rej)=>{
            doc.save()
            .then(()=>{
                const bot = new ViberBotInstance(doc.name, doc.paToken, doc._id);
                createBot(bot, doc);
                return res(doc);
            },
            (err)=>{
                //console.log(err.errors);
                let errorsKeys = Object.keys(err.errors);
                let errors = errorsKeys.map(function(el){ return err.errors[el].message}).join(' ');
                return rej(errors);
            });
        });
    };
    //метод список пользователей
    _self.getUsers = ()=>{
        return User.find();
    };
    //метод список ботов по пользователю
    _self.getUserBots = (userId)=>{
        return User.findOne({_id:userId})
        .then(user=>{
            const botIds = user.bots;
            return Bot.find({_id:{ $in:botIds}});
        });
    };
    //метод список сообщений по пользователю и боту
    _self.getUserBotMessages = (botId, userId)=>{
        return Message.getUserBotMessages(botId, userId);
    };
    
    return _self;
};

module.exports = ViberBotAPI;