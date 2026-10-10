import { app } from "./app";
import { env } from "./config/env";
import { conectarDB } from "./conexionDB";

async function iniciarServidor() {
  await conectarDB();

  app.listen(env.puerto, () => {
    console.log(
      `API Diario Gamer escuchando en http://localhost:${env.puerto}`
    );
  });
}

iniciarServidor();