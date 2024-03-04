import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { CreateConversationForm } from '../forms/CreateConversationForm'
import OutsideClickHandler from 'react-outside-click-handler';

type CreateConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<CreateConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};