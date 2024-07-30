const { read } = require("fs");
const net = require("net");

//Módulo que usaremos para leer información desde la terminal.
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

//

//En caso de error
const error = (err) => {
  console.log(err);
  process.exit(1); //Mata el proceso. Código de salida 1: Sale de la ejecución con error.
};

const connectToServer = (host, port) => {
  //Instanciamos el socket
  const socket = new net.Socket();

  //Nos conectamos al servidor. En este caso nos vamos a conectar a un servidor local en vez remoto, por lo que el host será "localhost", lo que es lo mismo que "127.0.0.1"
  socket.connect({ host: host, port: port }, () => {
    console.log("Connecting to server...\n");
  });

  //Cuando se conecte al servidor satisfactoriamente
  socket.on("connect", () => {
    console.log("Successful connection to server");

    //Primer mensaje del cliente al servidor (username)
    readline.question("Write your username: ", (username) => {
      socket.write(username);

      //Cuando escribimos un mensaje al chat
      readline.on("line", (line) => {
        socket.write(line);
        console.log(`[${username}]: ${line}`);
        if (line === "END") {
          //Cerramos conexión con el servidor
          socket.end();
          //Ahora, según el protocolo TCP, hay que esperar a que el servidor nos confirme la desconexión . Es decir, esperamos a que se de el evento "socket.on("close", callback)".
        }
      });
    });

    //Cuando esta máquina reciba información del servidor:
    //Establecemos la codificación utf-8 al igual que en el servidor
    socket.setEncoding("utf-8");
    socket.on("data", (message) => {
      //Imprimimos por consola lo que nos ha enviado el servidor, que en este caso, es el mensaje de otros usuarios
      console.log(message);
    });
  });

  //Cuando el servidor haya confirmado la desconexión. Es decir, cuando el servidor cierre la conexión con el socket (socket.end()), este evento se ejecutará:
  socket.on("close", () => {
    console.log("Disconnected from the server...");
    process.exit(0); //Mata el proceso. Código de salida 0: Sale de la ejecución con éxito.
  });

  //Si hay algun error con el socket
  socket.on("error", (err) => error(err.message));
};

const main = () => {
  //Si los argumentos que le pasamos al script no son 3 entonces muestra error. El script debería ejecutarse así: node client.js localhost 8000
  if (process.argv.length !== 4) {
    error(`Usage: node ${__filename} host port`);
  }

  //Nos aseguramos que tanto host como port sean del data type que queremos
  let [, , host, port] = process.argv;
  if (isNaN(port)) error(`Invalid port '${port}'`);
  port = Number(port);

  //Llamamos a la función connect
  connectToServer(host, port);
};

//Si este archivo es el principal (si es el archivo main), entonces ejecuta la funcion main. Sino significa que lo han importado y no queremos que se ejecute la función main en ese caso
if (require.main === module) {
  main();
}
