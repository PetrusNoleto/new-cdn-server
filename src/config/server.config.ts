import dotenv from "dotenv";
dotenv.config();

export const serverPort: string | undefined = process.env.SERVER_PORT;
export const serverHost: string | undefined = process.env.SERVER_HOST;
export const serverAddress: string | undefined = process.env.SERVER_ADDRESS;
export const storagePath: string | undefined = process.env.STORAGE_PATH;
export const bodyLimit = 5 * 1024 * 1024;
export const serverConfig = {
	port: serverPort,
	host: serverHost,
	address: serverAddress,
	storagePath: storagePath,
};
export default serverConfig;
