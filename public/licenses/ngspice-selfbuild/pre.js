if (typeof globalThis !== 'undefined') {
  if (!globalThis.window) {
    globalThis.window = {};
  }
  globalThis.window.prompt = function(msg) {
    if (Module["getInput"]) {
      return Module["getInput"]();
    }
    return null;
  };
}

Module["setGetInput"] = function(f) {
  Module["getInput"] = f;
};

Module["setHandleThings"] = function(f) {
  Module["handleThings"] = f;
};

Module["runThings"] = function() {
  Module["calledRun"] = false;
  if (Module["callMain"]) {
    Module["callMain"](Array.prototype.slice.call(arguments));
  } else if (typeof callMain !== 'undefined') {
    callMain(Array.prototype.slice.call(arguments));
  }
};
// Mạch Mở 2026-11-17: use the same command callback in Node and browsers.
// Emscripten's default Node stdin is synchronous and would block the event loop.
var machmoInput = [];
Module["stdin"] = function() {
  if (!machmoInput.length) {
    machmoInput = Array.from((Module["getInput"] ? Module["getInput"]() : " ") + "\n", function(c) { return c.charCodeAt(0); });
  }
  return machmoInput.shift();
};
