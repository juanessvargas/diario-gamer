import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const archivo = fileURLToPath(import.meta.url);
const raizProyecto = path.resolve(path.dirname(archivo), "../..");
const plantilla = path.join(raizProyecto, "backend/.env.example");
const identificador = "PLAYLOG_ENV_GUARD";

function denegar(motivo) {
  return { permitido: false, motivo: identificador + ": " + motivo };
}

function normalizarRuta(valor) {
  return valor.replaceAll("\\", "/");
}

function esRutaProtegida(valor) {
  return normalizarRuta(valor).split("/").some(
    (parte) => parte === ".env" || parte.startsWith(".env."),
  );
}

function esPlantilla(valor, cwd) {
  return path.resolve(cwd, normalizarRuta(valor)) === plantilla;
}

function comandoLecturaSimple(comando) {
  return /^(?:\/[^\s]+\/)?(?:cat|head|tail)\s/u.test(comando.trim())
    && !/[;&|<>$\x60\n\r]/u.test(comando);
}

function revisarShell(entrada, cwd) {
  const comando = typeof entrada === "string"
    ? entrada
    : entrada.command ?? entrada.cmd;
  if (typeof comando !== "string") return denegar("comando ausente o inválido.");
  const tokens = comando.split(/[\s"'\x60;|&<>(){}\[\],=]+/u).filter(Boolean);
  for (const token of tokens) {
    // Exclusiones de búsqueda no son rutas que se vayan a abrir.
    if (token.startsWith("!")) continue;
    if (!esRutaProtegida(token)) continue;
    if (esPlantilla(token, cwd) && comandoLecturaSimple(comando)) continue;
    return denegar("acceso explícito a archivos de entorno bloqueado.");
  }
  return { permitido: true };
}

function revisarPatch(entrada) {
  const patch = typeof entrada === "string"
    ? entrada
    : entrada.command ?? entrada.patch ?? entrada.input;
  if (typeof patch !== "string") return denegar("patch ausente o inválido.");
  const rutas = [...patch.matchAll(
    /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gmu,
  )].map((coincidencia) => coincidencia[1].trim());
  if (rutas.length === 0) return denegar("patch sin rutas reconocibles.");
  if (rutas.some(esRutaProtegida)) {
    return denegar("modificación de archivos de entorno bloqueada.");
  }
  return { permitido: true };
}

function recogerRutas(entrada) {
  if (typeof entrada === "string") return [entrada];
  const claves = new Set([
    "path", "file_path", "filePath", "filename", "fileName",
    "source", "destination", "old_path", "new_path", "paths",
  ]);
  const rutas = [];
  function visitar(valor) {
    if (!valor || typeof valor !== "object") return;
    for (const [clave, contenido] of Object.entries(valor)) {
      if (claves.has(clave)) {
        if (typeof contenido === "string") rutas.push(contenido);
        if (Array.isArray(contenido)) {
          rutas.push(...contenido.filter((item) => typeof item === "string"));
        }
      } else if (contenido && typeof contenido === "object") {
        visitar(contenido);
      }
    }
  }
  visitar(entrada);
  return rutas;
}

export function evaluarSolicitud(evento) {
  if (!evento || typeof evento !== "object" || Array.isArray(evento)) {
    return denegar("evento inválido.");
  }
  if (evento.hook_event_name !== "PreToolUse"
      || typeof evento.tool_name !== "string"
      || !evento.tool_input
      || !["string", "object"].includes(typeof evento.tool_input)
      || Array.isArray(evento.tool_input)) {
    return denegar("evento PreToolUse incompleto o inválido.");
  }
  const cwd = typeof evento.cwd === "string" ? evento.cwd : raizProyecto;
  if (esRutaProtegida(cwd)) return denegar("directorio de entorno bloqueado.");
  if (["Bash", "exec_command"].includes(evento.tool_name)) {
    return revisarShell(evento.tool_input, cwd);
  }
  if (evento.tool_name === "apply_patch") return revisarPatch(evento.tool_input);
  const lectura = /read_file|view_image/iu.test(evento.tool_name);
  for (const ruta of recogerRutas(evento.tool_input)) {
    if (!esRutaProtegida(ruta)) continue;
    if (lectura && esPlantilla(ruta, cwd)) continue;
    return denegar("acceso a una ruta de entorno bloqueado.");
  }
  return { permitido: true };
}

export function respuestaDeBloqueo(motivo) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: motivo,
    },
  };
}

function ejecutar() {
  let resultado;
  try {
    resultado = evaluarSolicitud(JSON.parse(readFileSync(0, "utf8")));
  } catch {
    resultado = denegar("entrada JSON inválida; operación rechazada.");
  }
  if (!resultado.permitido) {
    process.stdout.write(JSON.stringify(respuestaDeBloqueo(resultado.motivo)) + "\n");
  }
  // Permitir no emite una aprobación: deja intacta la política normal de Codex.
}

if (process.argv[1] && path.resolve(process.argv[1]) === archivo) ejecutar();
