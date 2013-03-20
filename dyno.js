var s, dyno = {
        settings : {
                isIe : false,
                page : false,
                cacheSeparator : '-cache',
                cacheEnable : false
        },
        init: function() {
                s = this.settings;

                this.before();
                this.cacheElements();
                this.bindUIActions();
        },
        before : function(){  /*runs after init and before everything*/
                s.isIe = $('html').hasClass('ie9') || $('html').hasClass('ie8') || $('html').hasClass('ie7');
        },
        cacheElements: function () { /*cache jQuery objects*/
                this.$nav = $('.home-icons');
                this.$container = $('.content');
                this.$cache = $('#ajax-cache');
                this.$loader = $('#loader');
        },
        bindUIActions: function() { /*bind user event handlers*/

                if(s.isIe) {

                        window.onhashchange = function() {
                                dyno.load(window.location.hash.substr(1) + '?rand=' + new Date().getTime());
                        };
                } else {
                        window.onpopstate = function(event) {

                                if(s.page ) {
                                        dyno.load(location.pathname);
                                }
                        };
                }
        },
        loadContent : function(){

                var href = $(this).attr('href');

                if(!s.isIe) {

                        if(href === location.pathname){
                                return false;
                        }
                        dyno.load(href);

                } else {
                        window.location.hash = href;
                }

                return false;
        },
        loadPage : function(handler){
                dyno.loadContent.call(handler);
                return false;
        },
        initCallBack : function(hash){
                //trigger some function according to the hash
        },
        load : function(href){
                var cont = dyno.$container,
                        $self =   $("a[href='" + href + "']").first(),
                        hash = $self.data('hash'),
                        $cacheBlock = this.$cache.find('#'+ hash + s.cacheSeparator);

                if(cont.hasClass('loading')){
                        return false;
                }

                if(!s.isIe){
                        history.pushState('', 'New URL: '+href, href);
                        s.page = true;
                }

                cont.addClass('loading');

                dyno.setActiveIcon(href);

                var callBack  = dyno.initCallBack(hash);

                cont.animate({
                        'opacity':0,
                        'top':-150
                }, 400, function () {
                        dyno.toogleLoader();
                });

                if(s.cacheEnable === true && $cacheBlock.length > 0){ /*get the same data as ajax response from cache*/
                        var data = this.parseCache($cacheBlock);

                        dyno.animateInsert(data.html, href, callBack);
                        return false;
                }

                $.ajax({  /*if not cached get content via ajax*/
                        url : href,
                        type : 'GET',
                        dataType : 'json',
                        cache : true,
                        success :function(data){

                                if( s.cacheEnable === true ){
                                        dyno.cacheHtml( data, hash );
                                }

                                if( data.css ){
                                        dyno.addCss(data.css);
                                }

                                if( data.scripts ){
                                        dyno.addScripts(data.scripts);
                                }

                                dyno.animateInsert( data.html, href, callBack);

                        },
                        error : function(msg){

                                cont.removeClass('loading');
                                dyno.toogleLoader();
                        }

                });

                return false;

        },
        animateInsert : function( html, href, callback ){
                var $cont= dyno.$container;

                $cont.promise().done(function () {
                        $cont.empty();

                        dyno.toogleLoader();

                        $.each(html, function(key, value){
                                $(key).html(value);
                        });

                        $cont.animate({
                                'opacity':1,
                                'top':0
                        }, 400, function () {
                                if( typeof callback === 'function'){
                                        callback($cont);
                                }
                                $cont.removeClass('loading');
                        });

                });
        },
        cacheHtml : function(data,hash){
                var $container;

                $container = $('<div>',{
                        id : hash + s.cacheSeparator
                });

                $.each(data.html, function(key, value){
                        $('<div>',{
                                'data-key' : key
                        }).html(value).appendTo($container);
                });

                this.$cache.append($container);

        },
        parseCache : function($html){
                var data = {},
                        $html = $html.children();


                data.html = this.htmlToArray($html);
                return data;
        },
        setActiveIcon : function(href){
                var activeIcon = this.$nav.find("a[href='" + href + "']");

                this.$nav.find('a.active').removeClass('active');
                if( activeIcon.length > 0 ){

                        activeIcon.addClass('active');
                }
        },
        htmlToArray : function($html){
                var html = {};

                $.each($html, function( key, value ){
                        html[$(value).attr('data-key')] = $(value).html();
                });

                return html;
        },
        addScripts : function( scriptsArr, callback){

                for (var key in scriptsArr) {
                        $.getScript(scriptsArr [key]);
                }

                if(typeof callback === 'function'){
                        callback();
                }

        },
        addCss : function(cssArr){

                for (var key in cssArr) {

                        var val = cssArr [key];

                        if($('head').find("link[href='"+ val + "']").length > 0){
                                return false;
                        } else {
                                $("head").append("<link>");

                                var css = $("head").children(":last");

                                css.attr({
                                        rel:  "stylesheet",
                                        type: "text/css",
                                        href: val
                                });
                        }
                }
        },
        toogleLoader : function(){
                var loader  = dyno.$loader;

                if(loader.is(':visible')){
                        loader.hide();
                } else {
                        loader.show();
                }
        }

}

$(function(){
        dyno.init();
});