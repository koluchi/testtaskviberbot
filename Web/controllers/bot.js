const BotController = function (_app) {
    const botAPI = require('../../code/viberbot/index.js')(_app);
    let self = {};
    self.index = function (req, res) {
        if(req.query.load){
            
            botAPI.getBots()
            .then((bots)=>{
                res.send({bots:bots});
            }, 
            (err)=> {
                res.status(400).send({err: err});
            });
        } else {
            res.render('bots', { bots: [] });
        }
    };
    self.create = function (req, res) {
        if('' == req.body.webhookURL){
            req.body.webhookURL = req.body.paToken.slice(0,10);
        }
        botAPI.createNewBot(req.body)
        .then((doc)=>{
            res.status(201).send({ bot: doc });
        },
        (err)=>{
            res.status(400).send({err: err});
        });
    };

    return self;
};

module.exports = BotController;