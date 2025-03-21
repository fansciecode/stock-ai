const notificationSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Notification socket connected:", socket.id);

        socket.on("sendNotification", ({ userId, message }) => {
            io.to(userId).emit("newNotification", message);
        });

        socket.on("disconnect", () => {
            console.log("Notification socket disconnected:", socket.id);
        });
    });
};

export default notificationSocket;
