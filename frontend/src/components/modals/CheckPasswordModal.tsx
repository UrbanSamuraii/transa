import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { CheckPasswordForm } from '../forms/CheckPasswordForm';
import OutsideClickHandler from 'react-outside-click-handler';

type CheckPasswordModalProps = {
	setShowModal: (show: boolean) => void;
	convId: number | null;
};

export const CheckPasswordModal: React.FC<CheckPasswordModalProps> = ({ setShowModal, convId }) => {
// export const CheckPasswordModal: React.FC<CheckPasswordModalProps> = ({ setShowModal }) => {
	// console.log('MODAL convId:', convId !== null ? convId : 'null');
	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Check Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<CheckPasswordForm setShowModal={setShowModal} conversationId={convId}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};