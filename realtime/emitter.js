let ioInstance = null;

const setIO = (io) => { ioInstance = io; };

const toUser = (userId, event, payload) => {
    if (!ioInstance || !userId) return; // safe no-op until socket.io is wired
    ioInstance.to(`user:${userId}`).emit(event, payload);
};

const broadcast = (event, payload) => {
    if (!ioInstance) return;
    ioInstance.emit(event, payload);
};

module.exports = { setIO, toUser, broadcast };