function generateRandomBitString(bits: number): string {
	const byteCount = bits / 8; // Calculate the number of bytes (1 byte = 8 bits)
	const randomValues = new Uint8Array(byteCount); // Create a byte array
	crypto.getRandomValues(randomValues); // Use cryptographic randomness

	return Array.from(randomValues)
		.map((value) => value.toString(16).padStart(2, "0")) // Convert each byte to a 2-char hex string
		.join(""); // Combine all bytes into a single string
}
export default generateRandomBitString;
