import { useState } from 'react';
import styles from './configuration.module.css';
import SideBar from '../../ui-components/sidebar/SideBar';
import ChannelPannel from '../../ui-components/channelPannel/channelPannel';

const availableChannels = ['whatsapp', 'email', 'sms'];

const ConfigurationPage = () => {
    const [selectedChannel, setSelectedChannel] = useState<string>('whatsapp');

    return (
        <div className={styles.configContainer}>
            <div className={styles.sidebarContainer}>
                <SideBar
                    setChannel={setSelectedChannel}
                    availableChannels={availableChannels}
                    currentChannel={selectedChannel} // Pass the current channel
                />
            </div>
            <div className={styles.contentContainer}>
                <ChannelPannel channel={selectedChannel} />
            </div>
        </div>
    );
};

export default ConfigurationPage;