import { hashPayload } from "../backend/lib/field-mapper";

function assert(condition: unknown, msg: string): void {
  if (!condition) {
    throw new Error(msg);
  }
}

const one = hashPayload({ a: 1, b: 2 });
const two = hashPayload({ b: 2, a: 1 });
assert(one === two, "hash payload must be stable regardless of key order");

console.log("smoke tests passed");
