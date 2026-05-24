const crypto = require('crypto-js');
const base64url = require ('base64url');
const config = require('rc')('lambda', {
    encryption: {
        authentication: 'Uzair@123',
         provider_secrets: process.env.PROVIDER_SECRETS_KEY || 'change-me-in-env'  // ADD

    }
});
module.exports = {
    encrypt: async (input, passwordKey) => {
        const result = crypto.AES.encrypt(input, config.encryption[passwordKey]);
        const urlSafeString = result.toString(); 
        return base64url.fromBase64(urlSafeString);

    },
    decrypt: async (input, passwordKey) => {
        const safeString = base64url.toBase64(input)
        const result =  crypto.AES.decrypt(safeString, config.encryption[passwordKey]);
        return result.toString(crypto.enc.Utf8);
    }
}