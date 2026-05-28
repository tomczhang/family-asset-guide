"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const crypto_js_1 = tslib_1.__importDefault(require("crypto-js"));
class PDFSecurity {
    static create(context, options) {
        return new PDFSecurity(context, options);
    }
    constructor(context, options) {
        if (!options.ownerPassword && !options.userPassword) {
            throw new Error('Either an owner password or a user password must be specified.');
        }
        this.context = context;
        this.initialize(options);
    }
    initialize(options) {
        this.id = generateFileID();
        let v;
        switch (this.context.header.getVersionString()) {
            case '1.4':
            case '1.5':
                v = 2;
                break;
            case '1.6':
            case '1.7':
                v = 4;
                break;
            case '1.7ext3':
                v = 5;
                break;
            default:
                v = 1;
                break;
        }
        switch (v) {
            case 1:
            case 2:
            case 4:
                this.encryption = this.initializeV1V2V4(v, options);
                break;
            case 5:
                this.encryption = this.initializeV5(options);
                break;
        }
    }
    initializeV1V2V4(v, options) {
        const encryption = {
            Filter: 'Standard',
        };
        let r;
        let permissions;
        switch (v) {
            case 1:
                r = 2;
                this.keyBits = 40;
                permissions = getPermissionsR2(options.permissions);
                break;
            case 2:
                r = 3;
                this.keyBits = 128;
                permissions = getPermissionsR3(options.permissions);
                break;
            case 4:
                r = 4;
                this.keyBits = 128;
                permissions = getPermissionsR3(options.permissions);
                break;
            default:
                throw new Error(`Unsupported algorithm '${v}'.`);
        }
        const paddedUserPassword = processPasswordR2R3R4(options.userPassword);
        const paddedOwnerPassword = options.ownerPassword
            ? processPasswordR2R3R4(options.ownerPassword)
            : paddedUserPassword;
        const ownerPasswordEntry = getOwnerPasswordR2R3R4(r, this.keyBits, paddedUserPassword, paddedOwnerPassword);
        this.encryptionKey = getEncryptionKeyR2R3R4(r, this.keyBits, this.id, paddedUserPassword, ownerPasswordEntry, permissions);
        let userPasswordEntry;
        if (r === 2) {
            userPasswordEntry = getUserPasswordR2(this.encryptionKey);
        }
        else {
            userPasswordEntry = getUserPasswordR3R4(this.id, this.encryptionKey);
        }
        encryption.V = v;
        if (v >= 2) {
            encryption.Length = this.keyBits;
        }
        if (v === 4) {
            encryption.CF = {
                StdCF: {
                    AuthEvent: 'DocOpen',
                    CFM: 'AESV2',
                    Length: this.keyBits / 8,
                },
            };
            encryption.StmF = 'StdCF';
            encryption.StrF = 'StdCF';
        }
        encryption.R = r;
        encryption.O = wordArrayToBuffer(ownerPasswordEntry);
        encryption.U = wordArrayToBuffer(userPasswordEntry);
        encryption.P = permissions;
        return encryption;
    }
    initializeV5(options) {
        const encryption = {
            Filter: 'Standard',
        };
        this.keyBits = 256;
        this.encryptionKey = getEncryptionKeyR5(generateRandomWordArray);
        const processedUserPassword = processPasswordR5(options.userPassword);
        const userPasswordEntry = getUserPasswordR5(processedUserPassword, generateRandomWordArray);
        const userKeySalt = crypto_js_1.default.lib.WordArray.create(userPasswordEntry.words.slice(10, 12), 8);
        const userEncryptionKeyEntry = getUserEncryptionKeyR5(processedUserPassword, userKeySalt, this.encryptionKey);
        const processedOwnerPassword = options.ownerPassword
            ? processPasswordR5(options.ownerPassword)
            : processedUserPassword;
        const ownerPasswordEntry = getOwnerPasswordR5(processedOwnerPassword, userPasswordEntry, generateRandomWordArray);
        const ownerKeySalt = crypto_js_1.default.lib.WordArray.create(ownerPasswordEntry.words.slice(10, 12), 8);
        const ownerEncryptionKeyEntry = getOwnerEncryptionKeyR5(processedOwnerPassword, ownerKeySalt, userPasswordEntry, this.encryptionKey);
        const permissions = getPermissionsR3(options.permissions);
        const permissionsEntry = getEncryptedPermissionsR5(permissions, this.encryptionKey, generateRandomWordArray);
        encryption.V = 5;
        encryption.Length = this.keyBits;
        encryption.CF = {
            StdCF: {
                AuthEvent: 'DocOpen',
                CFM: 'AESV3',
                Length: this.keyBits / 8,
            },
        };
        encryption.StmF = 'StdCF';
        encryption.StrF = 'StdCF';
        encryption.R = 5;
        encryption.O = wordArrayToBuffer(ownerPasswordEntry);
        encryption.OE = wordArrayToBuffer(ownerEncryptionKeyEntry);
        encryption.U = wordArrayToBuffer(userPasswordEntry);
        encryption.UE = wordArrayToBuffer(userEncryptionKeyEntry);
        encryption.P = permissions;
        encryption.Perms = wordArrayToBuffer(permissionsEntry);
        return encryption;
    }
    getEncryptFn(obj, gen) {
        const v = this.encryption.V;
        let digest;
        let key;
        if (v < 5) {
            digest = this.encryptionKey
                .clone()
                .concat(crypto_js_1.default.lib.WordArray.create([
                ((obj & 0xff) << 24) |
                    ((obj & 0xff00) << 8) |
                    ((obj >> 8) & 0xff00) |
                    (gen & 0xff),
                (gen & 0xff00) << 16,
            ], 5));
            if (v === 1 || v === 2) {
                key = crypto_js_1.default.MD5(digest);
                key.sigBytes = Math.min(16, this.keyBits / 8 + 5);
                return (buffer) => wordArrayToBuffer(crypto_js_1.default.RC4.encrypt(crypto_js_1.default.lib.WordArray.create(buffer), key).ciphertext);
            }
            if (v === 4) {
                key = crypto_js_1.default.MD5(digest.concat(crypto_js_1.default.lib.WordArray.create([0x73416c54], 4)));
            }
        }
        else if (v === 5) {
            key = this.encryptionKey;
        }
        else {
            throw new Error(`Unsupported algorithm '${v}'.`);
        }
        const iv = generateRandomWordArray(16);
        const options = {
            mode: crypto_js_1.default.mode.CBC,
            padding: crypto_js_1.default.pad.Pkcs7,
            iv,
        };
        return (buffer) => wordArrayToBuffer(iv
            .clone()
            .concat(crypto_js_1.default.AES.encrypt(crypto_js_1.default.lib.WordArray.create(buffer), key, options).ciphertext));
    }
    encrypt() {
        const ID = this.context.obj([this.id, this.id]);
        this.context.trailerInfo.ID = ID;
        const Encrypt = this.context.obj(this.encryption);
        this.context.trailerInfo.Encrypt = this.context.register(Encrypt);
        return this;
    }
}
/**
 * A file ID is required if Encrypt entry is present in Trailer
 * Doesn't really matter what it is as long as it is consistently
 * used.
 *
 * @returns Uint8Array
 */
