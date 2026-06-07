var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    console.log(`${(/* @__PURE__ */ new Date()).toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/client-error", (req, res) => {
    const errorDetails = `====================== CLIENT RUNTIME CRASH REPORT ======================
TIME: ${(/* @__PURE__ */ new Date()).toISOString()}
MESSAGE: ${req.body.message}
TYPE: ${req.body.type || "onload-error"}
SOURCE: ${req.body.source || "unknown"}
LINE: ${req.body.lineno} COL: ${req.body.colno}
STACK: ${req.body.stack || "No stack trace"}
=========================================================================
`;
    console.error(errorDetails);
    try {
      import_fs.default.appendFileSync(import_path.default.join(process.cwd(), "client_errors.txt"), errorDetails);
    } catch (e) {
      console.error("Failed to write to client_errors.txt:", e);
    }
    res.json({ captured: true });
  });
  const isProduction = process.env.NODE_ENV === "production";
  const distPath = import_path.default.join(process.cwd(), "dist");
  const hasDist = import_fs.default.existsSync(distPath);
  if (!isProduction || !hasDist) {
    if (isProduction && !hasDist) {
      console.warn("Production mode detected but 'dist' directory is missing. Falling back to Vite middleware.");
    }
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
