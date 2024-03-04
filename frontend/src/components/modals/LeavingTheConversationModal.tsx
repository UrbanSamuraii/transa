import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { LeavingConversationForm } from '../forms/LeavingConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type LeaveConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const LeavingConversationModal: React.FC<LeaveConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<LeavingConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};