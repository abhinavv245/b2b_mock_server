import { Request, Response } from "express";
import { redis } from "../../lib/utils";

export const analyseController = async (req: Request, res: Response) => {
	var storedTransaction: object[] = [];
	const transactionId = req.params["transactionId"];
	if (!transactionId)
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "Transaction ID not specified",
			},
		});
	const transactionKeys = await redis.keys(`${transactionId}-*`);
	if (transactionKeys.length === 0) return res.json([]);
	if (transactionKeys.filter((e) => e.endsWith("-from-server")).length > 0) {
		var transactions = await redis.mget(
			transactionKeys.filter((e) => e.endsWith("-from-server"))
		);
		storedTransaction.push(
			transactions.map((each) => {
				if (!each) return null;
				var parsed = JSON.parse(each);
				return {
					...parsed,
					type: "from_server",
					action: (parsed.request as any).context.action,
					timestamp: (parsed.request as any).context.timeStamp,
				};
			})
		);
	}
	if (transactionKeys.filter((e) => e.endsWith("-to-server")).length > 0) {
		var transactions = await redis.mget(
			transactionKeys.filter((e) => e.endsWith("-to-server"))
		);
		storedTransaction.push(
			transactions.map((each) => {
				if (!each) return null;
				var parsed = JSON.parse(each);
				return {
					...parsed,
					type: "to_server",
					action: (parsed.request as any).context.action,
					timestamp: (parsed.request as any).context.timeStamp,
				};
			})
		);
	}
	return res.json(storedTransaction.flat());
};
