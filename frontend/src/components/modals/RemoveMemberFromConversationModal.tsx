import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { RemoveMemberFromConversationForm } from '../forms/RemoveMemberFromConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type RemoveFromConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const RemoveMemberFromConversationModal: React.FC<RemoveFromConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<RemoveMemberFromConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};
