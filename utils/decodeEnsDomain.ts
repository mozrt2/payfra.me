/**
 * This function use the standard RFC1035 ( point 3.1 - see https://datatracker.ietf.org/doc/html/rfc1035 )
 * to decode an encoded name.
 * To understand the standard, if we want to encode the value test.eth, this is the structure of the encoded version
 *
 * A) 1 byte to set the number of bytes for the first block of text. In case of test.eth, the first block is 4 letters
 *    (4 bytes), so the byte will be `04` (hex representation)
 * B) 4 bytes (one for each hex character) to encode the value `test`
 * C) 1 byte to represent the next block length (in our case `03`)
 * D) 3 bytes to represent `eth`
 * E) 1 bytes with value 0 to close the string
 *
 * In the example the representation is
 * `04746573740365746800`
 *  | |       | |     |
 *  A |       C |     E
 *    B         D
 *
 * @param data {string} - hex representation of the encoded version of the EnsDomain
 * @return {string} - decoded value representing the ensDomain
 */
export const decodeEnsDomain = (data: string): string => {
  const labels = [];
  let idx = 0;
  if (data.startsWith('0x')) data = data.slice(2);
  const dataBuffer = Buffer.from(data, 'hex');
  while (true) {
    const len = dataBuffer.readUInt8(idx);
    if (len === 0) break;
    labels.push(dataBuffer.slice(idx + 1, idx + len + 1).toString('utf8'));
    idx += len + 1;
  }
  return labels.join('.');
};