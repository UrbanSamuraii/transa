import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { MuteMemberInConversationForm } from '../forms/MuteMemberInConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type MuteConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const MuteMemberInConversationModal: React.FC<MuteConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<MuteMemberInConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};