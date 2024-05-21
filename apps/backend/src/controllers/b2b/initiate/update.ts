import { NextFunction, Request, Response } from "express";
import {
	B2B_BAP_MOCKSERVER_URL,
	createAuthHeader,
	MOCKSERVER_ID,
	redis,
} from "../../../lib/utils";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export const initiateUpdateController = async (req: Request, res: Response, next: NextFunction) => {
	const { update_targets, transactionId } = req.body;

	const transactionKeys = await redis.keys(`${transactionId}-*`);
	const ifTransactionExist = transactionKeys.filter((e) =>
		e.includes("on_confirm-to-server")
	);

	if (ifTransactionExist.length === 0) {
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

	const transaction = await redis.mget(ifTransactionExist);
	const parsedTransaction = transaction.map((ele) => {
		return JSON.parse(ele as string);
	});

	const onConfirm = parsedTransaction[0].request;

	if (
		onConfirm.context.ttl !== "1D" ||
		!onConfirm.message.order.payments.every(
			(p: { type: string }) => p.type === "PRE-FULFILLMENT"
		)
	)
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "Update targets are allowed for RFQ flows only",
			},
		});

	// console.log("parsedTransaction:::: ", parsedTransaction[0]);
	return intializeRequest(res, next, update_targets, onConfirm);
};

async function intializeRequest(
	res: Response,
	next: NextFunction,
	update_target: "payments",
	transaction: any
) {
	const { context, message } = transaction;
	const { transaction_id } = context;
	const timestamp = new Date().toISOString();

	let {
		order: { items, payments },
	} = message;

	items = items.map(({ id, quantity }: { id: string; quantity: object }) => ({
		id,
		quantity,
	}));
	payments = payments.map(
		({
			tags,
			params,
			...remainingPayments
		}: {
			tags: object;
			params: object;
		}) => ({
			...remainingPayments,
			params: { ...params, transaction_id: uuidv4() },
			tl_method: "http/get",
			status: "PAID",
		})
	);

	const update = {
		context: {
			...context,
			timestamp,
			action: "update",
			bap_id: MOCKSERVER_ID,
			bap_uri: B2B_BAP_MOCKSERVER_URL,
			message_id: uuidv4(),
		},
		message: {
			update_target,
			order: {
				id: message.order.id,
				state: message.order.state,
				provider: {
					id: message.order.provider.id,
				},
				items,
				payments,
			},
		},
	};

	const header = await createAuthHeader(update);

	try {
		await redis.set(
			`${transaction_id}-update-from-server`,
			JSON.stringify({ request: { ...update } })
		);
		const response = await axios.post(`${context.bpp_uri}/update`, update, {
			headers: {
				authorization: header,
			},
		});
		await redis.set(
			`${transaction_id}-update-from-server`,
			JSON.stringify({
				request: { ...update },
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
		return next(error)
	}
}
