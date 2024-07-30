const net = require("net");

//Guardamos aqui las conexiones de los usuarios
const connections = new Map();

//

//En caso de error
const error = (err) => {
  console.log(err);
  process.exit(1); //Mata el proceso. Código de salida 1: Sale de la ejecución con error.
};

const userRegistered = (username) => {
  const usernames = [...connections.values()];
  return usernames.includes(username);
};

const sendMessage = (message, originClient) => {
  const clients = [...connections.keys()];
  clients.forEach((client) => {
    if (client !== originClient)
      client.write(`[${connections.get(originClient)}]: ${message}`);
  });
};

const listen = (port) => {
  //Instanciamos el servidor
  const server = new net.Server();

  //Servidor en escucha
  server.listen({ host: "0.0.0.0", port: port }, () => {
    console.log(`Listening on port ${port}`);
  });

  //Si hay algun problema con el servidor. Por ejemplo si el servidor ya está en escucha en X puerto y ese puerto se intenta utilizar para escuchar otro proceso.
  server.on("error", (err) => error(err.message));

  //Cuando recibamos una conexión, vamos a recibir un socket (IP:PUERTO) de la maquina que se ha conectado.
  server.on("connection", (socket) => {
    const remoteSocket = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`New connection from ${remoteSocket}`);

    //Cuando recibamos información de la máquina conectada
    //Establecemos la codificación utf-8 ya que la máquina conectada está enviando bytes (buffer)
    socket.setEncoding("utf-8");
    socket.on("data", (message) => {
      //Si el socket no está en el map de conexiones significa que es el primer mensaje que ha mandado ese socket. Su primer mensaje según nuestro protocolo será su nombre de usuario.
      //Además, si el username no está registrado, entonces almacenamos el socket en el map de conexiones.
      if (!connections.has(socket)) {
        if (!userRegistered(message)) {
          connections.set(socket, message);
          console.log(
            `Username '${message}' set for connection ${remoteSocket}`
          );
          socket.write("Write a message below: (Type 'END' to disconnect)");
        } else {
          socket.write(
            `Username '${message}' is already in use.\nPlease choose another username:`
          );
        }
      } else if (message === "END") {
        //Cerramos conexión con el cliente
        socket.end();
        //Ahora, según el protocolo TCP, hay que esperar a que el cliente nos confirme la desconexión . Es decir, esperamos a que se de el evento "socket.on("close", callback)".
      } else {
        //Imprimimos por pantalla lo que nos ha enviado la máquina
        console.log(
          `${remoteSocket} -> [${connections.get(socket)}]: ${message}`
        );
        //Devolvemos el mensaje a los demás clientes
        sendMessage(message, socket);
      }
    });

    //Cuando el cliente haya confirmado la desconexión. Es decir, cuando el cliente cierre la conexión con el socket (socket.end()), este evento se ejecutará:
    socket.on("close", () => {
      console.log(
        `Connection with '${connections.get(socket)}' (${remoteSocket}) ended`
      );

      //Borramos del map el socket mapeado para no sobrecargar memoria
      connections.delete(socket);
    });

    //Si hay algun error con el socket
    socket.on("error", (err) => error(err.message));
  });
};

const main = () => {
  //console.log(process.argv); //consultar origen de los argumentos que le pasamos al script al ejecutarlo

  //Si los argumentos que le pasamos al script no son 3 entonces muestra error. El script debería ejecutarse así: node server.js 8000
  if (process.argv.length !== 3) {
    error(`Usage: node ${__filename} port`);
  }

  //Nos aseguramos que el 3º argumento sea un número
  let port = process.argv[2];
  if (isNaN(port)) error(`Invalid port '${port}'`);
  port = Number(port);

  //Llamamos a la función listen
  listen(port);
};

//Si este archivo es el principal (si es el archivo main), entonces ejecuta la funcion main. SIno significa que lo han importado y no queremos que se ejecute la función main en ese caso
if (require.main === module) {
  main();
}
