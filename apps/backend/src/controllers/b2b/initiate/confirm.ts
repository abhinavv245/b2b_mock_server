import { NextFunction, Request, Response } from "express";
import {
	B2B_BAP_MOCKSERVER_URL,
	MOCKSERVER_ID,
	createAuthHeader,
	logger,
	redis,
} from "../../../lib/utils";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const initiateConfirmController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { scenario, transactionId } = req.body;

	const transactionKeys = await redis.keys(`${transactionId}-*`);
	const ifTransactionExist = transactionKeys.filter((e) =>
		e.includes("on_init-to-server")
	);

	if (ifTransactionExist.length === 0) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "On Init doesn't exist",
			},
		});
	}
	const transaction = await redis.mget(ifTransactionExist);
	const parsedTransaction = transaction.map((ele) => {
		return JSON.parse(ele as string);
	});

	// console.log("parsedTransaction:::: ", parsedTransaction[0]);
	return intializeRequest(res, next, parsedTransaction[0].request, scenario);
};

const intializeRequest = async (
	res: Response,
	next: NextFunction,
	transaction: any,
	scenario: string
) => {
	const {
		context,
		message: {
			order: { provider, provider_location, tags, ...order },
		},
	} = transaction;
	const { transaction_id } = context;
	const timestamp = new Date().toISOString();

	const confirm = {
		context: {
			...context,
			timestamp,
			action: "confirm",
			bap_id: MOCKSERVER_ID,
			bap_uri: B2B_BAP_MOCKSERVER_URL,
			message_id: uuidv4()
		},
		message: {
			order: {
				...order,
				id: uuidv4(),
				state: "Created",
				provider: {
					id: provider.id,
					locations: [
						{
							...provider_location,
						},
					],
				},
				fulfillments: order.fulfillments.map(
					({ id, type, tracking, stops }: any) => ({
						id,
						type,
						tracking,
						stops,
					})
				),
				payments: [
					{
						...order.payments[0],
						params: {
							currency: order.quote.price.currency,
							amount: order.quote.price.value,
						},
						status: "NOT-PAID",
						"@ondc/org/settlement_details": [
							{
								settlement_counterparty: "buyer-app",
								settlement_phase: "sale-amount",
								settlement_type: "upi",
								upi_address: "gft@oksbi",
								settlement_bank_account_no: "XXXXXXXXXX",
								settlement_ifsc_code: "XXXXXXXXX",
								beneficiary_name: "xxxxx",
								bank_name: "xxxx",
								branch_name: "xxxx",
							},
						],
					},
				],
				tags: [
					...tags,
					{
						descriptor: {
							code: "bap_terms",
						},
						list: [
							{
								descriptor: {
									code: "accept_bpp_terms",
								},
								value: "Y",
							},
						],
					},
				],
				created_at: timestamp,
				updated_at: timestamp,
			},
		},
	};

	const header = await createAuthHeader(confirm);
	try {
		await redis.set(
			`${transaction_id}-confirm-from-server`,
			JSON.stringify({ request: { ...confirm } })
		);
		const response = await axios.post(`${context.bpp_uri}/confirm?scenario=${scenario}`, confirm, {
			headers: {
				// "X-Gateway-Authorization": header,
				authorization: header,
			},
		});
		await redis.set(
			`${transaction_id}-confirm-from-server`,
			JSON.stringify({
				request: { ...confirm },
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
};
