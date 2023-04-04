import RpcClient from "bitcoin-core";

export const verify_signature = async ({ address, signature, message }) => {

  if (!address || !signature || !message) {
    return ({ error: "Missing parameters" });
  }

  try {
    console.log({
        host: process.env.BITCOIN_HOST || "localhost",
        port: Number(process.env.BITCOIN_PORT) || 8332,
        username: process.env.BITCOIN_USERNAME || "yourusername",
        password: process.env.BITCOIN_PASSWORD || "yourpassword",
    });
    const rpcClient = new RpcClient({
      host: process.env.BITCOIN_HOST || "localhost",
      port: Number(process.env.BITCOIN_PORT) || 8332,
      username: process.env.BITCOIN_USERNAME || "yourusername",
      password: process.env.BITCOIN_PASSWORD || "yourpassword",
    });

    const result = await rpcClient.verifyMessage(
      address as string,
      signature as string,
      message as string,
    );

    if (!result) {
      return ({ error: "Failed validation" });
    }
    return { result };
  } catch (error) {
    console.error(error);
    return { error: "Failed to verify message" };
  }
};