const generateFileID = () => wordArrayToBuffer(crypto_js_1.default.MD5(Date.now().toString()));
const generateRandomWordArray = (bytes) => crypto_js_1.default.lib.WordArray.random(bytes);
/**
 * Get Permission Flag for use Encryption Dictionary (Key: P)
 * For Security Handler revision 2
 *
 * Only bit position 3,4,5,6,9,10,11 and 12 is meaningful
 * Refer Table 22 - User access permission
 * @param  {permissions} {@link UserPermissions}
 * @returns number - Representing unsigned 32-bit integer
 */
const getPermissionsR2 = (permissions = {}) => {
    let flags = 0xffffffc0 >> 0;
    if (permissions.printing) {
        flags |= 0b000000000100;
    }
    if (permissions.modifying) {
        flags |= 0b000000001000;
    }
    if (permissions.copying) {
        flags |= 0b000000010000;
    }
    if (permissions.annotating) {
        flags |= 0b000000100000;
    }
    return flags;
};
/**
 * Get Permission Flag for use Encryption Dictionary (Key: P)
 * For Security Handler revision 2
 *
 * Only bit position 3,4,5,6,9,10,11 and 12 is meaningful
 * Refer Table 22 - User access permission
 * @param  {permissions} {@link UserPermissions}
 * @returns number - Representing unsigned 32-bit integer
 */
