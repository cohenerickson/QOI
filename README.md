# QOI

QOI utilities implemented in Typescript for the client.

# API

## Classes

### Encoder

Encode raw image data to QOI.

#### Paramaters
 - *data: A Uint8Array containing the pixel information (left to right, top to bottom)*
 - options
   - *width: Image width*
   - *height: Image height*
   - *channels: Number of color channels*
     - 3: RGB, 4: RGBA
   - *colorspace: Colorspace (purely informative)*
     - 0: sRGB (with linear alpha), 1: linear

#### Values
 - *bytes: Raw binary of encoded image.*
 - *blob: Blob representation of binary data.*

#### Methods
 - 

#### Examples

Encode a white 2x2 image using sRGB (with linear alpha).

```ts
const imageData = new Uint8Array([255,255,255,255, 255,255,255,255, 255,255,255,255, 255,255,255,255]);

const encoder = new QOI.Encoder(imageData, {
  width: 2,
  height: 2,
  channels: QOI.channels.RGBA,
  colorspace: QOI.colorspace.sRGB
});

const url = URL.createObjectURL(encoder.blob);

open(url);
```

### Decoder

## Constants

### channels
 - RGB - 3
 - RGBA - 4

### colorspace
 - sRGB - 0
 - linear - 1
