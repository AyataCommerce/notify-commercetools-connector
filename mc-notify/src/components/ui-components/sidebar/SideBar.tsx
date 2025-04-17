import { useState } from 'react';
import styles from './sidebar.module.css';
import channelIcon from '../../../assets/icons/channel_icon_64.svg';
import dropDown from '../../../assets/icons/dropdown-arrow.svg';
import manageIcon from '../../../assets/icons/manage.svg';
import menuIcon from '../../../assets/icons/menu.svg';
import arrowLeftIcon from '../../../assets/icons/arrow-left.svg';

type SideBarProps = {
    setChannel: (channel: string) => void;
    availableChannels: string[];
    currentChannel: string; // Add currentChannel prop
};

const SideBar = ({ setChannel, availableChannels, currentChannel }: SideBarProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        channels: true
    });

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleChannelSelect = (channel: string) => {
        setChannel(channel);
    };

    return (
        <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
            <div className={styles.mobileHeader}>
                <button onClick={toggleSidebar} className={styles.mobileToggle}>
                    {isSidebarOpen ? <img src={arrowLeftIcon} alt="Close menu" />
                        : <img src={menuIcon} alt="Open menu" />
                    }
                </button>
            </div>
            <nav className={styles.nav}>
                <div className={styles.sidebarHeader}>
                    <img src={manageIcon} alt="manage" />
                    <h3>Manage Notify</h3>
                </div>
                <div className={styles.divider} />
                <ul className={styles.menuList}>
                    <li className={styles.menuItem}>
                        <div
                            className={styles.menuHeader}
                            onClick={() => toggleSection('channels')}
                        >
                            <div className={styles.menuTitle}>
                                <img src={channelIcon} alt="Channel Icon" className={styles.icon} />
                                <span>Channels</span>
                            </div>
                            <img
                                src={dropDown}
                                className={`${styles.arrow} ${openSections['channels'] ? styles.rotated : ''}`}
                                alt="Dropdown Arrow"
                            />
                        </div>
                        <ul className={`${styles.subMenu} ${openSections['channels'] ? styles.active : ''}`}>
                            {availableChannels.map((channel) => (
                                <li
                                    key={channel}
                                    className={`${styles.subMenuItem} ${currentChannel === channel ? styles.selected : ''}`}
                                    onClick={() => handleChannelSelect(channel)}
                                >
                                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                                </li>
                            ))}
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default SideBar;