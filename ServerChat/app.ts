///<reference path='d.ts/socket.io/socket.io.d.ts' />

import socketio = require('socket.io');

class AssureNoteServer {
    io: SocketManager;
    room: string = 'room';
    constructor() {
        var self = this;
        this.io = socketio.listen(3002);
        this.io.sockets.on('connection', function (socket) {
            socket.join(self.room);
            console.log('id: ' + socket.id + ' connected');
            socket.emit('init', {id: socket.id, list: self.GetUserList()});
            socket.broadcast.emit('join', {id: socket.id, list: self.GetUserList()});
        });
        
        this.io.sockets.on('disconnect', function (socket) {
            socket.unjoin(self.room);
            console.log('id: ' + socket.id + ' leave');
            socket.broadcast.emit('leave', {id: socket.id, list: self.GetUserList()});
        });
    }

    GetUserList() {
        var res = [];
        var Clients: Socket[] = this.io.sockets.clients(this.room);
        for (var i in Clients) {
            res.push(Clients[i].id);
        }
        return res;
    }
}

new AssureNoteServer();
