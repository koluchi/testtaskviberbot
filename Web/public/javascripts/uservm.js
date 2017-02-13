App = {};

App.Message = (function(ko){
    var entity = function(data){
        var mapping = {};
        ko.mapping.fromJS(data, mapping, this);
    }
    return entity;
})(ko);

App.Bot = (function(ko){
    var entity = function(data){
        var mapping = {};
        ko.mapping.fromJS(data, mapping, this);
        var self = this;
        self.info = ko.pureComputed(function(){
            return self.name();
        });
    }
    return entity;
})(ko);

App.User = (function(ko){
    var entity = function(data){
        var mapping = {};
        ko.mapping.fromJS(data, mapping, this);
        var self = this;
        self.botName = ko.observable(null);
        self.info = ko.pureComputed(function(){
            return self.profile.name() + (!self.botName() ? '' : '->' + self.botName());
        });
        self.isSelected = ko.observable(false);
        
    }
    return entity;
})(ko);

App.viewModel = (function(ko){
    var model = {};
    model.errMsg = ko.observable(null);
    model.users = ko.observableArray([]);
    model.bots = ko.observableArray([]);
    model.messages = ko.observableArray([]);
    model.curUser= null;
    var curBot= null;
    model.socket = ko.observable(null);
    model.msgText = ko.observable('');
    
    model.loadData = function(cb){
        $.ajax({
            url:'/web/users',
            data:{load:true},
            dataType:'json',
            contentType:'application/json',
            cache: false
        }).done(function(data){
            model.messages.removeAll();
            model.bots.removeAll();
            curBot= null;
            model.curUser= null;
            model.users(data.users.map(function(el){return new App.User(el);}));
            cb();
        });
    };

    model.setCurUser = function(user){
        if(model.socket()){
            model.socket().socket.disconnect();
            model.socket(null);
        }
        
        model.users().forEach(function(el){ el.isSelected(false);});
        user.isSelected(true);
        model.curUser = user;
        //model.getBots();
    }

    model.getBots = function(item){
        var user = item || model.curUser;
        $.ajax({
            url:'/web/users/bots',
            data:{userId: ko.mapping.toJS(user)._id},
            dataType:'json',
            contentType:'application/json',
            cache: false
        }).done(function(data){
            model.messages.removeAll();
            curBot = null;
            model.bots(data.bots.map(function(el){return new App.Bot(el);}));
            user.botName(model.bots()[0].name());
        });
    };

    var scrollToBottom = function(id){
        var elem = document.getElementById(id);
        var top = elem.scrollHeight - elem.clientHeight;
        $(elem).stop().animate({
                scrollTop: top
        }, 200);
        
    }

    model.openChat = function(user){
        model.setCurUser(user);
        var socket = io();
        socket.on('connect',function(data){
            console.log('connect');
            console.log({userId: model.curUser._id(), botId: model.curUser.bots()[0]});
            socket.emit('registerChat',{userId: model.curUser._id(), botId: model.curUser.bots()[0]});
            console.log('send registerChat')
        });
        socket.on('registered',function(){
            console.log('registered')
            model.getMessages(function(){
                scrollToBottom('messages')
            });
        });
        socket.on('message', function(data){
            model.messages.push(new App.Message(data));
            scrollToBottom('messages');
        });
        socket.on('disconnect', function(data){
            console.log('disconnected')
            model.socket(null);
        });
        model.socket({userId: model.curUser._id, botId: model.curUser.bots()[0], socket: socket});
        
    }

    model.getMessages = function(cb){
        $.ajax({
            url:'/web/users/messages',
            data:{userId: model.curUser._id, botId: model.curUser.bots()[0]},
            dataType:'json',
            contentType:'application/json',
            cache: false
        }).done(function(data){
            model.messages(data.msgs.sort(function(a,b){return a.timestamp-b.timestamp;}).map(function(el){return new App.Message(el);}));
            cb();
        });
    };

    model.sendMessage =function(){
        if(model.msgText() == '')
            return;
        else 
            $.ajax({
                url:'/web/users',
                type:'post',
                data:{msg: model.msgText(),userId: model.curUser._id, botId: model.curUser.bots()[0]},
                dataType:'json',
                cache: false,
                beforeSend: function(){
                    model.errMsg(null);
                }
            }).done(function(data){
                model.msgText('');
            }).fail(function( jqXHR, textStatus ) {
                model.errMsg(jqXHR.responseJSON.err);
                console.log( jqXHR );
                console.log( "Request failed: " + textStatus );
            });
    };
    model.loadData(function(){
        model.users().forEach(function(el){
            model.getBots(el);

        });
    });

    
    return model;
})(ko);

ko.applyBindings(App.viewModel);

$(document).ready(function(){
    $('.message_input').on('keypress', function(event){
        if (event.which == 13 && !event.shiftKey) {
                event.preventDefault();
                $('.message_input').blur();
                $('.send_message').click();
                $('.message_input').focus();
                return false;
            }
    });
});