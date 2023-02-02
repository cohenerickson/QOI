type Channels = 3 | 4;
type Colorspace = 0 | 1;

type EncoderOptions = {
  channels: Channels;
  colorspace: Colorspace;
  width: number;
  height: number;
};

const FOUR_BYTE_MAX = 4294967295;
const FOUR_BYTE_MIN = 0;

export default class Encoder {
  #channels: Channels;
  #colorspace: Colorspace;
  #width: number;
  #height: number;

  #bytes: Uint8Array = new Uint8Array([0x71, 0x6f, 0x69, 0x66]);

  constructor(data: Uint8Array, options: EncoderOptions) {
    // Type Checking
    if (
      !options.width ||
      options.width < FOUR_BYTE_MIN ||
      options.width >= FOUR_BYTE_MAX
    ) {
      throw new TypeError(
        `Invalid 'width', value must be within range ${FOUR_BYTE_MIN}-${FOUR_BYTE_MAX}`
      );
    } else if (
      !options.height ||
      options.height < FOUR_BYTE_MIN ||
      options.height >= FOUR_BYTE_MAX
    ) {
      throw new TypeError(
        `Invalid 'height', value must be within range ${FOUR_BYTE_MIN}-${FOUR_BYTE_MAX}`
      );
    } else if (![3, 4].includes(options.channels)) {
      throw new TypeError(`Invalid 'channels', value must be either 3 or 4`);
    } else if (![0, 1].includes(options.colorspace)) {
      throw new TypeError(`Invalid 'colorspace', value must be either 0 or 1`);
    }

    // Store Meta Data
    this.#channels = options.channels;
    this.#colorspace = options.colorspace;
    this.#width = options.width;
    this.#height = options.height;

    // Initialize Output Array
    this.#initHeader();

    // Encode Data
    this.#encode(data);

    // Add End Tag
    this.#concat([0, 0, 0, 0, 0, 0, 0, 1]);
  }

  #encode(data: Uint8Array): void {
    let previous: Uint8Array = new Uint8Array(4);
    previous[0] = 0;
    previous[1] = 0;
    previous[2] = 0;
    previous[3] = 255;

    let index = new Uint8Array(64 * 4);

    let run = 0;

    for (let pointer = 0; pointer < data.length; pointer += this.#channels) {
      const red = data[pointer];
      const green = data[pointer + 1];
      const blue = data[pointer + 2];
      const alpha = this.#channels === 4 ? data[pointer + 3] : 255;
      const indexPos = (red * 3 + green * 5 + blue * 7 + alpha * 11) % 64;

      if (
        red === previous[0] &&
        green === previous[1] &&
        blue === previous[2] &&
        alpha === previous[3] &&
        run < 62
      ) {
        run++;
        if (!data[pointer + this.#channels]) {
          if (run > 0) {
            this.#concat([0b11000000 | run]);
          }
        }
      } else {
        // QOI_OP_RUN
        if (run > 0) {
          this.#concat([0b11000000 | run]);
          run = 0;
        }

        if (
          red === index[indexPos] &&
          green === index[indexPos + 1] &&
          blue === index[indexPos + 2] &&
          alpha === index[indexPos + 3]
        ) {
          // QOI_OP_INDEX
          this.#concat([indexPos / 4]);
        } else {
          index[indexPos] = red;
          index[indexPos + 1] = green;
          index[indexPos + 2] = blue;
          index[indexPos + 3] = alpha;

          if (alpha === previous[3]) {
            const dr = byteDiff(red, previous[0]);
            const dg = byteDiff(red, previous[1]);
            const db = byteDiff(red, previous[2]);

            const dgr = dr - dg;
            const dgb = db - dg;

            if (dr > -3 && dr < 2 && dg > -3 && dg < 2 && db > -3 && db < 2) {
              // QOI_OP_DIFF
              this.#concat([
                0b01000000 | ((dr + 2) << 4) | ((dg + 2) << 2) | (db + 2)
              ]);
            } else if (
              dgr > -9 &&
              dgr < 8 &&
              dg > -33 &&
              dg < 32 &&
              dgb > -9 &&
              dgb < 8
            ) {
              // QOI_OP_LUMA
              this.#concat([
                0b10000000 | (dg + 32),
                ((dgr + 8) << 4) | (dgb + 8)
              ]);
            } else {
              // QOI_OP_RGB
              this.#concat([0b1111110, red, green, blue]);
            }
          } else {
            // QOI_OP_RGBA
            this.#concat([0b1111111, red, green, blue, alpha]);
          }
        }
      }

      if (alpha) {
        previous = new Uint8Array([red, green, blue, alpha]);
      } else {
        previous = new Uint8Array([red, green, blue]);
      }
    }
  }

  #initHeader(): void {
    // Width - Bytes 4-7
    this.#concat([
      (this.#width >> 24) & 0xff,
      (this.#width >> 16) & 0xff,
      (this.#width >> 8) & 0xff,
      this.#width & 0xff
    ]);

    // Height - Bytes 8-11
    this.#concat([
      (this.#height >> 24) & 0xff,
      (this.#height >> 16) & 0xff,
      (this.#height >> 8) & 0xff,
      this.#height & 0xff
    ]);

    // Channels - Byte 12
    this.#concat([this.#channels]);

    // Colorspace - Byte 13
    this.#concat([this.#colorspace]);
  }

  // https://stackoverflow.com/a/33703102
  #concat(b: Uint8Array | number[]) {
    let a = new Uint8Array(this.#bytes);
    let c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    this.#bytes = c;
  }

  get channels(): Channels {
    return this.#channels;
  }

  get colorspace(): Colorspace {
    return this.#colorspace;
  }

  get bytes(): Uint8Array {
    return this.#bytes;
  }
}

function byteDiff(a: number, b: number) {
  const diff = a - b;
  return diff & 0b10000000 ? (diff - 256) % 256 : (diff + 256) % 256;
}
