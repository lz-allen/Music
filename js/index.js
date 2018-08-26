/**
 * Created by lzf_allen on 2017/8/3.
 */
//1.歌词页
//2.控制频道
//3.随机播放
//4.事件绑定
//4。默认行为样式+用户选项
//5。微博分享
//6。播放控制，循环
//7.图片加载
//8.歌曲进度条
function Music(ele){
    this.target=ele;
    this.songInfo={
        chanel:""
    };
    this._init();
}
Music.prototype={
    _init:function(){
        this._preset();
        this._bind();
        this._getSong();
        this._getChanel();
        this._choseChanel();
        this._loadLike();
    },
    _bind: function () {
        var self = this;
        setInterval(function(){
            self._preset();
        },500);
        var $topListTitle = $('#music .topList-title');
        var $myLike = $('#music .myLike');
        var $yypd = $('#music .yypd');
        var $lyric = $('#music .lyric');
        var $picture = $('#music .picture');
        var $needle = $('#music .needle');
        var $play=$('#music .controller .play');
        var $next=$('#music .controller .next');
        $topListTitle.hide();
        $myLike.hide();
        $yypd.hide();
        $lyric.hide();
        //控制topListTitle
        $('#music .icon-gongneng').on('click', function () {
            $topListTitle.slideToggle();
            if ($myLike.css('display') == 'block')
                $myLike.hide();
            if ($yypd.css('display') == 'block')
                $yypd.hide();
        });
        //控制收藏和音乐频道
        $('#music .topList .topList-title li').click(function () {
            if ($(this).hasClass('l1')) {
                if($myLike.css('display')=='block')
                    $myLike.hide();
                else
                    $myLike.show();
                $yypd.hide();
            }
            else {
                if ($yypd.css('display') == 'block')
                    $yypd.hide();
                else
                    $yypd.show();
                $myLike.hide();
            }
        });
        //控制歌词
        $('#music .button-groups .geci').click(function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                $picture.hide();
                $lyric.show();
                $needle.hide();
            }
            else {
                $(this).removeClass('active');
                $picture.show();
                $lyric.hide();
                $needle.show();
            }
        });
        //控制单曲循环

        $('#music .button-groups .xunhuan').click(function () {
            if (self.target.getAttribute('loop')) {
                $(this).removeClass('active');
                self.target.removeAttribute('loop', 'loop');
            }
            else {
                $(this).addClass('active');
                self.target.setAttribute('loop', 'loop');
            }
        });
        //控制收藏和本地存储
        $('#music .button-groups .like').click(function () {
            if ($(this).hasClass('active')) {
                var removeName='[title='+self.songInfo.title+']';
                $(this).removeClass('active');
                self._removeItem();
                $('#music .myLike li').remove(removeName);
            }
            else {
                $(this).addClass('active');
                self._saveItem();
                $myLike.append("<li title='" + self.songInfo.title + "'>" + self.songInfo.title + "</li>");
            }
        });
        //单击收藏列表，控制歌词显示及加载歌曲
        $('#music .topList .myLike').on('click',function(e){
            if(e.target.tagName.toLowerCase()!='li') return;
            self.songInfo=self._localParse(e.target.title);
            $('#music .lyric-list').empty();
            self._getLyic();
            self._loadSong();
        });
        //控制播放、暂停
        $play.click(function(){
            self._playPause();
        });
        $next.click(function(){
           self._getSong();
        });
        //调整进度
        $('#music .controller .progress-bar').click(function(e){
            var distance= e.clientX-$(this).offset().left;
            if(distance<0)
            distance=0;
            var percentage=distance/$(this).width();
            self.target.currentTime=percentage* self.target.duration;
        });
        //鼠标按下拖动歌曲进度
        $('#music .controller .progress-bar .color-bar .circle').on('mousedown',function(){
            $('#music .controller .progress-bar').on('mousemove',function(e){
                var distance= e.clientX-$(this).offset().left;;
                var maxWidth=$(this).width();
                var $colorBar=$('#music .controller .color-bar');
                var percentage=distance/$(this).width();
                if(distance<0)
                    distance=0;
                if(distance>=maxWidth)
                    distance=maxWidth;
                $colorBar.width(distance);
                self.target.currentTime=percentage* self.target.duration;
            });
        });
        $('#music .controller .progress-bar .color-bar .circle').on('mouseup',function(){
            $('#music .controller .progress-bar').unbind('mousemove');
        });
        $('#music .controller .progress-bar').mouseleave(function(){
            $('#music .controller .progress-bar').unbind('mousemove');
        })
    },
    //进度条自动走动
    _preset:function(){
        var length=this.target.currentTime/this.target.duration*100;
        $('#music .controller .progress-bar .color-bar').width(length+'%');
        if(length==100)
        this._getSong();
    },
    //向api发出请求、获取请求
    _getSong:function(){
        var self=this;
        $.ajax({
            url:"http://api.jirengu.com/fm/getSong.php",
            method:"get",
            dataType:"json",
            data:{channel: self.songInfo.channel}
        }).done(function(e){
            var ret= e.song[0];
            self.songInfo.sid=ret.sid;
            self.songInfo.title=ret.title;
            self.songInfo.picture=ret.picture;
            self.songInfo.artist=ret.artist;
            self.songInfo.url=ret.url;
            $('#music .lyric-list').empty();
            $('#music .button-groups .like').removeClass('active');
            self._getLyic();
            self._loadSong();
        }).fail(function(e){
            self._getSong();
        });
    },
    _choseChanel:function(){
        var self=this;
        $('#music .topList .yypd').on('click',function(e){
            if(e.target.tagName.toLowerCase()!='li'|| !e.target.hasAttributes('channel_id')) return;
            self.songInfo.chanel= e.target.getAttribute('channel_id');
            self._getSong();
        });
    },
    _getChanel:function(){
        var self=this;
        $.ajax({
           url:"http://api.jirengu.com/fm/getChannels.php",
            dataType:"json",
            method:"get",
        }).done(function(e){
            var ret= e.channels;
            ret.forEach(function(e){
                self._loadChanel(e);
            });
        }).fail(function(){
            $('#music .topList .yypd').append('<li>网络错误</li>');
        });

    },
    _loadLike:function(){
        for(var i=0;i<localStorage.length;i++){
            $('#music .topList .myLike').append("<li title='" + localStorage.key(i)+  "'>" + localStorage.key(i) + "</li>");
        }
    },
    _loadChanel:function(e){
        $('#music .topList .yypd').append('<li channel_id='+ e.channel_id+'>'+ e.name+'</li>');
    },
    _playPause:function(){
        if(this.target.paused){
            $('#music .controller .play').html('&#xe600;');
            this.target.play();
            $('#music .picture img').removeClass('img-stop');
            $('#music .needle').removeClass('needle-move');
        }
        else {
            $('#music .controller .play').html('&#xe875;');
            this.target.pause();
            $('#music .picture img').addClass('img-stop');
            $('#music .needle').addClass('needle-move');
        }
    },
    _loadSong:function(){
        var shareAddress = 'http://service.weibo.com/share/share.php?appkey=&title=我在属于自己的私人FM听\/'+
            this.songInfo.title + '\/快来欣赏吧！&pic=' +this.songInfo.picture + '&searchPic=true&style=simple';
        $('#music .picture img').attr('src',this.songInfo.picture);
        $(this.target).attr('src',this.songInfo.url);
        $('#music .header .musicName').text(this.songInfo.title);
        $('#music .header .author').text(this.songInfo.artist);
        $('#music .header .icon-fenxiang').attr('href',shareAddress);
        $('#music .button-groups .xiazai').parent().attr('href',this.songInfo.url);
        if(localStorage.getItem(this.songInfo.title))
            $('#music .button-groups .like').addClass('active');
    },

    _getLyic:function(){
        var self=this;
        $.ajax({
            url:"http://api.jirengu.com/fm/getLyric.php",
            method:"get",
            dataType:"json",
            data:{sid:self.songInfo.sid}
        }).done(function(e){
            self._loadlyic(e.lyric);
        }).fail(function(){
            $('#music .lyric .lyric-list').append('<li>抱歉没有，此歌没有歌词!</li>');
        });
    },
    _loadlyic:function(e){
        var self=this;
        var lyric=this._parseLyic(e);
        console.log(lyric);
        var item="";
        lyric.forEach(function(i){
            item+='<li dataTime="'+i[0]+'">'+i[1]+'</li>';
        });
        $('#music .lyric .lyric-list').append(item);
        self.target.addEventListener('timeupdate',function(){
            var liH= $('#music .lyric .lyric-list li').eq(1).outerHeight();
            for(var i=0;i<lyric.length;i++){
                var curT=$('#music .lyric .lyric-list li').eq(i).attr('dataTime');
                var nextT=$('#music .lyric .lyric-list li').eq(i+1).attr('dataTime');
                var curTime=self.target.currentTime;
                if(curTime>curT&&curTime<nextT){
                    $('#music .lyric .lyric-list li').removeClass('active');
                    $('#music .lyric .lyric-list li').eq(i).addClass('active');
                    $('#music .lyric .lyric-list').css({
                        "top":-liH * (i - 2),
                        "transition": "1s"
                    });
                }
            }

        });
    },
    _parseLyic:function(e){
        var lines = e.split("\n"),
            pattern = /^\[\d{2}\:\d{2}\.\d{2}\]/;
        var lyricArr = [];
        lines.forEach(function (i) {
            if (!pattern.test(i)) {              //剔除收到数据中没有时间的部分
                lines.splice(i, 1);
                return;
            }
            console.log(i);
            var time = i.match(pattern);       //把歌词分为：时间和歌词两个部分
            var lyric = i.split(time);
            console.log(time);
            var seconds = time[0][1] * 600 + time[0][2] * 60 + time[0][4] * 10 + time[0][5] * 1;  //将时间换算为秒
            lyricArr.push([seconds, lyric[1]]);      //将整个歌词保存至二维数组中，形式为[时间，歌词]；
        });
        return lyricArr;
    },
    _localParse:function(key){
        return JSON.parse(window.localStorage.getItem(key));
    },
    _removeItem:function(key){
        window.localStorage.removeItem(key);
    },
    _saveItem:function(){
        window.localStorage.setItem(this.songInfo.title,JSON.stringify(this.songInfo));
    },
};

var myAudio=document.getElementsByTagName('audio')[0];
var a=new Music(myAudio);


