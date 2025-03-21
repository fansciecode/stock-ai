const chatSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("joinRoom", ({ roomId }) => {
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        socket.on("sendMessage", ({ roomId, message }) => {
            io.to(roomId).emit("newMessage", message);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};

export default chatSocket;
