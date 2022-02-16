const { comprobarJWT } = require("../helpers/jwt");
const {
  usuarioConectado,
  usuarioDesconectado,
  grabarMensaje,
  getUsuarios,
} = require("../controllers/sockets");
const { Socket } = require("socket.io");

class Sockets {
  constructor(io) {
    this.io = io;

    this.socketEvents();
  }

  socketEvents() {
    // On connection
    this.io.on("connection", async (socket) => {
      console.log("--------------------");
      console.log("Conectado Cliente: " + socket.id);

      // ********************************************* /
      // ************ Validarciones Socket ********** /
      // ********************************************* /

      // Validar el JWT
      // Si el token no es válido, desconectar
      const [valido, uid] = comprobarJWT(socket.handshake.query["x-token"]);
      console.log("uid", uid);

      if (!valido) {
        console.log("socket no identificado");
        return socket.disconnect();
      }

      // Conectar usuario que usuario está activo mediante el UID
      await usuarioConectado(uid);

      // Limpiar sala room="uid" si existe y es socketID no esta en ella
      // evitar mutiples intancias de un mismo usuario en el front
      let socketsCurrent = this.io.sockets;
      let roomsCurrent = socketsCurrent.adapter.rooms;
      if (roomsCurrent.has(uid) && !roomsCurrent.get(uid).has(socket.id)) {
        // eliminar y desconectar todos los socket de la room uid
        roomsCurrent.get(uid).forEach(function (socketID) {
          socketsCurrent.sockets.get(socketID)?.leave(uid);
          socketsCurrent.sockets.get(socketID)?.disconnect();
        });
      }

      // Unir al usuario a una sala de socket.io
      // Socket join, uid
      socket.join(uid);

      // ********************************************* /
      // ************Eventos CHATAPP ******************** /
      // ********************************************* /

      //* EMIT //
      // Emitir todos los usuarios conectados
      this.io.emit("lista-usuarios", await getUsuarios());

      //* ON //
      // Escuchar cuando el cliente manda un mensaje
      socket.on("mensaje-personal", async (payload) => {
        const mensaje = await grabarMensaje(payload);
        console.log(`de:${payload.de}para:${payload.para} `);
        this.io.to(payload.para).emit("mensaje-personal", mensaje);
        this.io.to(payload.de).emit("mensaje-personal", mensaje);
      });

      // Escuchar usuario desconectado del socket Disconnect
      socket.on("disconnect", async () => {
        // Marcar en la BD que el usuario se desconecto
        await usuarioDesconectado(uid);
        // Emitir todos los usuarios conectados
        this.io.emit("lista-usuarios", await getUsuarios());
        console.log("Desconectado Cliente: " + socket.id);
      });
    });
  }
}

module.exports = Sockets;
