export class RNG {
    m_w = 123456789;
    m_z = 987654321;
    mask = 0xffffffff;

    constructor(seed) {
        // Initialize the state with the provided seed
        this.m_w = (123456789 + seed) & this.mask;
        this.m_z = (987654321 - seed) & this.mask;
    }

    /**
     * Returns a number between 0 (inclusive) and 1.0 (exclusive),
     * just like Math.random.
     */
    random() {
        // Update the state
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;

        // Combine the two parts and scale to [0, 1)
        let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;  // Ensure unsigned 32-bit integer
        result /= 4294967296;  // Divide by 2^32 to get a number in the range [0, 1)

        return result;
    }
}
