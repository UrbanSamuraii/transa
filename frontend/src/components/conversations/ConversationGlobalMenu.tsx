import { FC } from "react";
import './GlobalConversations.css'

export interface CreateConversationMenuProps {
    setShowModal: (show: boolean) => void;
    onClose: () => void;
    onOptionClick: (option: string) => void;
}
  
export const CreateConversationMenu: FC<CreateConversationMenuProps> = ({ onClose, onOptionClick, setShowModal }) => {
    return (
        <div className="menu-container">
            <button className="menu-button" onClick={() => onOptionClick('create')}>Create a chat</button>
            <button className="menu-button" onClick={() => onOptionClick('join')}>Join a chat</button>
            <button className="menu-button" onClick={() => onOptionClick('block')}>Block a user</button>
            <button className="menu-button" onClick={() => onOptionClick('unblock')}>Unblock a user</button>
        </div>
    );
};
