import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { AddMemberToConversationForm } from '../forms/AddMemberToConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type JoinConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const AddMemberToConversationModal: React.FC<JoinConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<AddMemberToConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};