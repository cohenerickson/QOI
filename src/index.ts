import Encoder from "./Encoder";
import Decoder from "./Decoder";

const channels = {
  RGB: 3,
  RGBA: 4
} as const;

const colorspace = {
  sRGB: 0,
  linear: 1
} as const;

export { Encoder, Decoder, channels, colorspace };
