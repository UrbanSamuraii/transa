import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { JoinConversationForm } from '../forms/JoinConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type JoinConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const JoinConversationModal: React.FC<JoinConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<JoinConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};