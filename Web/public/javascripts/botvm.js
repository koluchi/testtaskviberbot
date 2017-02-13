App = {};

App.Bot = (function(ko){
    var entity = function(data){
        var mapping = {};
        ko.mapping.fromJS(data, mapping, this);
    }
    return entity;
})(ko);

App.viewModel = (function(ko){
    var model = {};
    model.errMsg = ko.observable(null);
    model.bots = ko.observableArray([]);
    model.newBot = new App.Bot({name:'', paToken:'',webhookURL:''});;
    var clearNewBot = function(){
        model.newBot.name(''); 
        model.newBot.paToken('');
        model.newBot.webhookURL('');
    };
    
    model.loadData = function(){
        $.ajax({
            url:'/web/bots',
            data:{load:true},
            dataType:'json',
            contentType:'application/json',
            cache: false
        }).done(function(data){
            model.bots(data.bots.map(function(el){return new App.Bot(el);}));
        });
    };
    model.create =function(newItem){
        $.ajax({
            url:'/web/bots',
            type:'post',
            data:ko.mapping.toJS(newItem),
            dataType:'json',
            cache: false,
            beforeSend: function(){
                model.errMsg(null);
            }
        }).done(function(data){
            clearNewBot();
            model.loadData();
        }).fail(function( jqXHR, textStatus ) {
            model.errMsg(jqXHR.responseJSON.err);
            console.log( jqXHR );
            console.log( "Request failed: " + textStatus );
        });
    };
    model.loadData();
    return model;
})(ko);

ko.applyBindings(App.viewModel);