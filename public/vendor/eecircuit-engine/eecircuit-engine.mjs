// MACH_MO_SPICE_EXTERNAL_WASM: /vendor/eecircuit-engine/spice.wasm
/**
 * SPICE simulation
 */
import Module from "./spice.mjs";
import { readOutput } from "./readOutput.mjs";
export class Simulation {
    static MAX_INFO_CHARS = 2_000_000;
    __getSpiceModuleForTests() {
        return this.spiceModule;
    }
    pass = false;
    // private commandList = [" ", "source test.cir", "run", "set filetype=ascii", "write out.raw"];
    commandList = [" ", "source test.cir", "destroy all", "run", "write out.raw"];
    isNoiseMode = false;
    cmd = 0;
    // destroy all releases plots, but a sourced circuit survives until remcirc.
    circuitCleanupPending = false;
    dataRaw = new Uint8Array();
    results = {};
    output = "";
    info = "";
    initInfo = "";
    error = [];
    initialized = false;
    // Keep the wasm Module alive for the lifetime of this Simulation instance.
    // This prevents per-run re-instantiation/reload when the parent app reuses the object.
    spiceModule = null;
    // Ensure start() is idempotent and does not create multiple wasm instances.
    startPromise = null;
    netList = "";
    // Promise resolvers for initialization and simulation run.
    initPromiseResolve = null;
    runPromiseResolve = null;
    // Promise resolver used to resume the internal simulation loop between runs.
    continuePromiseResolve = null;
    getInput = () => {
        let strCmd = " ";
        if (this.cmd < this.commandList.length) {
            strCmd = this.commandList[this.cmd];
            if (strCmd === "source test.cir" && this.circuitCleanupPending) {
                // Keep the source command queued until the previous circuit is removed.
                strCmd = "remcirc";
                this.circuitCleanupPending = false;
            }
            else {
                this.cmd++;
                if (strCmd === "source test.cir")
                    this.circuitCleanupPending = true;
            }
        }
        else {
            this.cmd = 0;
        }
        this.log_debug(`cmd -> ${strCmd}`);
        return strCmd;
    };
    /**
     * Internal startup method that sets up the Module and simulation loop.
     */
    async startInternal() {
        const moduleOptions = {
            noInitialRun: true,
            locateFile: (file) => file === "spice.wasm" && typeof globalThis.location !== "undefined"
                ? new URL("/vendor/eecircuit-engine/spice.wasm", globalThis.location.href).href : file,
            stdin: (() => {
                let pending = [];
                return () => {
                    if (!pending.length)
                        pending = Array.from(this.getInput() + "\n", c => c.charCodeAt(0));
                    return pending.shift();
                };
            })(),
            print: (e = "") => {
                this.log_debug(e);
                this.info = (this.info + e + "\n").slice(-Simulation.MAX_INFO_CHARS);
            },
            printErr: (e = "") => {
                this.info = (this.info + e + "\n\n").slice(-Simulation.MAX_INFO_CHARS);
                // ngspice sends routine convergence progress to stderr; retain it in getInfo().
                if (e !== "Warning: can't find the initialization file spinit." &&
                    e !== "Using SPARSE 1.3 as Direct Linear Solver" &&
                    e !== "Note: Starting dynamic gmin stepping" &&
                    e !== "Note: Dynamic gmin stepping completed") {
                    console.error(e);
                    this.error.push(e);
                }
                else {
                    this.log_debug(e);
                }
            },
            preRun: [() => this.log_debug("from prerun")],
            setGetInput: this.getInput,
            setHandleThings: () => {
                /* No-op */
            },
            runThings: () => {
                /* No-op */
            },
        };
        if (typeof process !== "undefined" && process.versions?.node) {
            // Use a runtime-built dynamic import so bundlers don't see node:* specifiers,
            // while still letting Node preload the wasm from disk for CLI regression tests.
            const dynamicImport = new Function("specifier", "return import(specifier);");
            const [fsModule, urlModule] = await Promise.all([
                dynamicImport("node:fs/promises").catch(() => null),
                dynamicImport("node:url").catch(() => null),
            ]);
            if (fsModule && urlModule) {
                const wasmUrl = new URL("./spice.wasm", import.meta.url);
                if (wasmUrl.protocol === "file:") {
                    // When built for the browser, the bundler inlines the wasm with a data URL,
                    // so only attempt filesystem access when running from an actual file path.
                    const wasmPath = urlModule.fileURLToPath(wasmUrl);
                    moduleOptions.locateFile = (path) => path === "spice.wasm" ? wasmPath : path;
                    moduleOptions.wasmBinary = await fsModule.readFile(wasmPath);
                }
            }
        }
        // If startInternal is ever called twice, reuse the already created module.
        // (start() is also guarded, but this keeps things extra safe.)
        let module = this.spiceModule;
        if (!module) {
            module = await Module(moduleOptions);
            this.spiceModule = module;
        }
        // Write required files
        module.FS?.writeFile("/spinit", "* Standard ngspice init file\n");
        module.FS?.writeFile("/proc/meminfo", "MemTotal: 2097152 kB\nMemFree: 2097152 kB\nMemAvailable: 2097152 kB\n");
        // GF180: global settings include file (switches/corners).
        // GF180 MOS/BJT/etc library: provides sections like `.LIB typical`.
        // GF180 modelcards with specific corners
        // Set the handler to process simulation events.
        module.setHandleThings(() => {
            this.log_debug("handle other things!!!!!");
            module.Asyncify?.handleAsync(async () => {
                // If a simulation cycle is complete, i.e. the command list has been exhausted:
                if (this.cmd === 0) {
                    try {
                        this.dataRaw = module.FS?.readFile("out.raw") ?? new Uint8Array();
                        this.results = readOutput(this.dataRaw);
                        this.results = readOutput(this.dataRaw);
                        this.outputEvent(this.output); // external callback
                        // Resolve the run promise with the results.
                        if (this.runPromiseResolve) {
                            this.runPromiseResolve(this.results);
                            this.runPromiseResolve = null;
                        }
                    }
                    catch (e) {
                        this.log_debug(e);
                    }
                    this.log_debug("output completed");
                }
                // On the very first run, resolve the initialization promise.
                if (!this.initialized) {
                    if (this.initPromiseResolve) {
                        this.initPromiseResolve();
                        this.initPromiseResolve = null;
                    }
                    this.log_debug("initialized");
                    this.initialized = true;
                    this.initInfo = this.info;
                }
                // Wait for the next simulation trigger before continuing the loop.
                if (this.cmd === 0) {
                    this.log_debug("waiting for next simulation trigger...");
                    await this.waitForNextRun();
                    // Prepare for the next cycle by writing the new netlist *before* commands restart.
                    module.FS?.writeFile("/test.cir", this.netList);
                }
                this.log_debug("Simulation loop finished for one run cycle");
                this.pass = false;
            });
        });
        module.setGetInput(this.getInput);
        module.runThings("-i");
    }
    /**
     * Public start method.
     * Returns a promise that resolves when the simulation module is initialized.
     */
    start = () => {
        if (this.initialized) {
            return Promise.resolve();
        }
        if (this.startPromise) {
            return this.startPromise;
        }
        this.startPromise = new Promise((resolve) => {
            this.initPromiseResolve = resolve;
        });
        void this.startInternal();
        return this.startPromise;
    };
    /**
     * Triggers a simulation run and returns a promise that resolves with the results.
     */
    runSim = () => {
        const run = async () => {
            // If the parent app forgot to call start(), do it once here.
            await this.start();
            // Reset logs and previous results.
            this.info = "";
            this.error = [];
            this.results = {};
            const resultPromise = new Promise((resolve) => {
                this.runPromiseResolve = resolve;
            });
            this.log_debug("Triggering simulation run...");
            // Continue the simulation loop if it is waiting.
            this.continueRun();
            return await resultPromise;
        };
        return run();
    };
    /**
     * Waits for a new simulation trigger.
     */
    waitForNextRun = () => {
        return new Promise((resolve) => {
            this.continuePromiseResolve = resolve;
        });
    };
    /**
     * Resolves the waiting promise to continue the simulation loop.
     */
    continueRun = () => {
        // If there's a waiting promise from waitForNextRun, resolve it.
        if (this.continuePromiseResolve) {
            const resolve = this.continuePromiseResolve;
            this.continuePromiseResolve = null;
            resolve();
        }
    };
    outputEvent = (out) => {
        // Callback for external handling of output
        void out;
    };
    setNetList = (input) => {
        this.netList = input;
        const hasNoiseAnalysis = /^\s*\.noise\b/im.test(input);
        if (hasNoiseAnalysis) {
            this.commandList = [" ", "source test.cir", "destroy all", "run", "setplot noise1", "write out.raw"];
            if (!this.isNoiseMode) {
                this.isNoiseMode = true;
                console.info("[EEcircuit-engine] .noise analysis detected; activating noise export mode (setplot noise1 -> write out.raw).");
            }
            return;
        }
        // Reset to default command list when not running a .noise analysis.
        this.isNoiseMode = false;
        this.commandList = [" ", "source test.cir", "destroy all", "run", "write out.raw"];
    };
    setOutputEvent = (outputEvent) => {
        this.outputEvent = outputEvent;
    };
    getInfo = () => {
        return this.info;
    };
    getInitInfo = () => {
        return this.initInfo;
    };
    getError = () => {
        return this.error;
    };
    isInitialized = () => {
        return this.initialized;
    };
    log_debug = (message, ...optionalParams) => {
        const isDebug = false;
        if (isDebug)
            console.log("simLink-> ", message, optionalParams);
    };
}
