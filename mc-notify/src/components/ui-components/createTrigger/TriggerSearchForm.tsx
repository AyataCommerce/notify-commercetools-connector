import { useAsyncDispatch } from '@commercetools-frontend/sdk';
import { useEffect, useState, useCallback } from 'react';
import { updateMessageBodyHook } from '../../../hooks/channel/updateChannel.hooks';
import { addSubscriptionHook } from '../../../hooks/subscription/addSubscription.hooks';
import { ChannelConfigurationRequest } from '../../../interfaces/channel.interface';
import { ChannelSubscriptions } from '../../../interfaces/subscription.interface';
import { fetchCustomObjectRepository } from '../../../repository/customObject.repository';
import { fetchCurrentResourceData } from '../../../repository/fetchResouces.repository';
import MessageBox from '../messageBox/MessageBox';
import PlaceholderSearch from '../placeholderSearch/PlaceholderSearch';
import styles from './TriggerSearchForm.module.css';

interface TriggerCategory {
    [category: string]: string[];
}

interface TriggerData {
    value: TriggerCategory;
}

interface TriggerInfo {
    category: string;
    trigger: string;
}

type TriggerSearchFormProps = {
    channel: string;
    channelConfigurations: ChannelConfigurationRequest;
    setAddAddressClicked: () => void;
};

