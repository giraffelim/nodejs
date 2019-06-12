// WAS를 위한 모듈 express 추출
var express = require("express");
// 템플릿 엔진
var ejs = require('ejs');
//DB
var mysql = require("mysql");
//FileStream
var fs = require("fs");
//post방식의 request 데이터 추출 모듈
var bodyParser = require('body-parser');

//소켓 통신을 위한 소켓 모듈 추출
var socketio = require("socket.io");


//서버를 생성
var app = express();

var http= require("http").Server(app);

app.use("/css",express.static("css"));
app.use(bodyParser.urlencoded({extended:false}));

var io = socketio.listen(http);

io.sockets.on('connection',function(socket){
    //message 이벤트
    socket.on('message',function(data){
        //클라이언트의 message 이벤트를 발생시킨다 (브로드캐스팅)
        io.sockets.emit('message',data);
    });
});

//DB 연결
var client = mysql.createConnection({
    user : "root",
    password : "7738",
    database : "taeyang"
});

//서버를 실행
http.listen(52273,function(){
    console.log("server running at http://127.0.0.1:52273");
});

app.get('/chat',function(request,response){

    //FILE READ
    fs.readFile("chat.html","utf8",function(error,data){
        response.send(data);
    });
});

//라우트(url 이동), boardList
app.get('/',function(request,response){

    //FILE READ
    fs.readFile('board_list.html','utf8',function(error,data){
        //쿼리수행
        client.query("select * from board order by id desc",function(error,result){
            response.send(ejs.render(data,{
                data : result
            }));
        });
    });
});

//List에서 Title을 클릭했을경우
app.get('/view/:id',function(request,response){
    fs.readFile('board_view.html','utf8',function(error,data){
        console.log(error);
        //게시글 정보 가져오기
        client.query("select * from board where id=?",[request.params.id],function(error,result){
            //댓글 리스트 가져오기
            client.query("select * from reply where bNo=?",[request.params.id],function(error,rResult){
                console.log("reply select error: "+error);
                console.log("result: "+rResult);
                response.send(ejs.render(data,{
                    data : result[0],
                    rData : rResult
                }));
            });
        });
    });
});

//등록 링크를 눌렀을 때
app.get('/insert',function(request,response){
    fs.readFile('board_insert.html','utf8',function(error,data){
        response.send(data);
    });
});

//등록 페이지에서 등록 버튼을 눌렀을경우
app.post('/insert',function(request,response){
    client.query("insert into board(title,content,wdate) values(?, ?, ?)",[request.body.title,request.body.content,request.body.wdate],function(error,data){
        response.redirect("/");
    });
});

//삭제 버튼을 클릭했을경우
app.get('/delete/:id',function(request,response){
    client.query("delete from board where id=?",[request.params.id],function(error,data){
        response.redirect("/");
    });
});

//상세보기에서 수정버튼을 클릭했을경우
app.get("/update/:id",function(request,response){
    fs.readFile("board_update.html","utf8",function(error,data){
        client.query("select * from board where id=?",[request.params.id],function(error,result){
            response.send(ejs.render(data,{
                data : result[0]
            }));
        });
    });
});

//수정화면에서 submit 버튼을 클릭했을경우
app.post("/update/:id",function(request,response){
    client.query("update board set title=?, content=?, wdate=?",[request.body.title,request.body.content,request.body.wdate],function(error,data){
        console.log(request.body.id);
        response.redirect("/view/"+request.body.id);
    });
});

//댓글 등록
app.post("/replyInsert/:id",function(request,response){
    client.query("insert into reply(bNo,writer,pass,content) values(?,?,?,?)",[request.body.id,request.body.reName,request.body.rePass,request.body.reContent],function(error,result){
        console.log(error);
        response.redirect("/view/"+request.body.id);
    });
});

//댓글 삭제
app.get("/replyDelete/:no,:id",function(request,response){
    client.query("delete from reply where no=?",[request.params.no],function(error,result){
        response.redirect("/view/"+request.params.id);
    });
});