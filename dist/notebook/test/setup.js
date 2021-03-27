import fetch from "node-fetch";
const { Crypto } = require("@peculiar/webcrypto");
Object.assign(global, {
    fetch: fetch,
    crypto: new Crypto()
});
//# sourceMappingURL=setup.js.map