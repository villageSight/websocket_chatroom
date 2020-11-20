const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fs=require("fs");
let count=0,NickName=[];

app.use(express.static(__dirname));

app.get('/',function(req,res){
	res.sendFile(__dirname+"/"+'index.html','utf-8');
});

io.on('connection',function(socket){
	console.log("用户已登录");
	count++;                        //统计在线人数
	socket.on('nickname',function(nk,callback){
		if(NickName.indexOf(nk)==-1){
			NickName.push(nk);
			socket.nickname=nk;

			//统计在线人数，并广播出去
			socket.broadcast.emit('online_count',{'count':count,"username":NickName});
			socket.emit('online_count',{'count':count,"username":NickName});
			console.log('在线人数',NickName)
			//判断回调函数是否存在，存在则将数据返回给客户端
			if(callback && typeof callback =="function"){
				callback({status:0,"username":NickName});//status:0表示设置成功，1表示昵称已存在，设置失败
			}
		}else{
			if(callback && typeof callback =="function"){
				callback({status:1});//status:0表示设置成功，1表示昵称已存在，设置失败
			}
		}
	});

	//消息回发给客户端
	socket.on("postData",function(res){
		console.log(res);
		res.nickname=socket.nickname;
		socket.broadcast.emit("sendData",res);
		socket.emit("sendData",res);
	});

	//接受客户端发送的图片BASE64字符串
	socket.on('uploadImg',function(data){
		let Reg=/image\/.*/i;
		if(data['imgURL'].match(Reg)){
			socket.broadcast.emit("imgBack",data);
			socket.emit("imgBack",data);
		}
		return ;
	})

	//判断用户下线，下线则数组中移除该用户
	socket.on("disconnect",function(){
		count--;
		let index=NickName.indexOf(socket.nickname);
		NickName.splice(index,1);
		console.log("用户已下线",NickName);
		socket.broadcast.emit('online_count',{'count':count,"username":NickName});
		socket.emit('online_count',{'count':count,"username":NickName});
	});
});

server.listen(3000, () => {
  console.log('your node web server is listening on *:3000');
});