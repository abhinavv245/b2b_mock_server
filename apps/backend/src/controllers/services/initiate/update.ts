import { NextFunction, Request, Response } from "express";
import {
	B2B_BAP_MOCKSERVER_URL,
	createAuthHeader,
	MOCKSERVER_ID,
	redis,
	redisFetch,
} from "../../../lib/utils";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { selectController } from "../bpp/select";

export const initiateUpdateController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { scenario, transactionId } = req.body;
	// const transactionKeys = await redis.keys(`${transactionId}-*`);
	// const ifTransactionExist = transactionKeys.filter((e) =>
	// 	e.includes("on_confirm-to-server")
	// );
	// if (ifTransactionExist.length === 0) {
	// 	return res.status(400).json({
	// 		message: {
	// 			ack: {
	// 				status: "NACK",
	// 			},
	// 		},
	// 		error: {
	// 			message: "On Confirm doesn't exist",
	// 		},
	// 	});
	// }

	// const transaction = await redis.mget(ifTransactionExist);
	// const parsedTransaction = transaction.map((ele) => {
	// 	return JSON.parse(ele as string);
	// });
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
	const { context, message } = on_confirm;
	const timestamp = new Date().toISOString();
	context.action = "update";
	context.timestamp = timestamp;

	switch (scenario) {
		case "requote":
			var responseMessage = requoteRequest(message);
			break;
		case "reschedule":
			// var responseMessage = rescheduleRequest(message)
			break;
		default:
			var responseMessage = requoteRequest(message);
			break;
	}
	const update = {
		context,
		// message: responseMessage
	};
	const header = await createAuthHeader(update);

	try {
		await redis.set(
			`${transactionId}-update-from-server`,
			JSON.stringify({ request: { ...update } })
		);
		const response = await axios.post(`${context.bpp_uri}/update`, update, {
			headers: {
				// "X-Gateway-Authorization": header,
				authorization: header,
			},
		});

		await redis.set(
			`${transactionId}-update-from-server`,
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
			transactionId,
		});
	} catch (error) {
		return next(error);
	}
};
function requoteRequest(message: any) {
	let {
		order: { items, payments, fulfillments, quote },
	} = message;
	items = items.map(
		({
			id,
			parent_item_id,
			...every
		}: {
			id: string;
			parent_item_id: object;
		}) => ({
			...every,
			id,
			parent_item_id,
		})
	);
	fulfillments.map((itm: any) => {
		itm.state.descriptor.code = "Completed";
	});

	const responseMessage = {
		id: message.order.id,
		state: message.order.state,
		update_target: "payments",
		provider: {
			id: message.order.provider.id,
		},
		items,
		payments,
		fulfillments: fulfillments.map(({ id, itm }: { id: String; itm: any }) => ({
			...itm,
			stops: itm.stops.map((stop: any) => ({
				...stop,
			})),
		})),
		quote,
	};
	return responseMessage;
}

function rescheduleRequest(message: any) {}