const getPermissionsR3 = (permissions = {}) => {
    let flags = 0xfffff0c0 >> 0;
    if (permissions.printing === 'lowResolution' || permissions.printing) {
        flags |= 0b000000000100;
    }
    if (permissions.printing === 'highResolution') {
        flags |= 0b100000000100;
    }
    if (permissions.modifying) {
        flags |= 0b000000001000;
    }
    if (permissions.copying) {
        flags |= 0b000000010000;
    }
    if (permissions.annotating) {
        flags |= 0b000000100000;
    }
    if (permissions.fillingForms) {
        flags |= 0b000100000000;
    }
    if (permissions.contentAccessibility) {
        flags |= 0b001000000000;
    }
    if (permissions.documentAssembly) {
        flags |= 0b010000000000;
    }
    return flags;
};
const getUserPasswordR2 = (encryptionKey) => crypto_js_1.default.RC4.encrypt(processPasswordR2R3R4(), encryptionKey).ciphertext;
const getUserPasswordR3R4 = (documentId, encryptionKey) => {
    const key = encryptionKey.clone();
    let cipher = crypto_js_1.default.MD5(processPasswordR2R3R4().concat(crypto_js_1.default.lib.WordArray.create(documentId)));
    for (let i = 0; i < 20; i++) {
        const xorRound = Math.ceil(key.sigBytes / 4);
        for (let j = 0; j < xorRound; j++) {
            key.words[j] =
                encryptionKey.words[j] ^ (i | (i << 8) | (i << 16) | (i << 24));
        }
        cipher = crypto_js_1.default.RC4.encrypt(cipher, key).ciphertext;
    }
    return cipher.concat(crypto_js_1.default.lib.WordArray.create(null, 16));
};
const getOwnerPasswordR2R3R4 = (r, keyBits, paddedUserPassword, paddedOwnerPassword) => {
    let digest = paddedOwnerPassword;
    let round = r >= 3 ? 51 : 1;
    for (let i = 0; i < round; i++) {
        digest = crypto_js_1.default.MD5(digest);
    }
    const key = digest.clone();
    key.sigBytes = keyBits / 8;
    let cipher = paddedUserPassword;
    round = r >= 3 ? 20 : 1;
    for (let i = 0; i < round; i++) {
        const xorRound = Math.ceil(key.sigBytes / 4);
        for (let j = 0; j < xorRound; j++) {
            key.words[j] = digest.words[j] ^ (i | (i << 8) | (i << 16) | (i << 24));
        }
        cipher = crypto_js_1.default.RC4.encrypt(cipher, key).ciphertext;
    }
    return cipher;
};
const getEncryptionKeyR2R3R4 = (r, keyBits, documentId, paddedUserPassword, ownerPasswordEntry, permissions) => {
    let key = paddedUserPassword
        .clone()
        .concat(ownerPasswordEntry)
        .concat(crypto_js_1.default.lib.WordArray.create([lsbFirstWord(permissions)], 4))
        .concat(crypto_js_1.default.lib.WordArray.create(documentId));
    const round = r >= 3 ? 51 : 1;
    for (let i = 0; i < round; i++) {
        key = crypto_js_1.default.MD5(key);
        key.sigBytes = keyBits / 8;
    }
    return key;
};
const getUserPasswordR5 = (processedUserPassword, randomWordArrayGenerator) => {
    const validationSalt = randomWordArrayGenerator(8);
    const keySalt = randomWordArrayGenerator(8);
    return crypto_js_1.default.SHA256(processedUserPassword.clone().concat(validationSalt))
        .concat(validationSalt)
        .concat(keySalt);
};
const getUserEncryptionKeyR5 = (processedUserPassword, userKeySalt, encryptionKey) => {
    const key = crypto_js_1.default.SHA256(processedUserPassword.clone().concat(userKeySalt));
    const options = {
        mode: crypto_js_1.default.mode.CBC,
        padding: crypto_js_1.default.pad.NoPadding,
        iv: crypto_js_1.default.lib.WordArray.create(null, 16),
    };
    return crypto_js_1.default.AES.encrypt(encryptionKey, key, options).ciphertext;
};
const getOwnerPasswordR5 = (processedOwnerPassword, userPasswordEntry, randomWordArrayGenerator) => {
    const validationSalt = randomWordArrayGenerator(8);
    const keySalt = randomWordArrayGenerator(8);
    return crypto_js_1.default.SHA256(processedOwnerPassword
        .clone()
        .concat(validationSalt)
        .concat(userPasswordEntry))
        .concat(validationSalt)
        .concat(keySalt);
};
const getOwnerEncryptionKeyR5 = (processedOwnerPassword, ownerKeySalt, userPasswordEntry, encryptionKey) => {
    const key = crypto_js_1.default.SHA256(processedOwnerPassword
        .clone()
        .concat(ownerKeySalt)
        .concat(userPasswordEntry));
    const options = {
        mode: crypto_js_1.default.mode.CBC,
        padding: crypto_js_1.default.pad.NoPadding,
        iv: crypto_js_1.default.lib.WordArray.create(null, 16),
    };
    return crypto_js_1.default.AES.encrypt(encryptionKey, key, options).ciphertext;
};
const getEncryptionKeyR5 = (randomWordArrayGenerator) => randomWordArrayGenerator(32);
const getEncryptedPermissionsR5 = (permissions, encryptionKey, randomWordArrayGenerator) => {
    const cipher = crypto_js_1.default.lib.WordArray.create([lsbFirstWord(permissions), 0xffffffff, 0x54616462], 12).concat(randomWordArrayGenerator(4));
    const options = {
        mode: crypto_js_1.default.mode.ECB,
        padding: crypto_js_1.default.pad.NoPadding,
    };
    return crypto_js_1.default.AES.encrypt(cipher, encryptionKey, options).ciphertext;
};
const processPasswordR2R3R4 = (password = '') => {
    const out = new Uint8Array(32);
    const length = password.length;
    let index = 0;
    while (index < length && index < 32) {
        const code = password.charCodeAt(index);
        if (code > 0xff) {
            throw new Error('Password contains one or more invalid characters.');
        }
        out[index] = code;
        index++;
    }
    while (index < 32) {
        out[index] = PASSWORD_PADDING[index - length];
        index++;
    }
    return crypto_js_1.default.lib.WordArray.create(out);
};
const processPasswordR5 = (password = '') => {
    // NOTE: Removed this line to eliminate need for the saslprep dependency.
    // Probably worth investigating the cases that would be impacted by this.
    // password = unescape(encodeURIComponent(saslprep(password)));
    const length = Math.min(127, password.length);
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        out[i] = password.charCodeAt(i);
    }
    return crypto_js_1.default.lib.WordArray.create(out);
};
const lsbFirstWord = (data) => ((data & 0xff) << 24) |
    ((data & 0xff00) << 8) |
    ((data >> 8) & 0xff00) |
    ((data >> 24) & 0xff);
const wordArrayToBuffer = (wordArray) => {
    const byteArray = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
        byteArray.push((wordArray.words[Math.floor(i / 4)] >> (8 * (3 - (i % 4)))) & 0xff);
    }
    return Uint8Array.from(byteArray);
};
/*
  7.6.3.3 Encryption Key Algorithm
  Algorithm 2
  Password Padding to pad or truncate
  the password to exactly 32 bytes
*/
const PASSWORD_PADDING = [
    0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff,
    0xfa, 0x01, 0x08, 0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c,
    0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
];
exports.default = PDFSecurity;
//# sourceMappingURL=PDFSecurity.js.map