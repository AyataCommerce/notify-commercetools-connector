import { useAsyncDispatch } from '@commercetools-frontend/sdk';
import { useEffect, useState } from 'react';
import addIcon from '../../../assets/icons/add-circle.svg';
import bellIcon from '../../../assets/icons/bell-24.png';
import closeIcon from '../../../assets/icons/close-circle.svg';
import logIcon from '../../../assets/icons/logs.svg';
import settingsIcon from '../../../assets/icons/settings_icon.svg';
import whatsappIcon from '../../../assets/icons/whatsapp-symbol.svg';
import emailIcon from '../../../assets/icons/email-symbol.svg';
import smsIcon from '../../../assets/icons/smartphone-sms.svg';
import { toggleChannelStatusHook } from '../../../hooks/channel/updateChannel.hooks';
import { ChannelConfigurationRequest } from '../../../interfaces/channel.interface';
import { fetchCustomObjectQueryRepository } from '../../../repository/customObject.repository';
import ChannelSettings from '../channelSettings/ChannelSettings';
import TriggerSearchForm from '../createTrigger/TriggerSearchForm';
import Loader from '../loader';
import Logs from '../logs/Logs';
import SubscriptionList from '../subscriptionList/SubscriptionList';
import TabBar from '../tabBar/TabBar';
import styles from './channelPannel.module.css';

type ChannelPannelProps = {
    channel: string;
};

const ChannelPannel = ({ channel }: ChannelPannelProps) => {
    const [activeTab, setActiveTab] = useState('subscriptions');
    const [isChannelActive, setIsChannelActive] = useState(false);
    const [subscriptions, setSubscriptions] = useState<any>(null);
    const [messageData, setMessageData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [addSubscription, setAddSubscription] = useState(false);
    const [channelData, setChannelData] = useState<ChannelConfigurationRequest>({})
    const dispatch = useAsyncDispatch();

    const tabs = [
        { id: 'subscriptions', label: 'Subscriptions', icon: bellIcon },
        { id: 'logs', label: 'Logs', icon: logIcon },
        { id: 'settings', label: 'Settings', icon: settingsIcon },
    ];

    useEffect(() => {
        let isMounted = true; // Track mounted state

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetchCustomObjectQueryRepository(
                    dispatch,
                    'notify-subscriptions',
                    'notify-subscriptions-key',
                    'expand=value.references.channelReference'
                );

                if (isMounted) { // Only update state if component is mounted

                    if (response?.value?.channels?.[channel]) {
                        setSubscriptions(response.value.channels[channel]);
                        setChannelData(response.value.references.obj.value[channel].configurations || {});
                        const isEnabled = response.value.references?.obj?.value[channel]?.configurations?.isEnabled || false;
                        const messageBody = response.value.references?.obj?.value[channel]?.configurations?.messageBody || {};

                        setIsChannelActive(isEnabled);
                        setMessageData(messageBody);
                    } else {
                        // Set default empty values if no data found
                        setSubscriptions({ subscriptions: [] });
                        setChannelData({});
                        setIsChannelActive(false);
                        setMessageData({});
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error fetching subscriptions:", error);
                    setSubscriptions({ subscriptions: [] });
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [dispatch, channel]);

    const handleToggle = async (newState: boolean) => {
        setIsChannelActive(newState);
        await toggleChannelStatusHook(dispatch, channel, { isEnabled: newState });
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader />
            </div>
        );
    }
    const handleSetAddAddressClicked = () => {
        setAddSubscription(false);
        setActiveTab('settings')
    }
    const handleToggleAddSubscription = async (subscriptionClicked: boolean) => {
        setAddSubscription(!subscriptionClicked);
        if (addSubscription) {
            const response = await fetchCustomObjectQueryRepository(
                dispatch,
                'notify-subscriptions',
                'notify-subscriptions-key',
                'expand=value.references.channelReference'
            );

            setIsLoading(true);

            if (response?.value?.channels?.[channel]) {
                setSubscriptions(response.value.channels[channel]);
                setChannelData(response.value.references.obj.value[channel].configurations || {});
                const isEnabled = response.value.references?.obj?.value[channel]?.configurations?.isEnabled || false;
                const messageBody = response.value.references?.obj?.value[channel]?.configurations?.messageBody || {};

                setIsChannelActive(isEnabled);
                setMessageData(messageBody);
            } else {
                // Set default empty values if no data found
                setSubscriptions({ subscriptions: [] });
                setChannelData({});
                setIsChannelActive(false);
                setMessageData({});
            }
            setIsLoading(false);
        }
    }

    return (
        <div className={styles.panelContainer}>
            <div className={styles.panelHeader}>
                <div className={styles.headerContent}>
                    <h2 className={styles.channelTitle}>
                        <img src={channel === "whatsapp" ? whatsappIcon : channel === "email" ? emailIcon : smsIcon} alt="" />
                        Setup {channel.charAt(0).toUpperCase() + channel.slice(1)} triggers
                    </h2>
                    <p className={styles.channelDescription}>
                        Configure subscriptions, message templates, and channel settings
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <button
                        className={`${styles.actionButton} ${addSubscription ? styles.cancelButton : styles.addButton}`}
                        onClick={() => handleToggleAddSubscription(addSubscription)}
                    >
                        {addSubscription ? (
                            <>
                                <img src={closeIcon} alt="" />
                                <span>Cancel</span>
                            </>
                        ) : (
                            <>
                                <img src={addIcon} alt="" />
                                <span>Add Subscription</span>
                            </>
                        )}
                    </button>

                    <button
                        className={`${styles.toggleButton} ${isChannelActive ? styles.active : ''}`}
                        onClick={() => handleToggle(!isChannelActive)}

                        aria-pressed={isChannelActive}
                    >
                        {isChannelActive ? (
                            <div className={styles.toggleButtonRight}>
                                <div className={styles.toggleHandleRight}></div>
                            </div>
                        ) : (
                            <div className={styles.toggleButtonLeft}>
                                <div className={styles.toggleHandleLeft}></div>
                            </div>
                        )}
                        <span>{isChannelActive ? 'Active' : 'Inactive'}</span>
                    </button>
                </div>
            </div>

            <div className={styles.panelContent}>
                {addSubscription ? (
                    <div className={styles.subscriptionForm}>
                        <TriggerSearchForm channel={channel} channelConfigurations={channelData} setAddAddressClicked={handleSetAddAddressClicked} />
                    </div>
                ) : (
                    <>
                        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                        <div className={styles.tabContent}>
                            {activeTab === 'subscriptions' && (
                                <SubscriptionList
                                    subscriptionList={subscriptions}
                                    channel={channel}
                                    messageData={messageData}
                                />
                            )}
                            {activeTab === 'logs' && <Logs channel={channel} />}
                            {activeTab === 'settings' && <ChannelSettings channel={channel} />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChannelPannel;