x�Xm����_�_1+E�n�hK��U/�RRi?�9�d׋3�<B���s��ؓ�@[�ᮔ�}���L�M��=x�M��52��mg�x&ޘ�z����4��;U��U4m�Fg�S�k����֢Vڔ���:�̘*2W]�J�ŋ�k�44��c��Lۉ�N���*�F�ľ6WĕdO��&�H-��ϟŧ�Iw��گ�`�rzv۵�Ԛ^�,�;�m�J����\��d�B-w���T�x�� ����i|��Q�U���|G�a؎)ǣ�f�)1��hR��4�Yd�ɹ��MY��Zϊ՘>N~����8�tc�����:��ǡ�̋����qqR���4�����Ϥ�`���r���r{�؏�SL�i�,qd�=H�D���2�Y*�/�%W�*��+y���!m2!X�;�ۦ6iR(WY��'o�e���0�@߻�ܤ'�S�O*ij����n}(;���
�#Pm�KЦ��U�~6��J�vM�P�Ի����Z�n�eu��a���_(vVVk_� �U��n72��o�G�l=�ǈ�n�_4�|�-42�o�ɻ|'��83'�x��(4�$A��M=�P��M9�э�9�q�RLWoR��Ynr�z2�[bD��2}h�1��^��.�4ӈa���h��(�"�Q!x#v��|��W�((��;b�c>�d#�C����hDCYbSU����cϣ�s�Βo-�溭�m�܇׶�Y�\%YND
���!�b��o�EN�r��)�pF���M��͹X+�B��������3�x��Z��y�hr�щ_ԺV�9X�HЙ1��
�`J��d�%����^Ξ��a�JXPs����q�,0���'��P�|qdyz30	YC�.�9�B,6�X��kk�_Ugm'.�]�n��uv`��4�����`��TC>h.Vl�-�;���#��i΂��<.y �2��7���W�)�p��B�P}�80���(M��q���#��)�`�.�r�c9�H�݉5��L'���M��Lu~)y��m��K3:Um�ۨ���=�˜�Z��u#S�>���U�5��p���Z?�@�)����/|���X_|(��G��uW_�4��'Dd���n�xŧ�P�=wR\�4/hf*x ��$�;���+���]�����7���3T�vF����ZV&�ǫc���$7�)bDGf;;�BY;��u/�ݥ��b�DC��1��$�@�F��1�7���#YLq���A����Մ�d7T��W:�+.��R��$��G�����]
�G�C����5��D�Zɏ��|��w*>�d�9��=)ޞ��^"xc��_>�X�s�X�A�qH���������i%o1F[N&��t��b/�ԺzK�iL)��u��U��)�6�ƍ���H/f�=�g���F�L�i)S<f" ����L�K-�m��ؔ������E�q���;V%k��ۢH�b��.ë��2t�gE��. L+Rjy�(�]�V6�N���Xҍl:���B�F����[Ύǳ��яK�b�u���1��;KDR���6�|�
�5@�lT�v�(`!��fx���U�U�y>�3#=3�q��4=�����R��q���>�|P�����Y�g��!��E��(h�+:�J%�"G �b��4�y��O��4���]�q�Q��T7<���rL ���6�36���8�K��~-q�DH�|��gT�FH 5~�Y���L%E��l=��ԯ�{�^�ֳ��!�9�֜%�aAn�${
�~�	(ɽ9?y���mz�E��)�oV�/#�{ڇ���a�0C�l��`R�ës�Eo$� ��!(H�5Y�#B:�˝����R�BA��WG���200h^��.j9A\6�c�z��&$^B�K/a�U響0�}hl��lG���N�����H��lw��'-��g����^t:��v��?������ ���"~ɗ؃)+��a�0�|�                                                          ion (req, res) {
        res.redirect('/web');
    });
    app.use('/web', web);
    
    var loadBots = function(){
        var botAPI = require('./code/viberbot/index.js')(app);
        botAPI.loadBots();
    };

    io.sockets.on("connection", function(socket){
        socket.on("registerChat",function(data){
            let _self = this;
            let conf = app.get('config');
            conf.sockets.push({socket:_self, botId: data.botId, userId: data.userId});
            app.set('config', conf);
            _self.emit('registered');
        });
        socket.on("disconnect", function(){
            let _self = this;
            let id = _self.id;
            console.log('socket id:'+ id + ' disconnected');
            let conf = app.get('config');
            let index = conf.sockets.findIndex(function(el){return el.socket.id == id;});
            conf.sockets.splice(index, 1);
            app.set('config', conf);
        });
    });

    var listen = function(){
        app.set('port', 8080);//process.env.PORT ||3000);

        server.listen(app.get('port'), function() {
            loadBots();
        });
    }

    listen();

    
    return app;
})();
module.exports = host;
