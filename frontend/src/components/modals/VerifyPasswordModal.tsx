import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { VerifyPasswordForm } from '../forms/VerifyPasswordForm'
import OutsideClickHandler from 'react-outside-click-handler';

type VerifyOldPasswordModalProps = {
	setShowModal: (show: boolean) => void;
};

export const VerifyPasswordModal: React.FC<VerifyOldPasswordModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<VerifyPasswordForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};