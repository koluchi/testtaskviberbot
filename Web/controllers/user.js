var UserController = function (_app) {
    const botAPI = require('../../code/viberbot/index.js')(_app);
    let self = {};
    self.index = function (req, res) {
        if(req.query.load){
            
            botAPI.getUsers()
            .then((users)=>{
                res.send({users:users});
            }, 
            (err)=> {
                res.status(400).send({err: err});
            });
        } else {
            res.render('users', { users: [] });
        }
    };
    self.getUserBots = function (req, res) {
        if(req.query.userId){
            botAPI.getUserBots(req.query.userId)
            .then((bots)=>{
                res.send({bots:bots});
            }, 
            (err)=> {
                res.status(400).send({err: err});
            });
        } else {
            res.status(400).send({err: 'Отсутствует userId!'});
        }
    };

    self.getUserBotMessages = function (req, res) {
        if(req.query.userId && req.query.botId){
            botAPI.getUserBotMessages(req.query.botId, req.query.userId)
            .then((msgs)=>{
                res.send({msgs:msgs});
            }, 
            (err)=> {
                res.status(400).send({err: err});
            });
        } else {
            res.status(400).send({err: 'Отсутствует userId/botId!'});
        }
    };

    self.sendMessage = function (req, res) {
        if(req.body.msg && '' != req.body.msg && req.body.userId && req.body.botId){
            botAPI.sendTxtMessage(req.body.botId, req.body.userId, req.body.msg)
            .then((data)=>{
                res.status(201).send({  });
            },
            (err)=>{
                res.status(400).send({err: err});
            });
        } else {
            res.status(400).send({err: 'Пустое сообщение/userId/botId!'});
        }
        
    };

    return self;
};

module.exports = UserController;