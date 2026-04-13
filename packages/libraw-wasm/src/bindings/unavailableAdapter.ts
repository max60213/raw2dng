import { RuntimeUnavailableError } from "../../../raw-core/src/errors";
import type { LibRawAdapter } from "../api/types";

export class UnavailableLibRawAdapter implements LibRawAdapter {
  async probe(): Promise<never> {
    throw new RuntimeUnavailableError();
  }

  async extract(): Promise<never> {
    throw new RuntimeUnavailableError();
  }
}
