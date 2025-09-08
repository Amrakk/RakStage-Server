export function bufferToBase64(buffer: Uint8Array<ArrayBufferLike>): string {
    return btoa(String.fromCharCode(...buffer));
}

export function base64ToBuffer(base64: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
