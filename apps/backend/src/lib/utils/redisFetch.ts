import { redis } from "./redis"
async function redisFetch(action: string, transaction_id: string) {
    const transactionKeys = await redis.keys(`${transaction_id}-*`);
    const ifTransactionExist = transactionKeys.filter((e) =>
        e.includes(`${action}-to-server`)
    );

    if (ifTransactionExist.length === 0) {
        return null
    }
    const transaction = await redis.mget(ifTransactionExist);
    const parsedTransaction = transaction.map((ele: any) => {
        return JSON.parse(ele as string);
    });

    return parsedTransaction[0].request
}

async function redisExist(action: string, transaction_id: string) {
    const transactionKeys = await redis.keys(`${transaction_id}-*`);
    const ifTransactionExist = transactionKeys.filter((e) =>
        e.includes(`${action}-to-server`)
    );

    if (ifTransactionExist.length === 0) {
        return false
    }
    else
        return true
}
export { redisFetch, redisExist }