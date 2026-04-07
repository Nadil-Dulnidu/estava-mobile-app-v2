import ImageKit from "@imagekit/nodejs";
import env from "./env.js";

const hasImageKitConfig =
  Boolean(env.imageKitPublicKey) &&
  Boolean(env.imageKitPrivateKey) &&
  Boolean(env.imageKitUrlEndpoint);

const imageKit = hasImageKitConfig
  ? new ImageKit({
      publicKey: env.imageKitPublicKey,
      privateKey: env.imageKitPrivateKey,
      urlEndpoint: env.imageKitUrlEndpoint,
    })
  : null;

export { hasImageKitConfig };
export default imageKit;
