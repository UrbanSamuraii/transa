import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { UnMuteMemberInConversationForm } from '../forms/UnMuteMemberInConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type UnMuteConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const UnMuteMemberInConversationModal: React.FC<UnMuteConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<UnMuteMemberInConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};