const TriggerSearchForm = ({ channel, channelConfigurations, setAddAddressClicked }: TriggerSearchFormProps) => {
    const { sender_id: senderId } = channelConfigurations;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrigger, setSelectedTrigger] = useState<TriggerInfo | null>(null);
    const [messageBody, setMessageBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredTriggers, setFilteredTriggers] = useState<TriggerInfo[]>([]);
    const [triggerData, setTriggerData] = useState<TriggerData | null>(null);
    const [templateData, setTemplateData] = useState<{ id: string }[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [selectedTemplateData, setSelectedTemplateData] = useState<any>({});
    const [sendToPath, setSendToPath] = useState('');
    const [subject, setSubject] = useState('');
    const dispatch = useAsyncDispatch();

    const fetchTriggers = useCallback(async () => {
        try {
            const data = await fetchCustomObjectRepository(
                dispatch,
                'notify-trigger-list',
                'notify-trigger-list-key'
            ) as TriggerData;

            if (data?.value) {
                setTriggerData(data);
                const allTriggers: TriggerInfo[] = [];
                Object.entries(data.value).forEach(([category, triggers]) => {
                    if (Array.isArray(triggers)) {
                        triggers.forEach(trigger => {
                            allTriggers.push({
                                category,
                                trigger
                            });
                        });
                    }
                });
                setFilteredTriggers(allTriggers);
            }
        } catch (error) {
            console.error('Failed to fetch triggers:', error);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchTriggers();
    }, [fetchTriggers]);

    useEffect(() => {
        if (!triggerData?.value) return;

        const filterTriggers = () => {
            const allTriggers: TriggerInfo[] = [];
            Object.entries(triggerData.value).forEach(([category, triggers]) => {
                if (Array.isArray(triggers)) {
                    triggers.forEach(trigger => {
                        if (!searchTerm || trigger.toLowerCase().includes(searchTerm.toLowerCase())) {
                            allTriggers.push({
                                category,
                                trigger
                            });
                        }
                    });
                }
            });
            setFilteredTriggers(allTriggers);
        };

        filterTriggers();
    }, [searchTerm, triggerData]);

    const handleSubmit = useCallback(async () => {
        if (!selectedTrigger || !messageBody) return;

        setIsLoading(true);
        try {
            const messageUpdatedBody: ChannelSubscriptions = {
                subscriptions: [
                    {
                        resourceType: selectedTrigger.category,
                        triggers: [
                            {
                                triggerType: selectedTrigger.trigger,
                                subscribedAt: new Date().toISOString()
                            }
                        ]
                    }
                ]
            };

            await addSubscriptionHook(dispatch, channel, messageUpdatedBody);
            await updateMessageBodyHook(dispatch, channel, {
                [selectedTrigger.trigger]: {
                    subject: subject || '',
                    message: messageBody,
                    sendToPath: sendToPath
                }
            });

            // Reset form
            setSelectedTrigger(null);
            setMessageBody('');
            setSearchTerm('');
            setSelectedTemplate("");
            setSelectedTemplateData({});
            setSendToPath('');
            setSubject('');
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, channel, selectedTrigger, messageBody, subject, sendToPath]);

    const handleTriggerSelect = useCallback(async (triggerInfo: TriggerInfo) => {
        try {
            const response = await fetchCurrentResourceData(dispatch, triggerInfo.category);
            setTemplateData(response);
            setSelectedTrigger(triggerInfo);
            setSearchTerm(triggerInfo.trigger);
            setShowDropdown(false);
            // Reset template selection when trigger changes
            setSelectedTemplate("");
            setSelectedTemplateData({});
            setSendToPath('');
            setSubject('');
        } catch (error) {
            console.error('Failed to fetch template data:', error);
        }
    }, [dispatch]);

    const handleTemplateSelect = useCallback((templateId: string) => {
        const selectedData = templateData.find((item) => item.id === templateId);
        setSelectedTemplate(templateId);
        setSelectedTemplateData(selectedData || {});
        // Reset sendToPath when template changes
        setSendToPath('');
    }, [templateData]);

    const handleInputBlur = useCallback(() => {
        setTimeout(() => setShowDropdown(false), 200);
    }, []);

    const handlePlaceholderSelect = useCallback((placeholder: string) => {
        setSendToPath(placeholder);
    }, []);

    const isSenderIdMissing = !senderId || senderId === '';

    return (
        <div className={styles.formContainer}>
            <div className={styles.formGroup}>
                {isSenderIdMissing ? (
                    <div className={styles.showInfo}>
                        <div className={styles.infoText}>
                            <span className={styles.icon}>⚠️</span>
                            <small>{`Sender's "From" address is not configured. Please set it before proceeding.`}</small>
                        </div>
                        <button onClick={setAddAddressClicked}>Add Address</button>
                    </div>
                ) : (
                    <div className={styles.searchContainer}>
                        <label htmlFor="triggerSearch" className={styles.label}>
                            Search Trigger
                        </label>
                        <input
                            id="triggerSearch"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={handleInputBlur}
                            className={styles.searchInput}
                            placeholder="Type to search triggers..."
                            aria-autocomplete="list"
                            aria-controls="triggerDropdown"
                        />

                        {showDropdown && filteredTriggers.length > 0 && (
                            <ul
                                id="triggerDropdown"
                                className={styles.dropdown}
                                role="listbox"
                            >
                                {filteredTriggers.map((triggerInfo, index) => (
                                    <li
                                        key={`${triggerInfo.category}-${triggerInfo.trigger}-${index}`}
                                        className={styles.dropdownItem}
                                        onClick={() => handleTriggerSelect(triggerInfo)}
                                        role="option"
                                        aria-selected={selectedTrigger?.trigger === triggerInfo.trigger}
                                    >
                                        <div className={styles.searchChild}>
                                            <span>{triggerInfo.trigger}</span>
                                            <small>
                                                <strong>{triggerInfo.category}</strong>
                                            </small>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {selectedTrigger && (
                    <div className={styles.templateSearchContainer}>
                        <br />
                        <label htmlFor="templateSelection" className={styles.label}>
                            Choose {selectedTrigger.category} template
                        </label>
                        <select
                            id="templateSelection"
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            className={styles.searchInput}
                            disabled={!selectedTrigger}
                        >
                            <option value="">Select a template...</option>
                            {templateData.map((res) => (
                                <option key={res.id} value={res.id} className={styles.dropdownItem}>
                                    {selectedTrigger.category}-{res.id}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedTemplate && (
                    <div>
                        <br />
                        <label htmlFor="placeholderSearch" className={styles.label}>
                            Delivery address
                            <br />
                            <small>Choose the appropriate delivery address field.</small>
                        </label>
                        <PlaceholderSearch
                            templateData={selectedTemplateData}
                            onSelect={handlePlaceholderSelect}
                            placeholder="Search for variables to insert..."
                        />
                        <br />
                        {channel === 'email' && (
                            <MessageBox
                                selectedTemplateData={selectedTemplateData}
                                messageBody={subject}
                                onMessageChange={setSubject}
                                placeholder="Type your subject here. Use {{}} to insert variables..."
                                title="Add Subject"
                            />
                        )}
                        <MessageBox
                            selectedTemplateData={selectedTemplateData}
                            messageBody={messageBody}
                            onMessageChange={setMessageBody}
                            placeholder="Type your message here. Use {{}} to insert variables..."
                            title="Add message template"
                        />
                    </div>
                )}
            </div>

            {!isSenderIdMissing && selectedTrigger && templateData.length > 0 && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    className={styles.submitButton}
                    disabled={!selectedTrigger || !messageBody || isLoading}
                    aria-busy={isLoading}
                >
                    {isLoading ? (
                        <span className={styles.loadingIndicator}></span>
                    ) : (
                        'Save'
                    )}
                </button>
            )}
        </div>
    );
};

export default TriggerSearchForm;