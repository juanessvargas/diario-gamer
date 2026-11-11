import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";

for (const modo of ["salida normal", "ya terminado por señal", "requiere SIGTERM", "requiere SIGKILL"]) {
  test(`T15 limpieza del runner: ${modo}`, { timeout: 5000 }, async (t) => {
    const { cerrarProceso } = await import("./navegador.mjs");
    assert.equal(typeof cerrarProceso, "function");
    const codigo = modo === "salida normal" ? "" : `
      ${modo === "requiere SIGKILL" ? "process.on('SIGTERM',()=>{});" : ""}
      console.log('listo'); setInterval(()=>{},1000);
    `;
    const p = spawn(process.execPath, ["-e", codigo], { stdio: ["ignore", "pipe", "ignore"] });
    t.after(() => { if (p.exitCode === null && p.signalCode === null) p.kill("SIGKILL"); });
    if (modo === "salida normal") await once(p, "exit");
    else {
      await once(p.stdout, "data");
      if (modo === "ya terminado por señal") { p.kill("SIGTERM"); await once(p, "exit"); }
    }
    await cerrarProceso(p, 50);
    assert.ok(p.exitCode !== null || p.signalCode !== null);
    if (modo === "requiere SIGKILL") assert.equal(p.signalCode, "SIGKILL");
  });
}
