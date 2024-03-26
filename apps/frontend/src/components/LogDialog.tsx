import Button from "@mui/joy/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import SendTwoToneIcon from "@mui/icons-material/SendTwoTone";
import CancelTwoToneIcon from "@mui/icons-material/CancelTwoTone";

type LogDialogPropType = {
	open: boolean;
	onClose: () => void;
	log: object;
};

export const LogDialog = ({ open, onClose }: LogDialogPropType) => {
	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Request Analyser</DialogTitle>
			<DialogContent></DialogContent>
			<DialogActions>
				<Button
					variant="outlined"
					color="warning"
					startDecorator={<CancelTwoToneIcon />}
				>
					Close
				</Button>
				<Button color="success" endDecorator={<SendTwoToneIcon />}>
					Resend Request
				</Button>
			</DialogActions>
		</Dialog>
	);
};
