import assert from "node:assert/strict";
import {
  appendFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { evaluarSolicitud } from "./proteger-entorno.mjs";

const archivo = fileURLToPath(import.meta.url);
const carpeta = path.dirname(archivo);
const raiz = path.resolve(carpeta, "../..");
const hook = path.join(carpeta, "proteger-entorno.mjs");
const configuracion = path.resolve(carpeta, "../config.toml");

function evento(tool_name, tool_input, cwd = raiz) {
  return { hook_event_name: "PreToolUse", tool_name, tool_input, cwd };
}

function ejecutarHook(entrada) {
  return spawnSync(process.execPath, [hook], {
    input: entrada,
    encoding: "utf8",
    timeout: 10000,
  });
}

function tablaTomlInline(valor) {
  if (typeof valor === "string") return JSON.stringify(valor);
  assert.ok(valor && typeof valor === "object" && !Array.isArray(valor));
  return "{" + Object.entries(valor).map(
    ([clave, contenido]) => JSON.stringify(clave) + "=" + tablaTomlInline(contenido),
  ).join(",") + "}";
}

function argumentosDelPerfil() {
  const texto = readFileSync(configuracion, "utf8");
  let seccion = "";
  const perfil = { filesystem: { ":workspace_roots": {} } };
  let entradas = 0;
  for (const original of texto.split(/\r?\n/u)) {
    const linea = original.trim();
    if (!linea || linea.startsWith("#")) continue;
    if (linea.startsWith("[")) {
      seccion = linea;
      continue;
    }
    let destino;
    if (seccion === "[permissions.playlog]") destino = perfil;
    else if (seccion === '[permissions.playlog.filesystem.":workspace_roots"]') {
      destino = perfil.filesystem[":workspace_roots"];
    } else continue;
    const par = linea.match(/^("(?:[^"\\]|\\.)*"|[\w-]+)\s*=\s*("(?:[^"\\]|\\.)*")$/u);
    assert.ok(par, "Formato no reconocido en el perfil; detenerse para revisar.");
    const clave = par[1].startsWith('"') ? JSON.parse(par[1]) : par[1];
    const valor = JSON.parse(par[2]);
    destino[clave] = valor;
    entradas += 1;
  }
  assert.ok(entradas > 0, "No se encontró el perfil playlog.");
  // Las rutas con puntos son claves dentro del valor TOML, no de la ruta de -c.
  return ["-c", "permissions=" + tablaTomlInline({ playlog: perfil })];
}

function comprobarDenegacion(accion, nombre, resultados) {
  assert.throws(accion, (error) => ["EACCES", "EPERM"].includes(error.code), nombre);
  resultados.push(nombre);
}

function probarSandbox(directorio) {
  const temporal = realpathSync(directorio);
  const baseTemporal = realpathSync(tmpdir());
  assert.ok(temporal.startsWith(baseTemporal + path.sep));
  assert.ok(path.basename(temporal).startsWith("playlog-harness-"));
  assert.equal(readFileSync(path.join(temporal, "MARCADOR"), "utf8"), "PLAYLOG_FICTICIO\n");
  const resultados = [];
  assert.equal(readFileSync(path.join(temporal, "control.txt"), "utf8"), "CONTROL\n");
  resultados.push("lectura normal permitida");
  appendFileSync(path.join(temporal, "control.txt"), "OK\n");
  resultados.push("escritura normal permitida");
  for (const nombre of [".env", ".env.local", "backend/.env"]) {
    const objetivo = path.join(temporal, nombre);
    comprobarDenegacion(() => readFileSync(objetivo, "utf8"), "lectura denegada: " + nombre, resultados);
    comprobarDenegacion(() => appendFileSync(objetivo, "CAMBIO\n"), "escritura denegada: " + nombre, resultados);
  }
  const ejemplo = path.join(temporal, "backend/.env.example");
  assert.equal(readFileSync(ejemplo, "utf8"), "EJEMPLO_FICTICIO\n");
  resultados.push("ejemplo ficticio legible");
  comprobarDenegacion(() => appendFileSync(ejemplo, "CAMBIO\n"), "ejemplo ficticio no modificable", resultados);
  comprobarDenegacion(
    () => writeFileSync(path.join(temporal, ".env.nuevo"), "FICTICIO\n", { flag: "wx" }),
    "creación de variante de entorno denegada",
    resultados,
  );
  process.stdout.write(JSON.stringify({ perfil: "playlog", comprobaciones: resultados }) + "\n");
}

function probarIntegracion() {
  const binary = process.env.PLAYLOG_CODEX_BIN;
  assert.ok(binary && path.isAbsolute(binary), "Indicar PLAYLOG_CODEX_BIN con el binario instalado.");
  assert.equal(process.platform, "darwin", "Esta prueba de integración está preparada para macOS.");
  const temporal = realpathSync(mkdtempSync(path.join(tmpdir(), "playlog-harness-")));
  try {
    mkdirSync(path.join(temporal, "backend"));
    writeFileSync(path.join(temporal, "MARCADOR"), "PLAYLOG_FICTICIO\n");
    writeFileSync(path.join(temporal, "control.txt"), "CONTROL\n");
    for (const nombre of [".env", ".env.local", "backend/.env"]) {
      writeFileSync(path.join(temporal, nombre), "CANARIO_FICTICIO\n");
    }
    writeFileSync(path.join(temporal, "backend/.env.example"), "EJEMPLO_FICTICIO\n");
    const resultado = spawnSync(binary, [
      ...argumentosDelPerfil(),
      "sandbox", "--permission-profile", "playlog", "--cd", temporal, "--",
      process.execPath, archivo, "--probe-sandbox", temporal,
    ], { encoding: "utf8", timeout: 30000 });
    const errorBreve = (resultado.stderr ?? "").split("\n").find((linea) => /error|Error/u.test(linea)) ?? "";
    assert.ifError(resultado.error);
    assert.equal(resultado.status, 0, "Sandbox falló: " + errorBreve.slice(0, 300));
    const informe = JSON.parse(resultado.stdout.trim());
    assert.equal(informe.perfil, "playlog");
    assert.equal(informe.comprobaciones.length, 11);
    for (const nombre of [".env", ".env.local", "backend/.env"]) {
      assert.equal(readFileSync(path.join(temporal, nombre), "utf8"), "CANARIO_FICTICIO\n");
    }
    assert.equal(readFileSync(path.join(temporal, "backend/.env.example"), "utf8"), "EJEMPLO_FICTICIO\n");
    process.stdout.write(JSON.stringify({ ...informe, soloFicticios: true, archivosProtegidosIntactos: true }) + "\n");
  } finally {
    // Solo se elimina el directorio creado por esta ejecución.
    rmSync(temporal, { recursive: true, force: true });
  }
}

if (process.argv[2] === "--probe-sandbox") {
  probarSandbox(process.argv[3]);
} else if (process.argv[2] === "--integration") {
  probarIntegracion();
} else {
  for (const comando of [
    "cat backend/.env",
    'cat "backend/.env.local"',
    "printf x > .env",
    "cp README.md .env.production",
    "node -e 'require(\"fs\").readFileSync(\".env\")'",
    "cat carpeta/.env/archivo",
  ]) {
    test("rechaza comando explícito: " + comando, () => {
      assert.equal(evaluarSolicitud(evento("Bash", { command: comando })).permitido, false);
    });
  }
  test("reconoce cmd de exec_command", () => {
    assert.equal(evaluarSolicitud(evento("exec_command", { cmd: "cat .env" })).permitido, false);
  });
  for (const accion of ["Add File", "Update File", "Delete File", "Move to"]) {
    test("rechaza ruta protegida en patch: " + accion, () => {
      const patch = "*** Begin Patch\n*** Update File: README.md\n*** " + accion + ": backend/.env\n*** End Patch";
      assert.equal(evaluarSolicitud(evento("apply_patch", { command: patch })).permitido, false);
    });
  }
  test("rechaza mover un archivo protegido a una ruta normal", () => {
    const patch = "*** Begin Patch\n*** Update File: backend/.env\n*** Move to: README.md\n*** End Patch";
    assert.equal(evaluarSolicitud(evento("apply_patch", { command: patch })).permitido, false);
  });
  test("permite documentar .env sin editar un archivo de entorno", () => {
    const patch = "*** Begin Patch\n*** Update File: AGENTS.md\n@@\n+No leer .env\n*** End Patch";
    assert.equal(evaluarSolicitud(evento("apply_patch", { command: patch })).permitido, true);
  });
  test("permite el código env.ts", () => {
    assert.equal(evaluarSolicitud(evento("Bash", { command: "cat backend/src/config/env.ts" })).permitido, true);
  });
  test("no confunde process.env con un archivo", () => {
    assert.equal(evaluarSolicitud(evento("Bash", { command: "node -e 'console.log(process.env.NODE_ENV)'" })).permitido, true);
  });
  test("permite exclusiones de búsqueda", () => {
    assert.equal(evaluarSolicitud(evento("Bash", { command: "rg texto -g '!.env*' ." })).permitido, true);
  });
  test("permite lectura simple de la plantilla conocida", () => {
    assert.equal(evaluarSolicitud(evento("Bash", { command: "cat backend/.env.example" })).permitido, true);
  });
  test("rechaza escritura de la plantilla", () => {
    assert.equal(evaluarSolicitud(evento("Bash", { command: "printf x > backend/.env.example" })).permitido, false);
  });
  test("rechaza herramientas de lectura sobre rutas protegidas", () => {
    assert.equal(evaluarSolicitud(evento("mcp__fs__read_file", { path: "backend/.env" })).permitido, false);
  });
  test("permite leer la plantilla con una herramienta de archivos", () => {
    assert.equal(evaluarSolicitud(evento("mcp__fs__read_file", { path: "backend/.env.example" })).permitido, true);
  });
  test("rechaza editar la plantilla con una herramienta de archivos", () => {
    assert.equal(evaluarSolicitud(evento("Edit", { file_path: "backend/.env.example", content: "FICTICIO" })).permitido, false);
  });
  test("rechaza un directorio protegido", () => {
    assert.equal(evaluarSolicitud(evento("Bash", { command: "cat archivo" }, "/ficticio/.env")).permitido, false);
  });
  test("rechaza eventos incompletos", () => {
    for (const entrada of [null, [], {}, { hook_event_name: "PostToolUse" }]) {
      assert.equal(evaluarSolicitud(entrada).permitido, false);
    }
  });
  test("protocolo CLI devuelve deny sin revelar la entrada", () => {
    const resultado = ejecutarHook(JSON.stringify(evento("Bash", { command: "cat .env MARCADOR_FICTICIO" })));
    assert.equal(resultado.status, 0);
    const respuesta = JSON.parse(resultado.stdout);
    assert.equal(respuesta.hookSpecificOutput.permissionDecision, "deny");
    assert.match(respuesta.hookSpecificOutput.permissionDecisionReason, /PLAYLOG_ENV_GUARD/u);
    assert.equal(resultado.stdout.includes("MARCADOR_FICTICIO"), false);
  });
  test("protocolo CLI no concede aprobaciones adicionales", () => {
    const resultado = ejecutarHook(JSON.stringify(evento("Bash", { command: "cat README.md" })));
    assert.equal(resultado.status, 0);
    assert.equal(resultado.stdout, "");
  });
  test("protocolo CLI rechaza JSON mal formado", () => {
    const resultado = ejecutarHook("{");
    assert.equal(resultado.status, 0);
    assert.equal(JSON.parse(resultado.stdout).hookSpecificOutput.permissionDecision, "deny");
  });
}
