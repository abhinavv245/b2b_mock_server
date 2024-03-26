import { UnControlled as CodeMirror } from "react-codemirror2";
import Button from "@mui/joy/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import SendTwoToneIcon from "@mui/icons-material/SendTwoTone";
import CancelTwoToneIcon from "@mui/icons-material/CancelTwoTone";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript.js";
import Divider from "@mui/material/Divider";

type LogDialogPropType = {
	open: boolean;
	onClose: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	log: any;
};

export const LogDialog = ({ open, onClose, log }: LogDialogPropType) => {
	console.log("DIALOG", log);
	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle variant="h5">Request Analyser</DialogTitle>
			<DialogContent>
				{log.action && (
					<Stack direction="row" spacing={2} alignItems="center">
						<Typography>Action:</Typography>
						<Typography variant="body2" color="text.secondary">
							/{log.action}
						</Typography>
					</Stack>
				)}

				<Divider sx={{ my: 2 }} />
				{log.request && (
					<>
						<Typography variant="h6">Request:</Typography>
						<Stack direction="row" spacing={2} alignItems="center">
							<Typography>Request Timestamp:</Typography>
							<Typography variant="body2" color="text.secondary">
								{log.request.context.timestamp}
							</Typography>
						</Stack>
						<CodeMirror
							value={JSON.stringify(log.request, null, 2)}
							autoCursor={false}
							options={{
								readOnly: "nocursor",
								theme: "material",
								height: "auto",
								viewportMargin: Infinity,
								mode: {
									name: "javascript",
									json: true,
									statementIndent: 2,
								},
								lineNumbers: true,
								lineWrapping: true,
								indentWithTabs: false,
								tabSize: 2,
							}}
						/>
					</>
				)}
				<Divider sx={{ my: 2 }} />
				{log.response && (
					<>
						<Typography variant="h6">Response:</Typography>
						<Stack direction="row" spacing={2} alignItems="center">
							<Typography>Response Timestamp:</Typography>
							<Typography variant="body2" color="text.secondary">
								{log.response.timestamp}
							</Typography>
						</Stack>
						<CodeMirror
							value={JSON.stringify(log.response.response, null, 2)}
							autoCursor={false}
							options={{
								readOnly: "nocursor",
								theme: "material",
								height: "auto",
								viewportMargin: Infinity,
								mode: {
									name: "javascript",
									json: true,
									statementIndent: 2,
								},
								lineNumbers: true,
								lineWrapping: true,
								indentWithTabs: false,
								tabSize: 2,
							}}
						/>
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button
					variant="outlined"
					color="warning"
					startDecorator={<CancelTwoToneIcon />}
					onClick={onClose}
				>
					Close
				</Button>
				<Button color="success" endDecorator={<SendTwoToneIcon />} disabled>
					Resend Request
				</Button>
			</DialogActions>
		</Dialog>
	);
};
