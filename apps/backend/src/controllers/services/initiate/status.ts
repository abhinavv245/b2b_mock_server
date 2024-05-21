import { NextFunction, Request, Response } from "express";
import {
	SERVICES_BAP_MOCKSERVER_URL,
	MOCKSERVER_ID,
	checkIfCustomized,
	createAuthHeader,
	logger,
	redis,
	redisFetch,
} from "../../../lib/utils";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const initiateStatusController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { transactionId } = req.body;
	const transactionKeys = await redis.keys(`${transactionId}-*`);
	const on_confirm = await redisFetch("on_confirm", transactionId);
	if (!on_confirm) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "On Confirm doesn't exist",
			},
		});
	}
	const statusIndex = transactionKeys.filter((e) =>
		e.includes("status-to-server")
	).length;
	return intializeRequest(res, next, on_confirm, statusIndex);
};

const intializeRequest = async (
	res: Response,
	next: NextFunction,
	transaction: any,
	statusIndex: number
) => {
	const { context } = transaction;
	const { transaction_id } = context;

	const status = {
		context: {
			...context,
			message_id: uuidv4(),
			timestamp: new Date().toISOString(),
			action: "status",
			bap_id: MOCKSERVER_ID,
			bap_uri: SERVICES_BAP_MOCKSERVER_URL,
		},
		message: {
			order_id: transaction.message.order.id,
		},
	};
	const header = await createAuthHeader(status);
	try {
		await redis.set(
			`${transaction_id}-${statusIndex}-status-from-server`,
			JSON.stringify({ request: { ...status } })
		);
		const response = await axios.post(`${context.bpp_uri}/status`, status, {
			headers: {
				// "X-Gateway-Authorization": header,
				authorization: header,
			},
		});

		await redis.set(
			`${transaction_id}-${statusIndex}-status-from-server`,
			JSON.stringify({
				request: { ...status },
				response: {
					response: response.data,
					timestamp: new Date().toISOString(),
				},
			})
		);

		return res.json({
			message: {
				ack: {
					status: "ACK",
				},
			},
			transaction_id,
		});
	} catch (error) {
		return next(error);
	}
};
