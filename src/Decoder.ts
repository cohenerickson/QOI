export default class Decoder {
  #binary: Uint8Array;
  #width: number;
  #height: number;
  #channels: number;
  #colorspace: number;

  #data: Uint8Array = new Uint8Array(0);

  constructor(binary: Uint8Array) {
    if (binary.length < 22) {
      throw new Error("Unable to read.");
    }

    this.#binary = binary;

    const signature = this.#shift(4) as Uint8Array;
    console.log(signature);
    if (
      signature[0] !== 0x71 ||
      signature[1] !== 0x6f ||
      signature[2] !== 0x69 ||
      signature[3] !== 0x66
    ) {
      throw new Error("Invalid QOI Signature.");
    }

    this.#width =
      (((this.#shift() as number) << 24) |
        ((this.#shift() as number) << 16) |
        ((this.#shift() as number) << 8) |
        (this.#shift() as number)) >>>
      0;
    this.#height =
      (((this.#shift() as number) << 24) |
        ((this.#shift() as number) << 16) |
        ((this.#shift() as number) << 8) |
        (this.#shift() as number)) >>>
      0;

    this.#channels = this.#shift() as number;
    if (![3, 4].includes(this.#channels)) {
      throw new Error("Invalid Channel");
    }

    this.#colorspace = this.#shift() as number;
    if (![0, 1].includes(this.#colorspace)) {
      throw new Error("Invalid Colorspace");
    }

    

    this.#decode();
  }

  #decode() {
    let previous: Uint8Array = new Uint8Array([0, 0, 0, 255]);

    let index = new Uint8Array(64 * 4);

    let run = 0;

    let pointer = 0;

    while (pointer < this.#binary.length) {

    }
  }

  #shift(amount?: number): number | Uint8Array {
    let returnValue: number | Uint8Array;

    if (amount && amount > 1) {
      const values: number[] = [];
      for (let i = 0; i < amount; i++) {
        values.push(this.#shift() as number);
      }
      returnValue = new Uint8Array(values);
    } else {
      const tempArray = Array.from(this.#binary);
      returnValue = tempArray.shift() ?? 0;
      this.#binary = new Uint8Array(tempArray);
    }
    return returnValue;
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get channels(): number {
    return this.#channels;
  }

  get colorspace(): number {
    return this.#colorspace;
  }

  get data(): Uint8Array {
    return this.#data;
  }
}
