const express = require("express");
const app = express();
const port = 3002; // <- 3000에서 다른 숫자로 변경
const cors = require("cors");
const bodyParser = require("body-parser");
const dbquery = require("./dbquery.js");
const session = require('express-session');
const mySqlStore = require('express-mysql-session')(session);
const http = require('http');
const socketIO = require('socket.io');
const { Socket } = require("socket.io-client");
const server = http.createServer(app);
const { instrument } = require("@socket.io/admin-ui");
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "https://admin.socket.io"],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

instrument(io, {
  auth: false,
  mode: "development",
});

var options = {
  host: "dev-ssu.com",
  port: "323",
  user: "dongcar",
  password: "qwer1234",
  database: "DongCar",
}
var sessionStore = new mySqlStore(options);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: ["http://localhost:3000", "https://admin.socket.io"] }));
app.use(bodyParser.json());

app.use(session({
  secret: '12345',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
  store: sessionStore
}))

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/register", (req, res) => {
  dbquery.register(req, res);
});

app.post("/login", (req, res) => {
  dbquery.login(req, res, (result) => {
    if (result.status === "success" || result.status === "nickNull") {
      req.session.user = { email: req.body.email };
      req.session.save(() => {});
    }
    res.json(result);
  });
});

app.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {});
  }
  else {
    res.send('제거할 세션이 없습니다.');
  }
})

app.post("/setNick", (req, res) => {
  dbquery.nickname(req, res);
})

app.post("/chatlist", (req, res) => {
  dbquery.chatlist(req, res, (result) => {
    res.send(result.data);
  });
})

app.post("/createchat", (req, res) => {
  dbquery.createchat(req, res, () => {
    res.send(res);
  });
})

app.post("/management", (req, res) => {
  dbquery.management(req, res, (result) => {
    res.send(result.data);
  });
})

const chat = io.of('/chat');

chat.on('connection', (socket) => {

  socket.on('join', (chatRoomId) => {
    socket.join(chatRoomId);
  });

  socket.on('clientSendMessage', (data) => {
    socket.to(data.roomId).emit('serverSendMessage', data.message, socket.id, data.senderNickname);
  });

  socket.on('exit', (data) => {
      socket.leave(data);
  })

});

app.post("/mychat", (req, res) => {
  dbquery.mychat(req, res, (result) => {
    res.send(result.data);
  });
})

app.get("/getNickname", (req, res) => {
  dbquery.getNickname(req, res, (result) => {
    res.send(result);
  });
})

app.post("/joinchat", (req, res) => {
  dbquery.joinchat(req, res);
})

app.post("/roomout", (req, res) => {
  dbquery.roomout(req, res);
})

app.post("/storechat", (req, res) => {
  dbquery.storechat(req, res);
})

app.post("/loadchat", (req, res) => {
  dbquery.loadchat(req, res, (result) => {
    res.send(result.data);
  })
})

app.post("/changepw", (req, res) => {
  dbquery.changepw(req, res);
})

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});