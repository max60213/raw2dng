export class RuntimeUnavailableError extends Error {
  constructor(message = "LibRaw WebAssembly runtime is unavailable.") {
    super(message);
    this.name = "RuntimeUnavailableError";
  }
}

export class UnsupportedRawError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedRawError";
  }
}
