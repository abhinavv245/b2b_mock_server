export const VERSION = "2.0.0";

export const DOMAIN = ["ONDC:SRV11"];

export const SRV_FULFILLMENT_TYPE = ["Home-Service", "Store-Service"];
export const SRV_PAYMENT_TYPE = [
	"PRE-FULFILLMENT",
	"ON-FULFILLMENT",
	"POST-FULFILLMENT",
];
export const SRV_FULFILLMENT_STATE = [
	"Pending",
	"At-Location",
	"In-Transit",
	"Completed",
	"Cancelled",
];
export const SRV_ORDER_STATE = [
	"Created",
	"Accepted",
	"In-progress",
	"Completed",
	"Cancelled",
	"Pending",
];
export const GPS_PATTERN =
	"^(-?[0-9]{1,3}(?:.[0-9]{6,15})?),( )*?(-?[0-9]{1,3}(?:.[0-9]{6,15})?)$";
export const SERVICEABILITY = ["location", "category", "type", "val", "unit"];
export const RESCHEDULE_TERMS = [
	"fulfillment_state",
	"reschedule_eligible",
	"reschedule_fee",
	"reschedule_within",
];

export const PAYMENT_COLLECTEDBY = ["BAP", "BPP"];
