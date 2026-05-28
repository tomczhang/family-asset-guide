import DecodeStream from './DecodeStream.js';
const chunkSize = 512;
class DecryptStream extends DecodeStream {
    constructor(stream, decrypt, maybeLength) {
        super(maybeLength);
        this.stream = stream;
        this.decrypt = decrypt;
        this.nextChunk = null;
        this.initialized = false;
    }
    readBlock() {
        let chunk;
        if (this.initialized) {
            chunk = this.nextChunk;
        }
        else {
            chunk = this.stream.getBytes(chunkSize);
            this.initialized = true;
        }
        if (!chunk || chunk.length === 0) {
            this.eof = true;
            return;
        }
        this.nextChunk = this.stream.getBytes(chunkSize);
        const hasMoreData = this.nextChunk && this.nextChunk.length > 0;
        const decrypt = this.decrypt;
        chunk = decrypt(chunk, !hasMoreData);
        const bufferLength = this.bufferLength;
        const newLength = bufferLength + chunk.length;
        const buffer = this.ensureBuffer(newLength);
        buffer.set(chunk, bufferLength);
        this.bufferLength = newLength;
    }
}
export default DecryptStream;
//# sourceMappingURL=DecryptStream.js.map