import { OverlayStyle, OverlayContent } from '../../utils/styles';
import { CreateConversationMenu, CreateConversationMenuProps } from '../conversations/ConversationGlobalMenu';
import OutsideClickHandler from 'react-outside-click-handler';

export const ConversationMenuModal: React.FC<CreateConversationMenuProps> = ({ setShowModal, onClose, onOptionClick }) => {

    return (
        <OverlayStyle>
            <OutsideClickHandler onOutsideClick={() => {
                console.log('Close Modal');
                setShowModal(false);}}>
                <OverlayContent>
                    <CreateConversationMenu onClose={onClose} onOptionClick={onOptionClick} setShowModal={setShowModal} />
                </OverlayContent>
            </OutsideClickHandler>
        </OverlayStyle>
    );
};