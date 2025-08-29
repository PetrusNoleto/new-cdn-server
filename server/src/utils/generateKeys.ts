import generateRandomBitString from "./randomBitStringGenerator";

export async function generateInstalationKeys() {
	try {
		const authorizationKey = generateRandomBitString(256);
		console.log({
			authorizationKey
		});
	} catch (error) {
		console.log(error);
	}
}
generateInstalationKeys();
